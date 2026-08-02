/* by Capitanul burcea,alex */
const net = require('node:net');

const SERVERDATA_RESPONSE_VALUE = 0;
const SERVERDATA_EXECCOMMAND = 2;
const SERVERDATA_AUTH = 3;

function createPacket(id, type, body = '') {
  const bodyBuffer = Buffer.from(body, 'utf8');
  const packet = Buffer.alloc(14 + bodyBuffer.length);

  packet.writeInt32LE(10 + bodyBuffer.length, 0);
  packet.writeInt32LE(id, 4);
  packet.writeInt32LE(type, 8);
  bodyBuffer.copy(packet, 12);
  packet.writeInt16LE(0, 12 + bodyBuffer.length);

  return packet;
}

function parsePackets(buffer) {
  const packets = [];
  let offset = 0;

  while (buffer.length - offset >= 4) {
    const size = buffer.readInt32LE(offset);
    const packetEnd = offset + 4 + size;

    if (size < 10 || packetEnd > buffer.length) break;

    packets.push({
      id: buffer.readInt32LE(offset + 4),
      type: buffer.readInt32LE(offset + 8),
      body: buffer.subarray(offset + 12, packetEnd - 2).toString('utf8'),
    });

    offset = packetEnd;
  }

  return { packets, remaining: buffer.subarray(offset) };
}

function sendRconCommand({ host, port, password, command, timeoutMs = 5000 }) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port });
    const authId = 1;
    const commandId = 2;

    let buffer = Buffer.alloc(0);
    let authenticated = false;
    let commandSent = false;
    let response = '';
    let idleTimer;

    const cleanup = () => {
      clearTimeout(idleTimer);
      socket.removeAllListeners();
      socket.destroy();
    };

    const finish = () => {
      cleanup();
      resolve(response.trim() || 'Comanda a fost trimisa, dar serverul nu a returnat raspuns.');
    };

    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Conexiunea RCON a expirat.'));
    }, timeoutMs);

    socket.setNoDelay(true);

    socket.on('connect', () => {
      socket.write(createPacket(authId, SERVERDATA_AUTH, password));
    });

    socket.on('data', chunk => {
      buffer = Buffer.concat([buffer, chunk]);
      const parsed = parsePackets(buffer);
      buffer = parsed.remaining;

      for (const packet of parsed.packets) {
        if (!authenticated) {
          if (packet.id === -1) {
            clearTimeout(timeout);
            cleanup();
            reject(new Error('Autentificare RCON esuata. Verifica parola.'));
            return;
          }

          if (packet.id === authId) {
            authenticated = true;
            if (!commandSent) {
              commandSent = true;
              socket.write(createPacket(commandId, SERVERDATA_EXECCOMMAND, command));
            }
          }

          continue;
        }

        if (packet.id === commandId && packet.type === SERVERDATA_RESPONSE_VALUE) {
          response += packet.body;
          clearTimeout(idleTimer);
          idleTimer = setTimeout(() => {
            clearTimeout(timeout);
            finish();
          }, 250);
        }
      }
    });

    socket.on('error', err => {
      clearTimeout(timeout);
      cleanup();
      reject(err);
    });

    socket.on('close', () => {
      if (commandSent && response) {
        clearTimeout(timeout);
        finish();
      }
    });
  });
}

module.exports = { sendRconCommand };
