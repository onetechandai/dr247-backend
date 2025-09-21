// // server.js
// import express from 'express';
// import cors from 'cors';
// import dotenv from 'dotenv';
// import mongoose from 'mongoose';
// import jwt from 'jsonwebtoken';
// import Meeting from './models/Meeting.js';

// dotenv.config();

// const app = express();
// app.use(cors());
// app.use(express.json());

// // DB connect
// await mongoose.connect(process.env.MONGODB_URI);
// console.log('✅ MongoDB connected');

// // Utils
// const genCode = () => String(Math.floor(100000 + Math.random() * 900000));
// const sign = (payload) =>
//   jwt.sign(payload, process.env.MEETING_JWT_SECRET, { expiresIn: '30m' });

// // Health
// app.get('/', (_, res) => res.send('Meeting backend up ✅'));

// /**
//  * Create meeting
//  * Body: { appointmentId?, patientEmail, doctorEmail }
//  * Returns: { code, meetingId }
//  */
// app.post('/api/meetings/create', async (req, res) => {
//   try {
//     const { appointmentId, patientEmail, doctorEmail } = req.body;
//     if (!patientEmail || !doctorEmail) {
//       return res.status(400).json({ error: 'patientEmail and doctorEmail required' });
//     }
//     const code = genCode();
//     const meeting = await Meeting.create({
//       code,
//       appointmentId: appointmentId || null,
//       participants: [
//         { email: String(patientEmail).toLowerCase(), role: 'patient' },
//         { email: String(doctorEmail).toLowerCase(), role: 'doctor' },
//       ],
//     });
//     res.json({ code: meeting.code, meetingId: meeting._id });
//   } catch (e) {
//     res.status(400).json({ error: e.message });
//   }
// });

// /**
//  * Verify join
//  * Body: { code, email, role }
//  * Returns: { token, iceServers, signalingUrl }
//  */
// app.post('/api/meetings/verify', async (req, res) => {
//   try {
//     const { code, email, role } = req.body;
//     if (!code || !email || !role) {
//       return res.status(400).json({ error: 'code, email, role required' });
//     }
//     const meeting = await Meeting.findOne({ code });
//     if (!meeting) return res.status(400).json({ error: 'Invalid meeting code' });

//     const allowed = meeting.participants.some(
//       (p) => p.email === String(email).toLowerCase() && p.role === role
//     );
//     if (!allowed) return res.status(403).json({ error: 'Not allowed for this meeting' });

//     const token = sign({ code, email: String(email).toLowerCase(), role });

//     res.json({
//       token,
//       signalingUrl: process.env.SIGNALING_URL || 'ws://localhost:5081',
//       iceServers: [
//         { urls: ['stun:stun.l.google.com:19302'] },
//         { urls: ['turn:localhost:3478'], username: process.env.TURN_USER, credential: process.env.TURN_PASS },
//         // if you run TLS TURN:
//         // { urls: ['turns:your-turn-domain:5349'], username: process.env.TURN_USER, credential: process.env.TURN_PASS },
//       ],
//     });
//   } catch (e) {
//     res.status(400).json({ error: e.message });
//   }
// });

// app.listen(process.env.PORT || 5080, () =>
//   console.log(`🚀 Meeting API listening on http://localhost:${process.env.PORT || 5080}`)
// );
import http from 'http';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { WebSocketServer } from 'ws';

dotenv.config();

/* =========================
 * 1) Config
 * =======================*/
const {
  PORT = 5080,
  MONGODB_URI,
  MEETING_JWT_SECRET,
  FRONTEND_URL = 'http://localhost:3000',
  ADMIN_EMAIL = '',
  TURN_URL,
  TURN_USER,
  TURN_PASS,
} = process.env;

if (!MONGODB_URI) throw new Error('MONGODB_URI missing');
if (!MEETING_JWT_SECRET) throw new Error('MEETING_JWT_SECRET missing');

/* =========================
 * 2) Express + HTTP server
 * =======================*/
const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
const httpServer = http.createServer(app);

/* =========================
 * 3) Mongo + Model (inline)
 * =======================*/
await mongoose.connect(MONGODB_URI);
console.log('✅ MongoDB connected');

const ParticipantSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true },
  role:  { type: String, enum: ['patient', 'doctor', 'admin'], required: true },
}, { _id: false });

const MeetingSchema = new mongoose.Schema({
  code: { type: String, required: true, index: { unique: true } }, // 6-digit unique
  appointmentId: { type: String },
  participants: { type: [ParticipantSchema], default: [] },
  status: { type: String, enum: ['Scheduled', 'Live', 'Ended'], default: 'Scheduled' },
}, { timestamps: true });

const Meeting = mongoose.models.Meeting || mongoose.model('Meeting', MeetingSchema);

/* =========================
 * 4) Helpers
 * =======================*/
const genCode = () => String(Math.floor(100000 + Math.random() * 900000));
async function genUniqueCode() {
  for (let i = 0; i < 12; i++) {
    const c = genCode();
    const exists = await Meeting.exists({ code: c });
    if (!exists) return c;
  }
  throw new Error('Could not generate unique meeting code');
}
const sign = (payload, expSec = 1800) => jwt.sign(payload, MEETING_JWT_SECRET, { expiresIn: expSec }); // 30m

function buildIceServers() {
  const ice = [{ urls: ['stun:stun.l.google.com:19302'] }];
  if (TURN_URL && TURN_USER && TURN_PASS) {
    ice.push({ urls: [TURN_URL], username: TURN_USER, credential: TURN_PASS });
  }
  return ice;
}

const lower = (x) => String(x || '').trim().toLowerCase();

/* =========================
 * 5) REST Routes
 * =======================*/

// health
app.get('/', (_req, res) => res.send('Meeting backend up ✅'));

/**
 * Create Meeting
 * Body: { appointmentId?, patientEmail, doctorEmail }
 * Returns: { code, meetingId, patientUrl, doctorUrl, adminUrl? }
 */
app.post('/api/meetings/create', async (req, res) => {
  try {
    const { appointmentId, patientEmail, doctorEmail } = req.body || {};
    if (!patientEmail || !doctorEmail) {
      return res.status(400).json({ error: 'patientEmail and doctorEmail required' });
    }
    const code = await genUniqueCode();
    const participants = [
      { email: lower(patientEmail), role: 'patient' },
      { email: lower(doctorEmail),  role: 'doctor'  },
    ];
    if (ADMIN_EMAIL && !participants.some(p => p.email === lower(ADMIN_EMAIL))) {
      participants.push({ email: lower(ADMIN_EMAIL), role: 'admin' });
    }

    const meeting = await Meeting.create({ code, appointmentId: appointmentId || null, participants });

    // Ready-to-open links (SAME PAGE with meeting params)
    const patientUrl = `${FRONTEND_URL}/meeting?code=${code}&role=patient&email=${encodeURIComponent(lower(patientEmail))}`;
    const doctorUrl  = `${FRONTEND_URL}/meeting?code=${code}&role=doctor&email=${encodeURIComponent(lower(doctorEmail))}`;
    const adminUrl   = ADMIN_EMAIL ? `${FRONTEND_URL}/meeting?code=${code}&role=admin&email=${encodeURIComponent(lower(ADMIN_EMAIL))}` : null;

    res.json({ code: meeting.code, meetingId: meeting._id, patientUrl, doctorUrl, adminUrl });
  } catch (e) {
    if (e?.code === 11000) return res.status(409).json({ error: 'Code collision, retry' });
    res.status(400).json({ error: e?.message || 'Create failed' });
  }
});

/**
 * Verify Join
 * Body: { code, email, role }
 * Returns: { token, iceServers, signalingUrl }
 */
app.post('/api/meetings/verify', async (req, res) => {
  try {
    const { code, email, role } = req.body || {};
    if (!code || !email || !role) {
      return res.status(400).json({ error: 'code, email, role required' });
    }
    const meeting = await Meeting.findOne({ code });
    if (!meeting) return res.status(400).json({ error: 'Invalid meeting code' });
    if (meeting.status === 'Ended') return res.status(403).json({ error: 'Meeting ended' });

    const e = lower(email);
    const allowed = meeting.participants.some(p => p.email === e && p.role === role);
    if (!allowed) return res.status(403).json({ error: 'Not allowed for this meeting' });

    // Optional: set Live when first host verifies
    if ((role === 'doctor' || role === 'admin') && meeting.status === 'Scheduled') {
      meeting.status = 'Live';
      await meeting.save();
    }

    const token = sign({ code, email: e, role }, 60 * 60); // 60m ok
    const signalingUrl = `${(req.headers['x-forwarded-proto'] || 'http') === 'https' ? 'wss' : 'ws'}://${req.headers.host}/ws`;
    res.json({ token, iceServers: buildIceServers(), signalingUrl });
  } catch (e) {
    res.status(400).json({ error: e?.message || 'Verify failed' });
  }
});

/**
 * Quick link builder (optional)
 * GET /api/meetings/link?code=XXXXXX&email=u@e.com&role=patient
 * Returns: { url }
 */
app.get('/api/meetings/link', async (req, res) => {
  const { code, email, role } = req.query || {};
  if (!code || !email || !role) return res.status(400).json({ error: 'code, email, role required' });
  const url = `${FRONTEND_URL}/meeting?code=${encodeURIComponent(code)}&role=${encodeURIComponent(role)}&email=${encodeURIComponent(lower(email))}`;
  res.json({ url });
});


/* =========================
 * 6) WebSocket Signaling (same server)
 *    - Token-auth (first message)
 *    - Lobby: patient offers blocked until doctor/admin online
 *    - Route messages by toEmail (no broadcast leakage)
 * =======================*/
const wss = new WebSocketServer({ noServer: true });

// room map: code -> Map(email -> ws)
const rooms = new Map();
function getRoom(code) {
  if (!rooms.has(code)) rooms.set(code, new Map());
  return rooms.get(code);
}
function joinRoom(code, email, role, ws) {
  const room = getRoom(code);
  room.set(email, ws);
  ws._room = code;
  ws._email = email;
  ws._role = role;
}
function leaveRoom(ws) {
  const code = ws._room;
  const email = ws._email;
  if (!code) return;
  const room = rooms.get(code);
  if (!room) return;
  room.delete(email);
  if (room.size === 0) rooms.delete(code);
}
function roleOnline(code, role) {
  const room = rooms.get(code);
  if (!room) return false;
  for (const [, peer] of room) {
    if (peer._role === role && peer.readyState === 1) return true;
  }
  return false;
}

wss.on('connection', (ws) => {
  ws.isAlive = true;
  const authTimer = setTimeout(() => { if (!ws._authed) try { ws.close(4001, 'no-auth'); } catch {} }, 6000);

  ws.on('pong', () => { ws.isAlive = true; });

  ws.on('message', async (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    // First message must be auth
    if (!ws._authed) {
      if (msg.type !== 'auth' || !msg.token) return;
      try {
        const { code, email, role, exp } = jwt.verify(msg.token, MEETING_JWT_SECRET);
        // extra check: meeting exists & user present
        const meeting = await Meeting.findOne({ code });
        if (!meeting) throw new Error('bad-meeting');
        const allowed = meeting.participants.some(p => p.email === email && p.role === role);
        if (!allowed) throw new Error('bad-user');

        ws._authed = true;
        joinRoom(code, email, role, ws);
        ws.send(JSON.stringify({ type: 'auth-ok', you: { code, email, role, exp } }));
      } catch {
        ws.send(JSON.stringify({ type: 'auth-error' }));
        try { ws.close(4002, 'bad-token'); } catch {}
      }
      clearTimeout(authTimer);
      return;
    }

    // after auth…
    const code = ws._room;
    const room = rooms.get(code);
    if (!room) return;

    const sendTo = (toEmail, payload) => {
      const peer = room.get(lower(toEmail));
      if (peer && peer.readyState === 1) peer.send(JSON.stringify({ ...payload, fromEmail: ws._email }));
    };

    switch (msg.type) {
      case 'room:who': {
        const roster = [];
        for (const [email, peer] of room.entries()) {
          roster.push({ email, role: peer._role, online: peer.readyState === 1 });
        }
        ws.send(JSON.stringify({
          type: 'room:roster',
          roster,
          adminOnline: roleOnline(code, 'admin') || roleOnline(code, 'doctor'),
        }));
        break;
      }

      case 'rtc:offer': {
        // Lobby: patient cannot offer until doctor/admin online
        const hostOnline = roleOnline(code, 'admin') || roleOnline(code, 'doctor');
        if (ws._role === 'patient' && !hostOnline) {
          ws.send(JSON.stringify({ type: 'lobby:wait' }));
          return;
        }
        if (!msg.toEmail || !msg.sdp) return;
        sendTo(msg.toEmail, { type: 'rtc:offer', sdp: msg.sdp });
        break;
      }

      case 'rtc:answer': {
        if (!msg.toEmail || !msg.sdp) return;
        sendTo(msg.toEmail, { type: 'rtc:answer', sdp: msg.sdp });
        break;
      }

      case 'rtc:candidate': {
        if (!msg.toEmail || !msg.candidate) return;
        sendTo(msg.toEmail, { type: 'rtc:candidate', candidate: msg.candidate });
        break;
      }
    }
  });

  ws.on('close', () => leaveRoom(ws));
});

// upgrade HTTP → WS on /ws
httpServer.on('upgrade', (req, socket, head) => {
  const { url } = req;
  if (!url || !url.startsWith('/ws')) {
    socket.destroy(); return;
  }
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit('connection', ws, req);
  });
});

// heartbeat
setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) return ws.terminate();
    ws.isAlive = false;
    try { ws.ping(); } catch {}
  });
}, 15000);

/* =========================
 * 7) Start
 * =======================*/
httpServer.listen(PORT, () => {
  console.log(`🚀 HTTP+WS server on http://localhost:${PORT}`);
  console.log(`   WS endpoint: ws://localhost:${PORT}/ws`);
});
