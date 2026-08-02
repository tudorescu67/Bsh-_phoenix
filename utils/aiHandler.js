/* by Capitanul burcea,alex */
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

let browser;

const COOKIES_PATH = path.join(__dirname, '..', 'data', 'cookies');
if (!fs.existsSync(COOKIES_PATH)) fs.mkdirSync(COOKIES_PATH, { recursive: true });

const AI_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS || 45000);
const AI_SYSTEM_PROMPT = process.env.AI_SYSTEM_PROMPT
  || 'Esti Phoenix AI, un asistent prietenos pentru un server Discord romanesc. Raspunde clar, util si concis.';
const CHROME_EXECUTABLE_PATH = process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_PATH;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timeout dupa ${ms / 1000}s`)), ms);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function cleanAIText(value) {
  return String(value || '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function splitDiscordText(text, maxLength = 3800) {
  const clean = cleanAIText(text);
  if (clean.length <= maxLength) return [clean || 'Nu am primit raspuns.'];

  const chunks = [];
  let rest = clean;

  while (rest.length > maxLength) {
    let index = rest.lastIndexOf('\n\n', maxLength);
    if (index < maxLength * 0.5) index = rest.lastIndexOf('\n', maxLength);
    if (index < maxLength * 0.5) index = rest.lastIndexOf(' ', maxLength);
    if (index < 1) index = maxLength;

    chunks.push(rest.slice(0, index).trim());
    rest = rest.slice(index).trim();
  }

  if (rest) chunks.push(rest);
  return chunks;
}

function getOpenAIText(data) {
  if (data?.output_text) return data.output_text;

  return (data?.output || [])
    .flatMap(item => item.content || [])
    .map(item => item.text)
    .filter(Boolean)
    .join('\n');
}

async function getBrowserInstance() {
  if (!browser) {
    try {
      browser = await puppeteer.launch({
        headless: 'new',
        executablePath: CHROME_EXECUTABLE_PATH || undefined,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });
    } catch (err) {
      if (/Could not find Chrome|Browser was not found|executable/i.test(err.message)) {
        throw new Error(
          'Chrome pentru AI nu este instalat. Instaleaza Chromium sau Chrome pe server si seteaza PUPPETEER_EXECUTABLE_PATH catre binarul sistemului, de exemplu /usr/bin/chromium.'
        );
      }

      throw err;
    }
  }

  return browser;
}

async function chatWithOllama(message) {
  const url = process.env.OLLAMA_URL || 'http://localhost:11434/api/generate';
  const model = process.env.OLLAMA_MODEL || 'llama3.1';

  const response = await axios.post(url, {
    model,
    prompt: `${AI_SYSTEM_PROMPT}\n\nUser: ${message}\nAssistant:`,
    stream: false
  }, { timeout: AI_TIMEOUT_MS });

  return response.data?.response;
}

async function chatWithOpenAI(message) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY lipseste din .env.');
  }

  const response = await axios.post('https://api.openai.com/v1/responses', {
    model: OPENAI_MODEL,
    instructions: AI_SYSTEM_PROMPT,
    input: message
  }, {
    timeout: AI_TIMEOUT_MS,
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  return getOpenAIText(response.data);
}

async function chatWithDuckDuckGo(provider, message) {
  let context;
  let page;

  try {
    const browserInstance = await getBrowserInstance();
    context = typeof browserInstance.createIncognitoBrowserContext === 'function'
      ? await browserInstance.createIncognitoBrowserContext()
      : await browserInstance.createBrowserContext();
    page = await context.newPage();

    const cookieFile = path.join(COOKIES_PATH, `${provider}.json`);
    if (fs.existsSync(cookieFile)) {
      const cookies = JSON.parse(fs.readFileSync(cookieFile, 'utf8'));
      if (Array.isArray(cookies) && cookies.length > 0) await page.setCookie(...cookies);
    }

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.goto('https://duckduckgo.com/?q=DuckDuckGo+AI+Chat&ia=chat', {
      waitUntil: 'networkidle2',
      timeout: AI_TIMEOUT_MS
    });

    const agreeBtn = await page.$('button[data-testid="ai-chat-welcome-screen-agree-button"]');
    if (agreeBtn) await agreeBtn.click();

    await page.waitForSelector('textarea[data-testid="ai-chat-textarea"]', { timeout: 15000 });
    await page.type('textarea[data-testid="ai-chat-textarea"]', message.slice(0, 6000));
    await page.keyboard.press('Enter');

    await page.waitForSelector('div[data-testid="ai-chat-response"]', { timeout: AI_TIMEOUT_MS });

    let previous = '';
    let stableTicks = 0;
    for (let i = 0; i < 20; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const current = await page.evaluate(() => {
        const responses = document.querySelectorAll('div[data-testid="ai-chat-response"]');
        return responses[responses.length - 1]?.innerText || '';
      });

      if (current && current === previous) stableTicks += 1;
      else stableTicks = 0;
      previous = current;
      if (stableTicks >= 2) break;
    }

    return previous;
  } finally {
    if (page) await page.close().catch(() => {});
    if (context) await context.close().catch(() => {});
  }
}

async function chatWithAI(provider, message) {
  const selected = String(provider || 'auto').toLowerCase();
  const text = String(message || '').trim();
  if (!text) return 'Scrie o intrebare mai intai.';

  const providers = selected === 'auto'
    ? ['openai', 'ollama', 'duckduckgo']
    : [selected];

  let lastError;
  for (const item of providers) {
    try {
      const response = await withTimeout((async () => {
        if (item === 'openai') return chatWithOpenAI(text);
        if (item === 'ollama') return chatWithOllama(text);
        if (!['duckduckgo', 'claude', 'gemini'].includes(item)) {
          throw new Error(`Provider AI necunoscut: ${item}`);
        }
        return chatWithDuckDuckGo(item, text);
      })(), AI_TIMEOUT_MS, item);

      const clean = cleanAIText(response);
      if (clean) return clean;
      lastError = new Error(`${item} nu a returnat text.`);
    } catch (err) {
      lastError = err;
      console.error(`[AI Error] ${item}:`, err.message);
    }
  }

  return `Nu am putut obtine un raspuns AI. Ultima eroare: ${lastError?.message || 'necunoscuta'}`;
}

async function closeAI() {
  if (browser) {
    await browser.close().catch(() => {});
    browser = null;
  }
}

module.exports = { chatWithAI, splitDiscordText, closeAI };
