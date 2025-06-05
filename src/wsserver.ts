import { BrowserWindow } from 'electron';
import { v4 as uuid } from 'uuid';
import { sleep } from './utils';
import WebSocket from 'ws';
import path from 'path';
import fs from 'fs';

const WSS_PORT = 51062;
const ASCII_CHUNK = 2;
const START_CMD = 'chatgif ';

export async function executeWsserver(win: BrowserWindow): Promise<void> {
  const wss = new WebSocket.Server({ port: WSS_PORT, host: '127.0.0.1' });
  wss.on('connection', ws => connectHandle(ws, win));
}

function connectHandle(ws: WebSocket, win: BrowserWindow) {
  ws.send(JSON.stringify({
    header: {
      version: 1, requestId: uuid(),
      messageType: 'commandRequest',
      messagePurpose: 'subscribe'
    },
    body: { eventName: 'PlayerMessage' }
  }));

  ws.on('message', async buffer => {
    const msg = JSON.parse(buffer.toString()).body.message;
    if (msg === undefined || !msg.toLowerCase().startsWith(START_CMD)) return;

    const asciiPath = path.join(__dirname, '../asciis', msg.replace(START_CMD, ''));
    if (!fs.existsSync(asciiPath)) { sendCommand(ws, `w @s §r§cCould not find the Gif`); return; }

    runChatGif(ws, asciiPath);
  });

  ws.on('close', () => win.webContents.send('client-remove-render'));
  win.webContents.send('client-add-render', (ws as any)._socket.remotePort);
}

async function runChatGif(ws: WebSocket, asciiPath: string) {
  const files = fs.readdirSync(asciiPath)
    .filter(f => f.endsWith('.txt'))
    .map(f => ({ file: f, num: parseInt(f.match(/\d+/)?.[0] || '0') }))
    .sort((a, b) => a.num - b.num)
    .map(f => f.file);

  for (const file of files) {
    const lines = fs.readFileSync(path.join(asciiPath, file), 'utf-8').split('\n');

    for (let i = 0; i < lines.length; i += ASCII_CHUNK) {
      const chunk = lines.slice(i, i + ASCII_CHUNK).join('\n');
      sendCommand(ws, `tellraw @a {"rawtext":[{"text":"${chunk}"}]}`);
    }

    await sleep(100);
  }

  sendCommand(ws, `w @s §r§aThe Gif output has been completed.`);
}

function sendCommand(ws: WebSocket, cmd: string) {
  ws.send(JSON.stringify({
    header: {
      version: 1, requestId: uuid(),
      messageType: 'commandRequest',
      messagePurpose: 'commandRequest'
    },
    body: { commandLine: cmd }
  }));
}
