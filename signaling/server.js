// signaling/server.js
import http from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.MEETING_JWT_SECRET;
const server = http.createServer();
const wss = new WebSocketServer({ server });

// roomCode -> Set<ws>
const rooms = new Map();

function joinRoom(code, ws) {
  if (!rooms.has(code)) rooms.set(code, new Set());
  rooms.get(code).add(ws);
  ws._room = code;
}
function leaveRoom(ws) {
  const code = ws._room;
  if (!code || !rooms.has(code)) return;
  rooms.get(code).delete(ws);
  if (rooms.get(code).size === 0) rooms.delete(code);
}

wss.on('connection', (ws) => {
  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    // First message must be auth {type:'auth', token}
    if (msg.type === 'auth') {
      try {
        const payload = jwt.verify(msg.token, JWT_SECRET); // {code,email,role}
        ws._user = payload;
        joinRoom(payload.code, ws);
        ws.send(JSON.stringify({ type: 'auth-ok', you: payload }));
      } catch {
        ws.send(JSON.stringify({ type: 'auth-error' }));
        ws.close();
      }
      return;
    }

    // Relay only inside the same room
    if (!ws._user) return;
    const peers = rooms.get(ws._user.code) || new Set();
    peers.forEach((p) => {
      if (p !== ws && p.readyState === WebSocket.OPEN) {
        p.send(JSON.stringify({ ...msg, from: ws._user.email }));
      }
    });
  });

  ws.on('close', () => leaveRoom(ws));
});

server.listen(5081, () => console.log('📡 Signaling WS on ws://localhost:5081'));
