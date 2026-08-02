const fetch = require('node-fetch');

const API_URL = 'http://127.0.0.1:3001/api/bot/update';

async function pushBotState(payload) {
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    console.log('Sent to dashboard:', data.ok);
  } catch (error) {
    console.error('Error sending to dashboard:', error.message);
  }
}

pushBotState({
  overview: {
    stats: {
      members: '13.2k',
      tickets: 21,
      giveaways: 4,
      security: '98%'
    }
  },
  status: {
    botOnline: true
  },
  logs: [
    { type: 'green', text: 'Phoenix bot conectat la dashboard', time: 'acum 1 min' }
  ]
});
