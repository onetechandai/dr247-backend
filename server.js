// // // // // // server.js
// // // // // import express from 'express';
// // // // // import cors from 'cors';
// // // // // import dotenv from 'dotenv';
// // // // // import mongoose from 'mongoose';
// // // // // import jwt from 'jsonwebtoken';
// // // // // import Meeting from './models/Meeting.js';

// // // // // dotenv.config();

// // // // // const app = express();
// // // // // app.use(cors());
// // // // // app.use(express.json());

// // // // // // DB connect
// // // // // await mongoose.connect(process.env.MONGODB_URI);
// // // // // console.log('✅ MongoDB connected');

// // // // // // Utils
// // // // // const genCode = () => String(Math.floor(100000 + Math.random() * 900000));
// // // // // const sign = (payload) =>
// // // // //   jwt.sign(payload, process.env.MEETING_JWT_SECRET, { expiresIn: '30m' });

// // // // // // Health
// // // // // app.get('/', (_, res) => res.send('Meeting backend up ✅'));

// // // // // /**
// // // // //  * Create meeting
// // // // //  * Body: { appointmentId?, patientEmail, doctorEmail }
// // // // //  * Returns: { code, meetingId }
// // // // //  */
// // // // // app.post('/api/meetings/create', async (req, res) => {
// // // // //   try {
// // // // //     const { appointmentId, patientEmail, doctorEmail } = req.body;
// // // // //     if (!patientEmail || !doctorEmail) {
// // // // //       return res.status(400).json({ error: 'patientEmail and doctorEmail required' });
// // // // //     }
// // // // //     const code = genCode();
// // // // //     const meeting = await Meeting.create({
// // // // //       code,
// // // // //       appointmentId: appointmentId || null,
// // // // //       participants: [
// // // // //         { email: String(patientEmail).toLowerCase(), role: 'patient' },
// // // // //         { email: String(doctorEmail).toLowerCase(), role: 'doctor' },
// // // // //       ],
// // // // //     });
// // // // //     res.json({ code: meeting.code, meetingId: meeting._id });
// // // // //   } catch (e) {
// // // // //     res.status(400).json({ error: e.message });
// // // // //   }
// // // // // });

// // // // // /**
// // // // //  * Verify join
// // // // //  * Body: { code, email, role }
// // // // //  * Returns: { token, iceServers, signalingUrl }
// // // // //  */
// // // // // app.post('/api/meetings/verify', async (req, res) => {
// // // // //   try {
// // // // //     const { code, email, role } = req.body;
// // // // //     if (!code || !email || !role) {
// // // // //       return res.status(400).json({ error: 'code, email, role required' });
// // // // //     }
// // // // //     const meeting = await Meeting.findOne({ code });
// // // // //     if (!meeting) return res.status(400).json({ error: 'Invalid meeting code' });

// // // // //     const allowed = meeting.participants.some(
// // // // //       (p) => p.email === String(email).toLowerCase() && p.role === role
// // // // //     );
// // // // //     if (!allowed) return res.status(403).json({ error: 'Not allowed for this meeting' });

// // // // //     const token = sign({ code, email: String(email).toLowerCase(), role });

// // // // //     res.json({
// // // // //       token,
// // // // //       signalingUrl: process.env.SIGNALING_URL || 'ws://localhost:5081',
// // // // //       iceServers: [
// // // // //         { urls: ['stun:stun.l.google.com:19302'] },
// // // // //         { urls: ['turn:localhost:3478'], username: process.env.TURN_USER, credential: process.env.TURN_PASS },
// // // // //         // if you run TLS TURN:
// // // // //         // { urls: ['turns:your-turn-domain:5349'], username: process.env.TURN_USER, credential: process.env.TURN_PASS },
// // // // //       ],
// // // // //     });
// // // // //   } catch (e) {
// // // // //     res.status(400).json({ error: e.message });
// // // // //   }
// // // // // });

// // // // // app.listen(process.env.PORT || 5080, () =>
// // // // //   console.log(`🚀 Meeting API listening on http://localhost:${process.env.PORT || 5080}`)
// // // // // );



// // // // import http from 'http';
// // // // import express from 'express';
// // // // import cors from 'cors';
// // // // import dotenv from 'dotenv';
// // // // import mongoose from 'mongoose';
// // // // import jwt from 'jsonwebtoken';
// // // // import { WebSocketServer } from 'ws';

// // // // dotenv.config();

// // // // /* =========================
// // // //  * 1) Config
// // // //  * =======================*/
// // // // const {
// // // //   PORT = 5080,
// // // //   MONGODB_URI,
// // // //   MEETING_JWT_SECRET,
// // // //   FRONTEND_URL = 'http://localhost:3000',
// // // //   ADMIN_EMAIL = '',
// // // //   TURN_URL,
// // // //   TURN_USER,
// // // //   TURN_PASS,
// // // // } = process.env;

// // // // if (!MONGODB_URI) throw new Error('MONGODB_URI missing');
// // // // if (!MEETING_JWT_SECRET) throw new Error('MEETING_JWT_SECRET missing');

// // // // /* =========================
// // // //  * 2) Express + HTTP server
// // // //  * =======================*/
// // // // const app = express();
// // // // app.use(cors({ origin: true, credentials: true }));
// // // // app.use(express.json());
// // // // const httpServer = http.createServer(app);

// // // // /* =========================
// // // //  * 3) Mongo + Model (inline)
// // // //  * =======================*/
// // // // await mongoose.connect(MONGODB_URI);
// // // // console.log('✅ MongoDB connected');

// // // // const ParticipantSchema = new mongoose.Schema({
// // // //   email: { type: String, required: true, lowercase: true, trim: true },
// // // //   role:  { type: String, enum: ['patient', 'doctor', 'admin'], required: true },
// // // // }, { _id: false });

// // // // const MeetingSchema = new mongoose.Schema({
// // // //   code: { type: String, required: true, index: { unique: true } }, // 6-digit unique
// // // //   appointmentId: { type: String },
// // // //   participants: { type: [ParticipantSchema], default: [] },
// // // //   status: { type: String, enum: ['Scheduled', 'Live', 'Ended'], default: 'Scheduled' },
// // // // }, { timestamps: true });

// // // // const Meeting = mongoose.models.Meeting || mongoose.model('Meeting', MeetingSchema);

// // // // /* =========================
// // // //  * 4) Helpers
// // // //  * =======================*/
// // // // const genCode = () => String(Math.floor(100000 + Math.random() * 900000));
// // // // async function genUniqueCode() {
// // // //   for (let i = 0; i < 12; i++) {
// // // //     const c = genCode();
// // // //     const exists = await Meeting.exists({ code: c });
// // // //     if (!exists) return c;
// // // //   }
// // // //   throw new Error('Could not generate unique meeting code');
// // // // }
// // // // const sign = (payload, expSec = 1800) => jwt.sign(payload, MEETING_JWT_SECRET, { expiresIn: expSec }); // 30m

// // // // function buildIceServers() {
// // // //   const ice = [{ urls: ['stun:stun.l.google.com:19302'] }];
// // // //   if (TURN_URL && TURN_USER && TURN_PASS) {
// // // //     ice.push({ urls: [TURN_URL], username: TURN_USER, credential: TURN_PASS });
// // // //   }
// // // //   return ice;
// // // // }

// // // // const lower = (x) => String(x || '').trim().toLowerCase();

// // // // /* =========================
// // // //  * 5) REST Routes
// // // //  * =======================*/

// // // // // health
// // // // app.get('/', (_req, res) => res.send('Meeting backend up ✅'));

// // // // /**
// // // //  * Create Meeting
// // // //  * Body: { appointmentId?, patientEmail, doctorEmail }
// // // //  * Returns: { code, meetingId, patientUrl, doctorUrl, adminUrl? }
// // // //  */
// // // // app.post('/api/meetings/create', async (req, res) => {
// // // //   try {
// // // //     const { appointmentId, patientEmail, doctorEmail } = req.body || {};
// // // //     if (!patientEmail || !doctorEmail) {
// // // //       return res.status(400).json({ error: 'patientEmail and doctorEmail required' });
// // // //     }
// // // //     const code = await genUniqueCode();
// // // //     const participants = [
// // // //       { email: lower(patientEmail), role: 'patient' },
// // // //       { email: lower(doctorEmail),  role: 'doctor'  },
// // // //     ];
// // // //     if (ADMIN_EMAIL && !participants.some(p => p.email === lower(ADMIN_EMAIL))) {
// // // //       participants.push({ email: lower(ADMIN_EMAIL), role: 'admin' });
// // // //     }

// // // //     const meeting = await Meeting.create({ code, appointmentId: appointmentId || null, participants });

// // // //     // Ready-to-open links (SAME PAGE with meeting params)
// // // //     const patientUrl = `${FRONTEND_URL}/meeting?code=${code}&role=patient&email=${encodeURIComponent(lower(patientEmail))}`;
// // // //     const doctorUrl  = `${FRONTEND_URL}/meeting?code=${code}&role=doctor&email=${encodeURIComponent(lower(doctorEmail))}`;
// // // //     const adminUrl   = ADMIN_EMAIL ? `${FRONTEND_URL}/meeting?code=${code}&role=admin&email=${encodeURIComponent(lower(ADMIN_EMAIL))}` : null;

// // // //     res.json({ code: meeting.code, meetingId: meeting._id, patientUrl, doctorUrl, adminUrl });
// // // //   } catch (e) {
// // // //     if (e?.code === 11000) return res.status(409).json({ error: 'Code collision, retry' });
// // // //     res.status(400).json({ error: e?.message || 'Create failed' });
// // // //   }
// // // // });

// // // // /**
// // // //  * Verify Join
// // // //  * Body: { code, email, role }
// // // //  * Returns: { token, iceServers, signalingUrl }
// // // //  */
// // // // app.post('/api/meetings/verify', async (req, res) => {
// // // //   try {
// // // //     const { code, email, role } = req.body || {};
// // // //     if (!code || !email || !role) {
// // // //       return res.status(400).json({ error: 'code, email, role required' });
// // // //     }
// // // //     const meeting = await Meeting.findOne({ code });
// // // //     if (!meeting) return res.status(400).json({ error: 'Invalid meeting code' });
// // // //     if (meeting.status === 'Ended') return res.status(403).json({ error: 'Meeting ended' });

// // // //     const e = lower(email);
// // // //     const allowed = meeting.participants.some(p => p.email === e && p.role === role);
// // // //     if (!allowed) return res.status(403).json({ error: 'Not allowed for this meeting' });

// // // //     // Optional: set Live when first host verifies
// // // //     if ((role === 'doctor' || role === 'admin') && meeting.status === 'Scheduled') {
// // // //       meeting.status = 'Live';
// // // //       await meeting.save();
// // // //     }

// // // //     const token = sign({ code, email: e, role }, 60 * 60); // 60m ok
// // // //     const signalingUrl = `${(req.headers['x-forwarded-proto'] || 'http') === 'https' ? 'wss' : 'ws'}://${req.headers.host}/ws`;
// // // //     res.json({ token, iceServers: buildIceServers(), signalingUrl });
// // // //   } catch (e) {
// // // //     res.status(400).json({ error: e?.message || 'Verify failed' });
// // // //   }
// // // // });

// // // // /**
// // // //  * Quick link builder (optional)
// // // //  * GET /api/meetings/link?code=XXXXXX&email=u@e.com&role=patient
// // // //  * Returns: { url }
// // // //  */
// // // // app.get('/api/meetings/link', async (req, res) => {
// // // //   const { code, email, role } = req.query || {};
// // // //   if (!code || !email || !role) return res.status(400).json({ error: 'code, email, role required' });
// // // //   const url = `${FRONTEND_URL}/meeting?code=${encodeURIComponent(code)}&role=${encodeURIComponent(role)}&email=${encodeURIComponent(lower(email))}`;
// // // //   res.json({ url });
// // // // });


// // // // /* =========================
// // // //  * 6) WebSocket Signaling (same server)
// // // //  *    - Token-auth (first message)
// // // //  *    - Lobby: patient offers blocked until doctor/admin online
// // // //  *    - Route messages by toEmail (no broadcast leakage)
// // // //  * =======================*/
// // // // const wss = new WebSocketServer({ noServer: true });

// // // // // room map: code -> Map(email -> ws)
// // // // const rooms = new Map();
// // // // function getRoom(code) {
// // // //   if (!rooms.has(code)) rooms.set(code, new Map());
// // // //   return rooms.get(code);
// // // // }
// // // // function joinRoom(code, email, role, ws) {
// // // //   const room = getRoom(code);
// // // //   room.set(email, ws);
// // // //   ws._room = code;
// // // //   ws._email = email;
// // // //   ws._role = role;
// // // // }
// // // // function leaveRoom(ws) {
// // // //   const code = ws._room;
// // // //   const email = ws._email;
// // // //   if (!code) return;
// // // //   const room = rooms.get(code);
// // // //   if (!room) return;
// // // //   room.delete(email);
// // // //   if (room.size === 0) rooms.delete(code);
// // // // }
// // // // function roleOnline(code, role) {
// // // //   const room = rooms.get(code);
// // // //   if (!room) return false;
// // // //   for (const [, peer] of room) {
// // // //     if (peer._role === role && peer.readyState === 1) return true;
// // // //   }
// // // //   return false;
// // // // }

// // // // wss.on('connection', (ws) => {
// // // //   ws.isAlive = true;
// // // //   const authTimer = setTimeout(() => { if (!ws._authed) try { ws.close(4001, 'no-auth'); } catch {} }, 6000);

// // // //   ws.on('pong', () => { ws.isAlive = true; });

// // // //   ws.on('message', async (raw) => {
// // // //     let msg;
// // // //     try { msg = JSON.parse(raw); } catch { return; }

// // // //     // First message must be auth
// // // //     if (!ws._authed) {
// // // //       if (msg.type !== 'auth' || !msg.token) return;
// // // //       try {
// // // //         const { code, email, role, exp } = jwt.verify(msg.token, MEETING_JWT_SECRET);
// // // //         // extra check: meeting exists & user present
// // // //         const meeting = await Meeting.findOne({ code });
// // // //         if (!meeting) throw new Error('bad-meeting');
// // // //         const allowed = meeting.participants.some(p => p.email === email && p.role === role);
// // // //         if (!allowed) throw new Error('bad-user');

// // // //         ws._authed = true;
// // // //         joinRoom(code, email, role, ws);
// // // //         ws.send(JSON.stringify({ type: 'auth-ok', you: { code, email, role, exp } }));
// // // //       } catch {
// // // //         ws.send(JSON.stringify({ type: 'auth-error' }));
// // // //         try { ws.close(4002, 'bad-token'); } catch {}
// // // //       }
// // // //       clearTimeout(authTimer);
// // // //       return;
// // // //     }

// // // //     // after auth…
// // // //     const code = ws._room;
// // // //     const room = rooms.get(code);
// // // //     if (!room) return;

// // // //     const sendTo = (toEmail, payload) => {
// // // //       const peer = room.get(lower(toEmail));
// // // //       if (peer && peer.readyState === 1) peer.send(JSON.stringify({ ...payload, fromEmail: ws._email }));
// // // //     };

// // // //     switch (msg.type) {
// // // //       case 'room:who': {
// // // //         const roster = [];
// // // //         for (const [email, peer] of room.entries()) {
// // // //           roster.push({ email, role: peer._role, online: peer.readyState === 1 });
// // // //         }
// // // //         ws.send(JSON.stringify({
// // // //           type: 'room:roster',
// // // //           roster,
// // // //           adminOnline: roleOnline(code, 'admin') || roleOnline(code, 'doctor'),
// // // //         }));
// // // //         break;
// // // //       }

// // // //       case 'rtc:offer': {
// // // //         // Lobby: patient cannot offer until doctor/admin online
// // // //         const hostOnline = roleOnline(code, 'admin') || roleOnline(code, 'doctor');
// // // //         if (ws._role === 'patient' && !hostOnline) {
// // // //           ws.send(JSON.stringify({ type: 'lobby:wait' }));
// // // //           return;
// // // //         }
// // // //         if (!msg.toEmail || !msg.sdp) return;
// // // //         sendTo(msg.toEmail, { type: 'rtc:offer', sdp: msg.sdp });
// // // //         break;
// // // //       }

// // // //       case 'rtc:answer': {
// // // //         if (!msg.toEmail || !msg.sdp) return;
// // // //         sendTo(msg.toEmail, { type: 'rtc:answer', sdp: msg.sdp });
// // // //         break;
// // // //       }

// // // //       case 'rtc:candidate': {
// // // //         if (!msg.toEmail || !msg.candidate) return;
// // // //         sendTo(msg.toEmail, { type: 'rtc:candidate', candidate: msg.candidate });
// // // //         break;
// // // //       }
// // // //     }
// // // //   });

// // // //   ws.on('close', () => leaveRoom(ws));
// // // // });

// // // // // upgrade HTTP → WS on /ws
// // // // httpServer.on('upgrade', (req, socket, head) => {
// // // //   const { url } = req;
// // // //   if (!url || !url.startsWith('/ws')) {
// // // //     socket.destroy(); return;
// // // //   }
// // // //   wss.handleUpgrade(req, socket, head, (ws) => {
// // // //     wss.emit('connection', ws, req);
// // // //   });
// // // // });

// // // // // heartbeat
// // // // setInterval(() => {
// // // //   wss.clients.forEach((ws) => {
// // // //     if (!ws.isAlive) return ws.terminate();
// // // //     ws.isAlive = false;
// // // //     try { ws.ping(); } catch {}
// // // //   });
// // // // }, 15000);

// // // // /* =========================
// // // //  * 7) Start
// // // //  * =======================*/
// // // // httpServer.listen(PORT, () => {
// // // //   console.log(`🚀 HTTP+WS server on http://localhost:${PORT}`);
// // // //   console.log(`   WS endpoint: ws://localhost:${PORT}/ws`);
// // // // });
// // // // meeting-server/index.js
// // // // server.js

// // // // import http from 'http';
// // // // import express from 'express';
// // // // import cors from 'cors';
// // // // import dotenv from 'dotenv';
// // // // import mongoose from 'mongoose';
// // // // import jwt from 'jsonwebtoken';
// // // // import { WebSocketServer } from 'ws';

// // // // dotenv.config();

// // // // /* ========== 1) Config ========== */
// // // // const {
// // // //   PORT = 5080,
// // // //   MONGODB_URI,
// // // //   MEETING_JWT_SECRET,
// // // //   FRONTEND_URL = 'http://localhost:3000',
// // // //   ADMIN_EMAIL = '',           // optional: default admin auto-added on meeting create
// // // //   TURN_URL,
// // // //   TURN_USER,
// // // //   TURN_PASS,
// // // // } = process.env;

// // // // if (!MONGODB_URI) throw new Error('MONGODB_URI missing');
// // // // if (!MEETING_JWT_SECRET) throw new Error('MEETING_JWT_SECRET missing');

// // // // /* ========== 2) Express + HTTP ========== */
// // // // const app = express();
// // // // app.use(cors({ origin: true, credentials: true }));
// // // // app.use(express.json());
// // // // const httpServer = http.createServer(app);

// // // // /* ========== 3) Mongo Models ========== */
// // // // await mongoose.connect(MONGODB_URI);
// // // // console.log('✅ MongoDB connected');

// // // // const ParticipantSchema = new mongoose.Schema(
// // // //   {
// // // //     email: { type: String, required: true, lowercase: true, trim: true },
// // // //     role:  { type: String, enum: ['patient', 'doctor', 'admin'], required: true },
// // // //   },
// // // //   { _id: false }
// // // // );

// // // // const MeetingSchema = new mongoose.Schema(
// // // //   {
// // // //     code: { type: String, required: true, index: { unique: true } }, // 6-digit
// // // //     appointmentId: { type: String },
// // // //     participants: { type: [ParticipantSchema], default: [] },         // [{email,role}]
// // // //     status: { type: String, enum: ['Scheduled', 'Live', 'Ended'], default: 'Scheduled' },
// // // //   },
// // // //   { timestamps: true }
// // // // );

// // // // const Meeting = mongoose.models.Meeting || mongoose.model('Meeting', MeetingSchema);

// // // // /* ========== 4) Helpers ========== */
// // // // const genCode = () => String(Math.floor(100000 + Math.random() * 900000));
// // // // async function genUniqueCode() {
// // // //   for (let i = 0; i < 12; i++) {
// // // //     const c = genCode();
// // // //     const exists = await Meeting.exists({ code: c });
// // // //     if (!exists) return c;
// // // //   }
// // // //   throw new Error('Could not generate unique meeting code');
// // // // }
// // // // const sign = (payload, expSec = 3600) => jwt.sign(payload, MEETING_JWT_SECRET, { expiresIn: expSec });

// // // // function buildIceServers() {
// // // //   const ice = [{ urls: ['stun:stun.l.google.com:19302'] }];
// // // //   if (TURN_URL && TURN_USER && TURN_PASS) {
// // // //     ice.push({ urls: [TURN_URL], username: TURN_USER, credential: TURN_PASS });
// // // //   }
// // // //   return ice;
// // // // }
// // // // const lower = (x) => String(x || '').trim().toLowerCase();

// // // // /* ========== 5) Routes ========== */
// // // // app.get('/', (_req, res) => res.send('Meeting backend up ✅'));

// // // // /**
// // // //  * Create Meeting (optional helper from your appointments flow)
// // // //  * Body: { appointmentId?, patientEmail, doctorEmail }
// // // //  */
// // // // app.post('/api/meetings/create', async (req, res) => {
// // // //   try {
// // // //     const { appointmentId, patientEmail, doctorEmail } = req.body || {};
// // // //     if (!patientEmail || !doctorEmail) {
// // // //       return res.status(400).json({ error: 'patientEmail and doctorEmail required' });
// // // //     }
// // // //     const code = await genUniqueCode();
// // // //     const participants = [
// // // //       { email: lower(patientEmail), role: 'patient' },
// // // //       { email: lower(doctorEmail),  role: 'doctor'  },
// // // //     ];
// // // //     if (ADMIN_EMAIL && !participants.some(p => p.email === lower(ADMIN_EMAIL))) {
// // // //       participants.push({ email: lower(ADMIN_EMAIL), role: 'admin' });
// // // //     }

// // // //     const meeting = await Meeting.create({ code, appointmentId: appointmentId || null, participants });

// // // //     const makeUrl = (r, e) => `${FRONTEND_URL}/meeting/${code}?role=${r}&email=${encodeURIComponent(lower(e))}`;
// // // //     res.json({
// // // //       code: meeting.code,
// // // //       meetingId: meeting._id,
// // // //       patientUrl: makeUrl('patient', patientEmail),
// // // //       doctorUrl:  makeUrl('doctor', doctorEmail),
// // // //       adminUrl:   ADMIN_EMAIL ? makeUrl('admin', ADMIN_EMAIL) : null,
// // // //     });
// // // //   } catch (e) {
// // // //     if (e?.code === 11000) return res.status(409).json({ error: 'Code collision, retry' });
// // // //     res.status(400).json({ error: e?.message || 'Create failed' });
// // // //   }
// // // // });

// // // // /**
// // // //  * Verify & Auto-Add
// // // //  * Body: { code, email, role }  // role ∈ {patient,doctor,admin}
// // // //  */
// // // // app.post('/api/meetings/verify', async (req, res) => {
// // // //   try {
// // // //     const { code, email, role } = req.body || {};
// // // //     if (!code || !email || !role) {
// // // //       return res.status(400).json({ error: 'code, email, role required' });
// // // //     }
// // // //     if (!['patient','doctor','admin'].includes(role)) {
// // // //       return res.status(400).json({ error: 'Invalid role' });
// // // //     }

// // // //     const meeting = await Meeting.findOne({ code });
// // // //     if (!meeting) return res.status(400).json({ error: 'Invalid meeting code' });
// // // //     if (meeting.status === 'Ended') return res.status(403).json({ error: 'Meeting ended' });

// // // //     const e = lower(email);

// // // //     // Prevent duplicate email with different role → keep first role
// // // //     let p = meeting.participants.find(p => p.email === e);
// // // //     if (!p) {
// // // //       // Optional room size cap
// // // //       const MAX_ROOM = 12;
// // // //       if (meeting.participants.length >= MAX_ROOM) {
// // // //         return res.status(403).json({ error: 'Room is full' });
// // // //       }
// // // //       meeting.participants.push({ email: e, role });
// // // //       await meeting.save();
// // // //       p = { email: e, role };
// // // //     }

// // // //     // If host (doctor/admin) is joining & meeting is Scheduled → set Live
// // // //     if ((p.role === 'doctor' || p.role === 'admin') && meeting.status === 'Scheduled') {
// // // //       meeting.status = 'Live';
// // // //       await meeting.save();
// // // //     }

// // // //     const token = sign({ code, email: e, role: p.role }, 60 * 60);
// // // //     const signalingUrl = `${(req.headers['x-forwarded-proto'] || 'http') === 'https' ? 'wss' : 'ws'}://${req.headers.host}/ws`;

// // // //     res.json({
// // // //       token,
// // // //       iceServers: buildIceServers(),
// // // //       signalingUrl,
// // // //       appointmentId: meeting.appointmentId || null,
// // // //       role: p.role, // send effective role back
// // // //     });
// // // //   } catch (e) {
// // // //     res.status(400).json({ error: e?.message || 'Verify failed' });
// // // //   }
// // // // });

// // // // /**
// // // //  * Link builder (optional)
// // // //  */
// // // // app.get('/api/meetings/link', async (req, res) => {
// // // //   const { code, email, role } = req.query || {};
// // // //   if (!code || !email || !role) return res.status(400).json({ error: 'code, email, role required' });
// // // //   const url = `${FRONTEND_URL}/meeting/${encodeURIComponent(code)}?role=${encodeURIComponent(role)}&email=${encodeURIComponent(lower(email))}`;
// // // //   res.json({ url });
// // // // });

// // // // /* ========== 6) WebSocket Signaling (rooms + broadcast) ========== */
// // // // const wss = new WebSocketServer({ noServer: true });
// // // // const rooms = new Map(); // code -> Map(email -> ws)

// // // // function getRoom(code) {
// // // //   if (!rooms.has(code)) rooms.set(code, new Map());
// // // //   return rooms.get(code);
// // // // }
// // // // function joinRoom(code, email, role, ws) {
// // // //   const room = getRoom(code);
// // // //   room.set(email, ws);
// // // //   ws._room = code;
// // // //   ws._email = email;
// // // //   ws._role = role;
// // // // }
// // // // function leaveRoom(ws) {
// // // //   const code = ws._room;
// // // //   const email = ws._email;
// // // //   if (!code) return;
// // // //   const room = rooms.get(code);
// // // //   if (!room) return;
// // // //   room.delete(email);
// // // //   if (room.size === 0) rooms.delete(code);
// // // // }
// // // // function roleOnline(code, role) {
// // // //   const room = rooms.get(code);
// // // //   if (!room) return false;
// // // //   for (const [, peer] of room) {
// // // //     if (peer._role === role && peer.readyState === 1) return true;
// // // //   }
// // // //   return false;
// // // // }
// // // // function broadcastToRoom(code, payload, exceptEmail=null) {
// // // //   const room = rooms.get(code);
// // // //   if (!room) return;
// // // //   for (const [email, peer] of room.entries()) {
// // // //     if (exceptEmail && email === exceptEmail) continue;
// // // //     if (peer.readyState === 1) {
// // // //       try { peer.send(JSON.stringify(payload)); } catch {}
// // // //     }
// // // //   }
// // // // }

// // // // wss.on('connection', (ws) => {
// // // //   ws.isAlive = true;
// // // //   const authTimer = setTimeout(() => { if (!ws._authed) try { ws.close(4001, 'no-auth'); } catch {} }, 6000);

// // // //   ws.on('pong', () => { ws.isAlive = true; });

// // // //   ws.on('message', async (raw) => {
// // // //     let msg;
// // // //     try { msg = JSON.parse(raw); } catch { return; }

// // // //     // First message must be auth
// // // //     if (!ws._authed) {
// // // //       if (msg.type !== 'auth' || !msg.token) return;
// // // //       try {
// // // //         const { code, email, role, exp } = jwt.verify(msg.token, MEETING_JWT_SECRET);

// // // //         // extra safety: meeting exists & user present with same role
// // // //         const meeting = await Meeting.findOne({ code });
// // // //         if (!meeting) throw new Error('bad-meeting');
// // // //         const allowed = meeting.participants.some(p => p.email === email && p.role === role);
// // // //         if (!allowed) throw new Error('bad-user');

// // // //         ws._authed = true;
// // // //         joinRoom(code, email, role, ws);

// // // //         ws.send(JSON.stringify({ type: 'auth-ok', you: { code, email, role, exp } }));

// // // //         // notify others I joined
// // // //         broadcastToRoom(code, { type: 'room:join', email, role }, email);
// // // //       } catch {
// // // //         ws.send(JSON.stringify({ type: 'auth-error' }));
// // // //         try { ws.close(4002, 'bad-token'); } catch {}
// // // //       }
// // // //       clearTimeout(authTimer);
// // // //       return;
// // // //     }

// // // //     // after auth...
// // // //     const code = ws._room;
// // // //     const room = rooms.get(code);
// // // //     if (!room) return;

// // // //     const sendTo = (toEmail, payload) => {
// // // //       const peer = room.get(toEmail);
// // // //       if (peer && peer.readyState === 1) {
// // // //         try { peer.send(JSON.stringify({ ...payload, fromEmail: ws._email })); } catch {}
// // // //       }
// // // //     };

// // // //     switch (msg.type) {
// // // //       case 'room:who': {
// // // //         const roster = [];
// // // //         for (const [email, peer] of room.entries()) {
// // // //           roster.push({ email, role: peer._role, online: peer.readyState === 1 });
// // // //         }
// // // //         ws.send(JSON.stringify({
// // // //           type: 'room:roster',
// // // //           roster,
// // // //           adminOnline: roleOnline(code, 'admin') || roleOnline(code, 'doctor'),
// // // //         }));
// // // //         break;
// // // //       }

// // // //       case 'rtc:offer': {
// // // //         // Lobby: patient cannot offer until a host is online
// // // //         const hostOnline = roleOnline(code, 'admin') || roleOnline(code, 'doctor');
// // // //         if (ws._role === 'patient' && !hostOnline) {
// // // //           ws.send(JSON.stringify({ type: 'lobby:wait' }));
// // // //           return;
// // // //         }
// // // //         if (!msg.toEmail || !msg.sdp) return;
// // // //         sendTo(msg.toEmail, { type: 'offer', sdp: msg.sdp });
// // // //         break;
// // // //       }

// // // //       case 'rtc:answer': {
// // // //         if (!msg.toEmail || !msg.sdp) return;
// // // //         sendTo(msg.toEmail, { type: 'answer', sdp: msg.sdp });
// // // //         break;
// // // //       }

// // // //       case 'rtc:candidate': {
// // // //         if (!msg.toEmail || !msg.candidate) return;
// // // //         sendTo(msg.toEmail, { type: 'candidate', candidate: msg.candidate });
// // // //         break;
// // // //       }
// // // //     }
// // // //   });

// // // //   ws.on('close', () => {
// // // //     const code = ws._room;
// // // //     const email = ws._email;
// // // //     leaveRoom(ws);
// // // //     if (code && email) broadcastToRoom(code, { type: 'room:leave', email });
// // // //   });
// // // // });

// // // // // upgrade HTTP → WS on /ws
// // // // httpServer.on('upgrade', (req, socket, head) => {
// // // //   if (!req.url || !req.url.startsWith('/ws')) { socket.destroy(); return; }
// // // //   wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
// // // // });

// // // // // heartbeat
// // // // setInterval(() => {
// // // //   wss.clients.forEach((ws) => {
// // // //     if (!ws.isAlive) return ws.terminate();
// // // //     ws.isAlive = false;
// // // //     try { ws.ping(); } catch {}
// // // //   });
// // // // }, 15000);

// // // // /* ========== 7) Start ========== */
// // // // httpServer.listen(PORT, () => {
// // // //   console.log(`🚀 HTTP+WS server on http://localhost:${PORT}`);
// // // //   console.log(`   WS  endpoint: ws://localhost:${PORT}/ws`);
// // // // });
// // // // meeting-server/server.js
// // // import http from 'http';
// // // import express from 'express';
// // // import cors from 'cors';
// // // import dotenv from 'dotenv';
// // // import mongoose from 'mongoose';
// // // import jwt from 'jsonwebtoken';
// // // import { WebSocketServer } from 'ws';

// // // dotenv.config();

// // // const {
// // //   PORT = 5080,
// // //   MONGODB_URI,
// // //   MEETING_JWT_SECRET,
// // //   FRONTEND_URL = 'http://localhost:3000',
// // //   ADMIN_EMAIL = '',
// // //   TURN_URL,
// // //   TURN_USER,
// // //   TURN_PASS,
// // // } = process.env;

// // // if (!MONGODB_URI) throw new Error('MONGODB_URI missing');
// // // if (!MEETING_JWT_SECRET) throw new Error('MEETING_JWT_SECRET missing');

// // // const app = express();
// // // app.use(cors({ origin: true, credentials: true }));
// // // app.use(express.json());
// // // const httpServer = http.createServer(app);

// // // await mongoose.connect(MONGODB_URI);
// // // console.log('✅ MongoDB connected');

// // // const ParticipantSchema = new mongoose.Schema(
// // //   { email: { type: String, required: true, lowercase: true, trim: true }, role: { type: String, enum: ['patient','doctor','admin'], required: true } },
// // //   { _id: false }
// // // );
// // // const MeetingSchema = new mongoose.Schema(
// // //   { code: { type: String, required: true, index: { unique: true } }, appointmentId: { type: String }, participants: { type: [ParticipantSchema], default: [] }, status: { type: String, enum: ['Scheduled','Live','Ended'], default: 'Scheduled' } },
// // //   { timestamps: true }
// // // );
// // // const Meeting = mongoose.models.Meeting || mongoose.model('Meeting', MeetingSchema);

// // // const genCode = () => String(Math.floor(100000 + Math.random() * 900000));
// // // async function genUniqueCode() {
// // //   for (let i = 0; i < 12; i++) {
// // //     const c = genCode();
// // //     const exists = await Meeting.exists({ code: c });
// // //     if (!exists) return c;
// // //   }
// // //   throw new Error('Could not generate unique meeting code');
// // // }
// // // const sign = (payload, expSec = 3600) => jwt.sign(payload, MEETING_JWT_SECRET, { expiresIn: expSec });
// // // function buildIceServers() {
// // //   const ice = [{ urls: ['stun:stun.l.google.com:19302'] }];
// // //   if (TURN_URL && TURN_USER && TURN_PASS) ice.push({ urls: [TURN_URL], username: TURN_USER, credential: TURN_PASS });
// // //   return ice;
// // // }
// // // const lower = (x) => String(x || '').trim().toLowerCase();

// // // app.get('/', (_req, res) => res.send('Meeting backend up ✅'));

// // // app.post('/api/meetings/create', async (req, res) => {
// // //   try {
// // //     const { appointmentId, patientEmail, doctorEmail } = req.body || {};
// // //     if (!patientEmail || !doctorEmail) return res.status(400).json({ error: 'patientEmail and doctorEmail required' });
// // //     const code = await genUniqueCode();
// // //     const participants = [
// // //       { email: lower(patientEmail), role: 'patient' },
// // //       { email: lower(doctorEmail),  role: 'doctor'  },
// // //     ];
// // //     if (ADMIN_EMAIL && !participants.some(p => p.email === lower(ADMIN_EMAIL))) {
// // //       participants.push({ email: lower(ADMIN_EMAIL), role: 'admin' });
// // //     }
// // //     const meeting = await Meeting.create({ code, appointmentId: appointmentId || null, participants });
// // //     const link = (r, e) => `${FRONTEND_URL}/meeting/${code}?role=${r}&email=${encodeURIComponent(lower(e))}`;
// // //     res.json({ code, meetingId: meeting._id, patientUrl: link('patient', patientEmail), doctorUrl: link('doctor', doctorEmail), adminUrl: ADMIN_EMAIL ? link('admin', ADMIN_EMAIL) : null });
// // //   } catch (e) {
// // //     if (e?.code === 11000) return res.status(409).json({ error: 'Code collision, retry' });
// // //     res.status(400).json({ error: e?.message || 'Create failed' });
// // //   }
// // // });

// // // app.post('/api/meetings/verify', async (req, res) => {
// // //   try {
// // //     const { code, email, role } = req.body || {};
// // //     if (!code || !email || !role) return res.status(400).json({ error: 'code, email, role required' });
// // //     if (!['patient','doctor','admin'].includes(role)) return res.status(400).json({ error: 'Invalid role' });

// // //     const meeting = await Meeting.findOne({ code });
// // //     if (!meeting) return res.status(400).json({ error: 'Invalid meeting code' });
// // //     if (meeting.status === 'Ended') return res.status(403).json({ error: 'Meeting ended' });

// // //     const e = lower(email);
// // //     let p = meeting.participants.find(p => p.email === e);
// // //     if (!p) {
// // //       const MAX = 16;
// // //       if (meeting.participants.length >= MAX) return res.status(403).json({ error: 'Room is full' });
// // //       meeting.participants.push({ email: e, role }); await meeting.save();
// // //       p = { email: e, role };
// // //     }
// // //     if ((p.role === 'doctor' || p.role === 'admin') && meeting.status === 'Scheduled') {
// // //       meeting.status = 'Live'; await meeting.save();
// // //     }

// // //     const token = sign({ code, email: e, role: p.role }, 3600);
// // //     const isHttps = (req.headers['x-forwarded-proto'] || '').toString().includes('https') || req.secure;
// // //     const signalingUrl = `${isHttps ? 'wss' : 'ws'}://${req.headers.host}/ws`;

// // //     res.json({ token, iceServers: buildIceServers(), signalingUrl, appointmentId: meeting.appointmentId || null, role: p.role });
// // //   } catch (e) { res.status(400).json({ error: e?.message || 'Verify failed' }); }
// // // });

// // // app.get('/api/meetings/link', (req, res) => {
// // //   const { code, email, role } = req.query || {};
// // //   if (!code || !email || !role) return res.status(400).json({ error: 'code, email, role required' });
// // //   const url = `${FRONTEND_URL}/meeting/${encodeURIComponent(code)}?role=${encodeURIComponent(role)}&email=${encodeURIComponent(lower(email))}`;
// // //   res.json({ url });
// // // });

// // // /* WebSocket signaling */
// // // const wss = new WebSocketServer({ noServer: true });
// // // const rooms = new Map(); // code -> Map(email -> ws)

// // // function getRoom(code) { if (!rooms.has(code)) rooms.set(code, new Map()); return rooms.get(code); }
// // // function joinRoom(code, email, role, ws) { const room = getRoom(code); room.set(email, ws); ws._room = code; ws._email = email; ws._role = role; ws._authed = true; }
// // // function leaveRoom(ws) { const code = ws._room, email = ws._email; if (!code) return; const room = rooms.get(code); if (!room) return; room.delete(email); if (room.size === 0) rooms.delete(code); }
// // // function broadcastToRoom(code, payload, exceptEmail=null) {
// // //   const room = rooms.get(code); if (!room) return;
// // //   for (const [email, peer] of room.entries()) {
// // //     if (exceptEmail && email === exceptEmail) continue;
// // //     if (peer.readyState === 1) { try { peer.send(JSON.stringify(payload)); } catch {} }
// // //   }
// // // }
// // // wss.on('connection', (ws) => {
// // //   ws.isAlive = true;
// // //   const authTimer = setTimeout(() => { if (!ws._authed) try { ws.close(4001, 'no-auth'); } catch {} }, 6000);
// // //   ws.on('pong', () => { ws.isAlive = true; });

// // //   ws.on('message', async (raw) => {
// // //     let msg; try { msg = JSON.parse(raw); } catch { return; }

// // //     if (!ws._authed) {
// // //       if (msg.type !== 'auth' || !msg.token) return;
// // //       try {
// // //         const { code, email, role, exp } = jwt.verify(msg.token, MEETING_JWT_SECRET);
// // //         const meeting = await Meeting.findOne({ code });
// // //         if (!meeting) throw new Error('bad-meeting');
// // //         const allowed = meeting.participants.some(p => p.email === email && p.role === role);
// // //         if (!allowed) throw new Error('bad-user');
// // //         joinRoom(code, email, role, ws);
// // //         ws.send(JSON.stringify({ type: 'auth-ok', you: { code, email, role, exp } }));
// // //         broadcastToRoom(code, { type: 'room:join', email, role }, email);
// // //       } catch {
// // //         ws.send(JSON.stringify({ type: 'auth-error' })); try { ws.close(4002, 'bad-token'); } catch {}
// // //       }
// // //       clearTimeout(authTimer);
// // //       return;
// // //     }

// // //     const code = ws._room; const room = rooms.get(code); if (!room) return;
// // //     const sendTo = (toEmail, payload) => {
// // //       const peer = room.get(toEmail);
// // //       if (peer && peer.readyState === 1) { try { peer.send(JSON.stringify({ ...payload, fromEmail: ws._email, fromRole: ws._role })); } catch {} }
// // //     };

// // //     switch (msg.type) {
// // //       case 'room:who': {
// // //         const roster = [];
// // //         for (const [email, peer] of room.entries()) roster.push({ email, role: peer._role, online: peer.readyState === 1 });
// // //         ws.send(JSON.stringify({ type: 'room:roster', roster }));
// // //         break;
// // //       }
// // //       case 'rtc:offer': {
// // //         if (!msg.toEmail || !msg.sdp) return; sendTo(msg.toEmail, { type: 'offer', sdp: msg.sdp }); break;
// // //       }
// // //       case 'rtc:answer': {
// // //         if (!msg.toEmail || !msg.sdp) return; sendTo(msg.toEmail, { type: 'answer', sdp: msg.sdp }); break;
// // //       }
// // //       case 'rtc:candidate': {
// // //         if (!msg.toEmail || !msg.candidate) return; sendTo(msg.toEmail, { type: 'candidate', candidate: msg.candidate }); break;
// // //       }
// // //     }
// // //   });

// // //   ws.on('close', () => {
// // //     const code = ws._room; const email = ws._email;
// // //     leaveRoom(ws);
// // //     if (code && email) broadcastToRoom(code, { type: 'room:leave', email });
// // //   });
// // // });

// // // httpServer.on('upgrade', (req, socket, head) => {
// // //   if (!req.url || !req.url.startsWith('/ws')) { socket.destroy(); return; }
// // //   wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
// // // });

// // // setInterval(() => {
// // //   wss.clients.forEach((ws) => {
// // //     if (!ws.isAlive) return ws.terminate();
// // //     ws.isAlive = false;
// // //     try { ws.ping(); } catch {}
// // //   });
// // // }, 15000);

// // // httpServer.listen(PORT, () => {
// // //   console.log(`🚀 Meeting server http://localhost:${PORT}`);
// // //   console.log(`   WS endpoint: ws://localhost:${PORT}/ws`);
// // // });



// // // import http from 'http';
// // // import express from 'express';
// // // import cors from 'cors';
// // // import dotenv from 'dotenv';
// // // import mongoose from 'mongoose';
// // // import jwt from 'jsonwebtoken';
// // // import { WebSocketServer } from 'ws';

// // // dotenv.config();

// // // /* ---------- 1) ENV + VALIDATION ---------- */
// // // const ENV = {
// // //   PORT: Number(process.env.PORT || 5080),
// // //   MONGODB_URI: process.env.MONGODB_URI,
// // //   MEETING_JWT_SECRET: process.env.MEETING_JWT_SECRET,
// // //   FRONTEND_URL: process.env.FRONTEND_URL,            // optional, can be auto
// // //   ADMIN_EMAIL: process.env.ADMIN_EMAIL || '',
// // //   TURN_URL: process.env.TURN_URL || '',
// // //   TURN_USER: process.env.TURN_USER || '',
// // //   TURN_PASS: process.env.TURN_PASS || '',
// // //   SIGNALING_URL: process.env.SIGNALING_URL || '',    // optional override e.g. wss://signal.example.com/ws
// // // };

// // // const required = ['MONGODB_URI', 'MEETING_JWT_SECRET'];
// // // for (const k of required) {
// // //   if (!ENV[k] || String(ENV[k]).trim() === '') {
// // //     throw new Error(`${k} missing`);
// // //   }
// // // }

// // // /* ---------- 2) APP BASICS ---------- */
// // // const app = express();
// // // app.set('trust proxy', true); // very important behind Railway/Render/NGINX for req.secure, forwarded headers

// // // // Allow CORS from anywhere OR restrict to FRONTEND_URL if defined
// // // app.use(
// // //   cors({
// // //     origin: (origin, cb) => {
// // //       if (!origin) return cb(null, true);
// // //       if (!ENV.FRONTEND_URL) return cb(null, true);
// // //       try {
// // //         const allowed = new URL(ENV.FRONTEND_URL).origin;
// // //         return cb(null, origin === allowed);
// // //       } catch { return cb(null, true); }
// // //     },
// // //     credentials: true,
// // //   })
// // // );
// // // app.use(express.json());

// // // const httpServer = http.createServer(app);

// // // /* ---------- 3) DB ---------- */
// // // await mongoose.connect(ENV.MONGODB_URI);
// // // console.log('✅ MongoDB connected');

// // // /* ---------- 4) MODELS ---------- */
// // // import mongoosePkg from 'mongoose';
// // // const { Schema, model, models } = mongoosePkg;

// // // const ParticipantSchema = new Schema(
// // //   {
// // //     email: { type: String, required: true, lowercase: true, trim: true },
// // //     role:  { type: String, enum: ['patient','doctor','admin'], required: true },
// // //   },
// // //   { _id: false }
// // // );

// // // const MeetingSchema = new Schema(
// // //   {
// // //     code: { type: String, required: true, index: { unique: true } }, // 6-digit
// // //     appointmentId: { type: String },
// // //     participants: { type: [ParticipantSchema], default: [] },
// // //     status: { type: String, enum: ['Scheduled','Live','Ended'], default: 'Scheduled' },
// // //   },
// // //   { timestamps: true }
// // // );

// // // const Meeting = models.Meeting || model('Meeting', MeetingSchema);

// // // /* ---------- 5) HELPERS ---------- */
// // // const lower = (x) => String(x || '').trim().toLowerCase();
// // // const genCode = () => String(Math.floor(100000 + Math.random() * 900000));
// // // async function genUniqueCode() {
// // //   for (let i = 0; i < 12; i++) {
// // //     const c = genCode();
// // //     const exists = await Meeting.exists({ code: c });
// // //     if (!exists) return c;
// // //   }
// // //   throw new Error('Could not generate unique meeting code');
// // // }
// // // const sign = (payload, expSec = 3600) =>
// // //   jwt.sign(payload, ENV.MEETING_JWT_SECRET, { expiresIn: expSec });

// // // // TURN only when all 3 provided
// // // function buildIceServers() {
// // //   const ice = [{ urls: ['stun:stun.l.google.com:19302'] }];
// // //   if (ENV.TURN_URL && ENV.TURN_USER && ENV.TURN_PASS) {
// // //     ice.push({ urls: [ENV.TURN_URL], username: ENV.TURN_USER, credential: ENV.TURN_PASS });
// // //   }
// // //   return ice;
// // // }

// // // // Compute FRONTEND origin fallback from request if env missing
// // // function getFrontendOrigin(req) {
// // //   if (ENV.FRONTEND_URL) {
// // //     try { return new URL(ENV.FRONTEND_URL).origin; } catch { /* ignore */ }
// // //   }
// // //   const proto = req.get('x-forwarded-proto') || (req.secure ? 'https' : 'http');
// // //   const host = req.get('x-forwarded-host') || req.get('host');
// // //   return `${proto}://${host}`;
// // // }

// // // // Compute signaling URL:
// // // // 1) If SIGNALING_URL env set → use it (must be ws:// or wss:// and include /ws path)
// // // // 2) Else derive from current host + /ws with correct ws/wss based on forwarded proto/req.secure
// // // function getSignalingUrl(req) {
// // //   if (ENV.SIGNALING_URL) return ENV.SIGNALING_URL;
// // //   const isHttps = (req.get('x-forwarded-proto') || '').includes('https') || req.secure;
// // //   const host = req.get('x-forwarded-host') || req.get('host');
// // //   return `${isHttps ? 'wss' : 'ws'}://${host}/ws`;
// // // }

// // // /* ---------- 6) ROUTES ---------- */
// // // app.get('/', (_req, res) => res.send('Meeting backend up ✅'));

// // // // Health & config peek (no secrets)
// // // app.get('/healthz', (req, res) => {
// // //   res.json({
// // //     ok: true,
// // //     env: {
// // //       port: ENV.PORT,
// // //       hasFrontendUrl: !!ENV.FRONTEND_URL,
// // //       hasSignalingOverride: !!ENV.SIGNALING_URL,
// // //       hasTurn: !!(ENV.TURN_URL && ENV.TURN_USER && ENV.TURN_PASS),
// // //     },
// // //     ip: req.ip,
// // //   });
// // // });

// // // /** Create meeting */
// // // app.post('/api/meetings/create', async (req, res) => {
// // //   try {
// // //     const { appointmentId, patientEmail, doctorEmail } = req.body || {};
// // //     if (!patientEmail || !doctorEmail) {
// // //       return res.status(400).json({ error: 'patientEmail and doctorEmail required' });
// // //     }
// // //     const code = await genUniqueCode();
// // //     const participants = [
// // //       { email: lower(patientEmail), role: 'patient' },
// // //       { email: lower(doctorEmail),  role: 'doctor'  },
// // //     ];
// // //     if (ENV.ADMIN_EMAIL && !participants.some(p => p.email === lower(ENV.ADMIN_EMAIL))) {
// // //       participants.push({ email: lower(ENV.ADMIN_EMAIL), role: 'admin' });
// // //     }

// // //     const meeting = await Meeting.create({ code, appointmentId: appointmentId || null, participants });

// // //     const origin = getFrontendOrigin(req); // dynamic fallback
// // //     const mk = (r, e) => `${origin.replace(/\/$/, '')}/meeting/${code}?role=${r}&email=${encodeURIComponent(lower(e))}`;
// // //     res.json({
// // //       code,
// // //       meetingId: meeting._id,
// // //       patientUrl: mk('patient', patientEmail),
// // //       doctorUrl:  mk('doctor', doctorEmail),
// // //       adminUrl:   ENV.ADMIN_EMAIL ? mk('admin', ENV.ADMIN_EMAIL) : null,
// // //     });
// // //   } catch (e) {
// // //     if (e?.code === 11000) return res.status(409).json({ error: 'Code collision, retry' });
// // //     res.status(400).json({ error: e?.message || 'Create failed' });
// // //   }
// // // });

// // // /** Verify + add + ICE + signaling URL */
// // // app.post('/api/meetings/verify', async (req, res) => {
// // //   try {
// // //     const { code, email, role } = req.body || {};
// // //     if (!code || !email || !role) {
// // //       return res.status(400).json({ error: 'code, email, role required' });
// // //     }
// // //     if (!['patient','doctor','admin'].includes(role)) {
// // //       return res.status(400).json({ error: 'Invalid role' });
// // //     }

// // //     const meeting = await Meeting.findOne({ code });
// // //     if (!meeting) return res.status(400).json({ error: 'Invalid meeting code' });
// // //     if (meeting.status === 'Ended') return res.status(403).json({ error: 'Meeting ended' });

// // //     const e = lower(email);
// // //     let p = meeting.participants.find(p => p.email === e);
// // //     if (!p) {
// // //       const MAX = 16;
// // //       if (meeting.participants.length >= MAX) {
// // //         return res.status(403).json({ error: 'Room is full' });
// // //       }
// // //       meeting.participants.push({ email: e, role });
// // //       await meeting.save();
// // //       p = { email: e, role };
// // //     }

// // //     if ((p.role === 'doctor' || p.role === 'admin') && meeting.status === 'Scheduled') {
// // //       meeting.status = 'Live'; await meeting.save();
// // //     }

// // //     const token = sign({ code, email: e, role: p.role }, 60 * 60);
// // //     const signalingUrl = getSignalingUrl(req);

// // //     res.json({
// // //       token,
// // //       iceServers: buildIceServers(),
// // //       signalingUrl,
// // //       appointmentId: meeting.appointmentId || null,
// // //       role: p.role,
// // //     });
// // //   } catch (e) {
// // //     res.status(400).json({ error: e?.message || 'Verify failed' });
// // //   }
// // // });

// // // /** Link builder (optional) */
// // // app.get('/api/meetings/link', (req, res) => {
// // //   const { code, email, role } = req.query || {};
// // //   if (!code || !email || !role) return res.status(400).json({ error: 'code, email, role required' });
// // //   const origin = getFrontendOrigin(req);
// // //   const url = `${origin.replace(/\/$/, '')}/meeting/${encodeURIComponent(code)}?role=${encodeURIComponent(role)}&email=${encodeURIComponent(lower(email))}`;
// // //   res.json({ url });
// // // });

// // // /* ---------- 7) WS SIGNALING ---------- */
// // // const wss = new WebSocketServer({ noServer: true });
// // // const rooms = new Map(); // code -> Map(email -> ws)

// // // function getRoom(code) { if (!rooms.has(code)) rooms.set(code, new Map()); return rooms.get(code); }
// // // function joinRoom(code, email, role, ws) {
// // //   const room = getRoom(code);
// // //   room.set(email, ws);
// // //   ws._room = code; ws._email = email; ws._role = role; ws._authed = true;
// // // }
// // // function leaveRoom(ws) {
// // //   const code = ws._room; const email = ws._email;
// // //   if (!code) return;
// // //   const room = rooms.get(code);
// // //   if (!room) return;
// // //   room.delete(email);
// // //   if (room.size === 0) rooms.delete(code);
// // // }
// // // function broadcastToRoom(code, payload, exceptEmail=null) {
// // //   const room = rooms.get(code); if (!room) return;
// // //   for (const [email, peer] of room.entries()) {
// // //     if (exceptEmail && email === exceptEmail) continue;
// // //     if (peer.readyState === 1) { try { peer.send(JSON.stringify(payload)); } catch {} }
// // //   }
// // // }

// // // wss.on('connection', (ws) => {
// // //   ws.isAlive = true;
// // //   const authTimer = setTimeout(() => { if (!ws._authed) try { ws.close(4001, 'no-auth'); } catch {} }, 6000);
// // //   ws.on('pong', () => { ws.isAlive = true; });

// // //   ws.on('message', async (raw) => {
// // //     let msg; try { msg = JSON.parse(raw); } catch { return; }

// // //     if (!ws._authed) {
// // //       if (msg.type !== 'auth' || !msg.token) return;
// // //       try {
// // //         const { code, email, role, exp } = jwt.verify(msg.token, ENV.MEETING_JWT_SECRET);
// // //         const meeting = await Meeting.findOne({ code });
// // //         if (!meeting) throw new Error('bad-meeting');
// // //         const allowed = meeting.participants.some(p => p.email === email && p.role === role);
// // //         if (!allowed) throw new Error('bad-user');

// // //         joinRoom(code, email, role, ws);
// // //         ws.send(JSON.stringify({ type: 'auth-ok', you: { code, email, role, exp } }));
// // //         broadcastToRoom(code, { type: 'room:join', email, role }, email);
// // //       } catch {
// // //         ws.send(JSON.stringify({ type: 'auth-error' })); try { ws.close(4002, 'bad-token'); } catch {}
// // //       }
// // //       clearTimeout(authTimer);
// // //       return;
// // //     }

// // //     const code = ws._room; const room = rooms.get(code); if (!room) return;
// // //     const sendTo = (toEmail, payload) => {
// // //       const peer = room.get(toEmail);
// // //       if (peer && peer.readyState === 1) {
// // //         try { peer.send(JSON.stringify({ ...payload, fromEmail: ws._email, fromRole: ws._role })); } catch {}
// // //       }
// // //     };

// // //     switch (msg.type) {
// // //       case 'room:who': {
// // //         const roster = [];
// // //         for (const [email, peer] of room.entries()) {
// // //           roster.push({ email, role: peer._role, online: peer.readyState === 1 });
// // //         }
// // //         ws.send(JSON.stringify({ type: 'room:roster', roster }));
// // //         break;
// // //       }
// // //       case 'rtc:offer': {
// // //         if (!msg.toEmail || !msg.sdp) return;
// // //         sendTo(msg.toEmail, { type: 'offer', sdp: msg.sdp });
// // //         break;
// // //       }
// // //       case 'rtc:answer': {
// // //         if (!msg.toEmail || !msg.sdp) return;
// // //         sendTo(msg.toEmail, { type: 'answer', sdp: msg.sdp });
// // //         break;
// // //       }
// // //       case 'rtc:candidate': {
// // //         if (!msg.toEmail || !msg.candidate) return;
// // //         sendTo(msg.toEmail, { type: 'candidate', candidate: msg.candidate });
// // //         break;
// // //       }
// // //     }
// // //   });

// // //   ws.on('close', () => {
// // //     const code = ws._room; const email = ws._email;
// // //     leaveRoom(ws);
// // //     if (code && email) broadcastToRoom(code, { type: 'room:leave', email });
// // //   });
// // // });

// // // // HTTP → WS upgrade on /ws
// // // httpServer.on('upgrade', (req, socket, head) => {
// // //   if (!req.url || !req.url.startsWith('/ws')) { socket.destroy(); return; }
// // //   wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
// // // });

// // // // WS heartbeat
// // // setInterval(() => {
// // //   wss.clients.forEach((ws) => {
// // //     if (!ws.isAlive) return ws.terminate();
// // //     ws.isAlive = false;
// // //     try { ws.ping(); } catch {}
// // //   });
// // // }, 15000);

// // // // Startup summary (no secrets)
// // // httpServer.listen(ENV.PORT, () => {
// // //   console.log('——— Meeting Server ———');
// // //   console.log(`HTTP/WS Port : ${ENV.PORT}`);
// // //   console.log(`Frontend URL : ${ENV.FRONTEND_URL || '(auto from request)'}`);
// // //   console.log(`Signaling URL: ${ENV.SIGNALING_URL || '(auto per-request)'}`);
// // //   console.log(`TURN Enabled : ${ENV.TURN_URL && ENV.TURN_USER && ENV.TURN_PASS ? 'yes' : 'no'}`);
// // //   console.log('———————————————');
// // // });
// // // server/meeting-server.js
// // import http from 'http';
// // import express from 'express';
// // import cors from 'cors';
// // import dotenv from 'dotenv';
// // import mongoose from 'mongoose';
// // import jwt from 'jsonwebtoken';
// // import { WebSocketServer } from 'ws';

// // dotenv.config();

// // const ENV = {
// //   PORT: Number(process.env.PORT || 5080),
// //   MONGODB_URI: process.env.MONGODB_URI,
// //   MEETING_JWT_SECRET: process.env.MEETING_JWT_SECRET,
// //   FRONTEND_URL: process.env.FRONTEND_URL || '',
// //   SIGNALING_URL: process.env.SIGNALING_URL || '',
// //   TURN_URL: process.env.TURN_URL || '',
// //   TURN_USER: process.env.TURN_USER || '',
// //   TURN_PASS: process.env.TURN_PASS || '',
// //   CORS_ORIGINS: process.env.CORS_ORIGINS || '',
// //   ADMIN_EMAIL: process.env.ADMIN_EMAIL || '',
// // };

// // for (const k of ['MONGODB_URI', 'MEETING_JWT_SECRET']) {
// //   if (!ENV[k] || String(ENV[k]).trim() === '') throw new Error(`${k} missing`);
// // }

// // const app = express();
// // app.set('trust proxy', true);

// // const allowOrigins = (ENV.CORS_ORIGINS || '')
// //   .split(',').map(s => s.trim()).filter(Boolean);

// // app.use(cors({
// //   origin: (origin, cb) => {
// //     if (!origin) return cb(null, true);
// //     if (!allowOrigins.length && !ENV.FRONTEND_URL) return cb(null, true);
// //     try {
// //       const allowedSet = new Set(allowOrigins.length ? allowOrigins : [new URL(ENV.FRONTEND_URL).origin]);
// //       return cb(null, allowedSet.has(new URL(origin).origin));
// //     } catch {
// //       return cb(null, false);
// //     }
// //   },
// //   credentials: true,
// // }));
// // app.use(express.json());

// // const httpServer = http.createServer(app);

// // await mongoose.connect(ENV.MONGODB_URI);
// // console.log('✅ MongoDB connected');

// // const { Schema, model, models } = mongoose;

// // const ParticipantSchema = new Schema({
// //   email: { type: String, required: true, lowercase: true, trim: true },
// //   role:  { type: String, enum: ['patient','doctor','admin'], required: true },
// // }, { _id: false });

// // const MeetingSchema = new Schema({
// //   code: { type: String, required: true, index: { unique: true } },
// //   appointmentId: { type: String },
// //   participants: { type: [ParticipantSchema], default: [] },
// //   status: { type: String, enum: ['Scheduled','Live','Ended'], default: 'Scheduled' },
// // }, { timestamps: true });

// // const Meeting = models.Meeting || model('Meeting', MeetingSchema);

// // const lower = (x) => String(x || '').trim().toLowerCase();
// // const genCode = () => String(Math.floor(100000 + Math.random() * 900000));
// // async function genUniqueCode() {
// //   for (let i = 0; i < 14; i++) {
// //     const c = genCode();
// //     const exists = await Meeting.exists({ code: c });
// //     if (!exists) return c;
// //   }
// //   throw new Error('Could not generate unique meeting code');
// // }
// // const sign = (payload, expSec = 3600) =>
// //   jwt.sign(payload, ENV.MEETING_JWT_SECRET, { expiresIn: expSec });

// // function buildIceServers() {
// //   const ice = [{ urls: ['stun:stun.l.google.com:19302'] }];
// //   if (ENV.TURN_URL && ENV.TURN_USER && ENV.TURN_PASS) {
// //     ice.push({ urls: [ENV.TURN_URL], username: ENV.TURN_USER, credential: ENV.TURN_PASS });
// //   }
// //   return ice;
// // }
// // function getFrontendOrigin(req) {
// //   if (ENV.FRONTEND_URL) {
// //     try { return new URL(ENV.FRONTEND_URL).origin; } catch {}
// //   }
// //   const proto = req.get('x-forwarded-proto') || (req.secure ? 'https' : 'http');
// //   const host = req.get('x-forwarded-host') || req.get('host');
// //   return `${proto}://${host}`;
// // }
// // function getSignalingUrl(req) {
// //   if (ENV.SIGNALING_URL) return ENV.SIGNALING_URL;
// //   const isHttps = (req.get('x-forwarded-proto') || '').includes('https') || req.secure;
// //   const host = req.get('x-forwarded-host') || req.get('host');
// //   return `${isHttps ? 'wss' : 'ws'}://${host}/ws`;
// // }

// // app.get('/', (_req, res) => res.send('Meeting backend up ✅'));
// // app.get('/healthz', (req, res) => res.json({
// //   ok: true,
// //   env: {
// //     port: ENV.PORT,
// //     hasFrontendUrl: !!ENV.FRONTEND_URL,
// //     hasSignalingOverride: !!ENV.SIGNALING_URL,
// //     hasTurn: !!(ENV.TURN_URL && ENV.TURN_USER && ENV.TURN_PASS),
// //   },
// //   ip: req.ip,
// // }));

// // app.post('/api/meetings/create', async (req, res) => {
// //   try {
// //     const { appointmentId, patientEmail, doctorEmail } = req.body || {};
// //     if (!patientEmail || !doctorEmail) {
// //       return res.status(400).json({ error: 'patientEmail and doctorEmail required' });
// //     }
// //     const code = await genUniqueCode();
// //     const participants = [
// //       { email: lower(patientEmail), role: 'patient' },
// //       { email: lower(doctorEmail),  role: 'doctor'  },
// //     ];
// //     if (ENV.ADMIN_EMAIL && !participants.some(p => p.email === lower(ENV.ADMIN_EMAIL))) {
// //       participants.push({ email: lower(ENV.ADMIN_EMAIL), role: 'admin' });
// //     }
// //     const meeting = await Meeting.create({ code, appointmentId: appointmentId || null, participants });

// //     const origin = getFrontendOrigin(req);
// //     const mk = (r, e) => `${origin.replace(/\/$/, '')}/meeting/${code}?role=${r}&email=${encodeURIComponent(lower(e))}`;
// //     res.json({
// //       code,
// //       meetingId: meeting._id,
// //       patientUrl: mk('patient', patientEmail),
// //       doctorUrl:  mk('doctor', doctorEmail),
// //       adminUrl:   ENV.ADMIN_EMAIL ? mk('admin', ENV.ADMIN_EMAIL) : null,
// //     });
// //   } catch (e) {
// //     if (e?.code === 11000) return res.status(409).json({ error: 'Code collision, retry' });
// //     res.status(400).json({ error: e?.message || 'Create failed' });
// //   }
// // });

// // app.post('/api/meetings/verify', async (req, res) => {
// //   try {
// //     const { code, email, role } = req.body || {};
// //     if (!code || !email || !role) return res.status(400).json({ error: 'code, email, role required' });
// //     if (!['patient','doctor','admin'].includes(role)) return res.status(400).json({ error: 'Invalid role' });

// //     const meeting = await Meeting.findOne({ code });
// //     if (!meeting) return res.status(400).json({ error: 'Invalid meeting code' });
// //     if (meeting.status === 'Ended') return res.status(403).json({ error: 'Meeting ended' });

// //     const e = lower(email);
// //     let p = meeting.participants.find(p => p.email === e);
// //     if (!p) {
// //       const MAX = 16;
// //       if (meeting.participants.length >= MAX) return res.status(403).json({ error: 'Room is full' });
// //       meeting.participants.push({ email: e, role });
// //       await meeting.save();
// //       p = { email: e, role };
// //     }
// //     if ((p.role === 'doctor' || p.role === 'admin') && meeting.status === 'Scheduled') {
// //       meeting.status = 'Live'; await meeting.save();
// //     }
// //     const token = sign({ code, email: e, role: p.role }, 60 * 60);
// //     const signalingUrl = getSignalingUrl(req);

// //     res.json({
// //       token,
// //       iceServers: buildIceServers(),
// //       signalingUrl,
// //       appointmentId: meeting.appointmentId || null,
// //       role: p.role,
// //     });
// //   } catch (e) {
// //     res.status(400).json({ error: e?.message || 'Verify failed' });
// //   }
// // });

// // /* WS signaling */
// // const wss = new WebSocketServer({ noServer: true });
// // const rooms = new Map(); // code -> Map(email -> ws)

// // function getRoom(code) { if (!rooms.has(code)) rooms.set(code, new Map()); return rooms.get(code); }
// // function joinRoom(code, email, role, ws) {
// //   const room = getRoom(code);
// //   room.set(email, ws);
// //   ws._room = code; ws._email = email; ws._role = role; ws._authed = true;
// // }
// // function leaveRoom(ws) {
// //   const code = ws._room; const email = ws._email;
// //   if (!code) return;
// //   const room = rooms.get(code);
// //   if (!room) return;
// //   room.delete(email);
// //   if (room.size === 0) rooms.delete(code);
// // }
// // function broadcastToRoom(code, payload, exceptEmail=null) {
// //   const room = rooms.get(code); if (!room) return;
// //   for (const [email, peer] of room.entries()) {
// //     if (exceptEmail && email === exceptEmail) continue;
// //     if (peer.readyState === 1) { try { peer.send(JSON.stringify(payload)); } catch {} }
// //   }
// // }

// // wss.on('connection', (ws) => {
// //   ws.isAlive = true;
// //   const authTimer = setTimeout(() => { if (!ws._authed) try { ws.close(4001, 'no-auth'); } catch {} }, 6000);
// //   ws.on('pong', () => { ws.isAlive = true; });

// //   ws.on('message', async (raw) => {
// //     let msg; try { msg = JSON.parse(raw); } catch { return; }

// //     if (!ws._authed) {
// //       if (msg.type !== 'auth' || !msg.token) return;
// //       try {
// //         const { code, email, role, exp } = jwt.verify(msg.token, ENV.MEETING_JWT_SECRET);
// //         const meeting = await Meeting.findOne({ code });
// //         if (!meeting) throw new Error('bad-meeting');
// //         const allowed = meeting.participants.some(p => p.email === email && p.role === role);
// //         if (!allowed) throw new Error('bad-user');

// //         joinRoom(code, email, role, ws);
// //         ws.send(JSON.stringify({ type: 'auth-ok', you: { code, email, role, exp } }));
// //         broadcastToRoom(code, { type: 'room:join', email, role }, email);
// //       } catch {
// //         ws.send(JSON.stringify({ type: 'auth-error' })); try { ws.close(4002, 'bad-token'); } catch {}
// //       }
// //       clearTimeout(authTimer);
// //       return;
// //     }

// //     const code = ws._room; const room = rooms.get(code); if (!room) return;
// //     const sendTo = (toEmail, payload) => {
// //       const peer = room.get(toEmail);
// //       if (peer && peer.readyState === 1) {
// //         try { peer.send(JSON.stringify({ ...payload, fromEmail: ws._email, fromRole: ws._role })); } catch {}
// //       }
// //     };

// //     switch (msg.type) {
// //       case 'room:who': {
// //         const roster = [];
// //         for (const [email, peer] of room.entries()) {
// //           roster.push({ email, role: peer._role, online: peer.readyState === 1 });
// //         }
// //         ws.send(JSON.stringify({ type: 'room:roster', roster }));
// //         break;
// //       }
// //       case 'rtc:offer': {
// //         if (!msg.toEmail || !msg.sdp) return;
// //         sendTo(msg.toEmail, { type: 'offer', sdp: msg.sdp });
// //         break;
// //       }
// //       case 'rtc:answer': {
// //         if (!msg.toEmail || !msg.sdp) return;
// //         sendTo(msg.toEmail, { type: 'answer', sdp: msg.sdp });
// //         break;
// //       }
// //       case 'rtc:candidate': {
// //         if (!msg.toEmail || !msg.candidate) return;
// //         sendTo(msg.toEmail, { type: 'candidate', candidate: msg.candidate });
// //         break;
// //       }
// //     }
// //   });

// //   ws.on('close', () => {
// //     const code = ws._room; const email = ws._email;
// //     leaveRoom(ws);
// //     if (code && email) broadcastToRoom(code, { type: 'room:leave', email });
// //   });
// // });

// // httpServer.on('upgrade', (req, socket, head) => {
// //   if (!req.url || !req.url.startsWith('/ws')) { socket.destroy(); return; }
// //   wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
// // });

// // setInterval(() => {
// //   wss.clients.forEach((ws) => {
// //     if (!ws.isAlive) return ws.terminate();
// //     ws.isAlive = false;
// //     try { ws.ping(); } catch {}
// //   });
// // }, 15000);

// // httpServer.listen(ENV.PORT, () => {
// //   console.log('——— Meeting Server ———');
// //   console.log(`HTTP/WS Port : ${ENV.PORT}`);
// //   console.log(`Frontend URL : ${ENV.FRONTEND_URL || '(auto from request)'}`);
// //   console.log(`Signaling URL: ${ENV.SIGNALING_URL || '(auto per-request)'}`);
// //   console.log(`TURN Enabled : ${ENV.TURN_URL && ENV.TURN_USER && ENV.TURN_PASS ? 'yes' : 'no'}`);
// //   console.log('———————————————');
// // });
// // server/meeting-server.js
// import http from 'http';
// import express from 'express';
// import cors from 'cors';
// import dotenv from 'dotenv';
// import mongoose from 'mongoose';
// import jwt from 'jsonwebtoken';
// import { WebSocketServer } from 'ws';

// dotenv.config();

// const ENV = {
//   PORT: Number(process.env.PORT || 5080),
//   MONGODB_URI: process.env.MONGODB_URI,
//   MEETING_JWT_SECRET: process.env.MEETING_JWT_SECRET,
//   FRONTEND_URL: process.env.FRONTEND_URL || '',
//   SIGNALING_URL: process.env.SIGNALING_URL || '',
//   TURN_URL: process.env.TURN_URL || '',
//   TURN_USER: process.env.TURN_USER || '',
//   TURN_PASS: process.env.TURN_PASS || '',
//   CORS_ORIGINS: process.env.CORS_ORIGINS || '',
//   ADMIN_EMAIL: process.env.ADMIN_EMAIL || '',
// };

// for (const k of ['MONGODB_URI', 'MEETING_JWT_SECRET']) {
//   if (!ENV[k] || String(ENV[k]).trim() === '') throw new Error(`${k} missing`);
// }

// const app = express();
// app.set('trust proxy', true);

// const allowOrigins = (ENV.CORS_ORIGINS || '')
//   .split(',').map(s => s.trim()).filter(Boolean);

// app.use(cors({
//   origin: (origin, cb) => {
//     if (!origin) return cb(null, true);
//     if (!allowOrigins.length && !ENV.FRONTEND_URL) return cb(null, true);
//     try {
//       const allowedSet = new Set(allowOrigins.length ? allowOrigins : [new URL(ENV.FRONTEND_URL).origin]);
//       return cb(null, allowedSet.has(new URL(origin).origin));
//     } catch {
//       return cb(null, false);
//     }
//   },
//   credentials: true,
// }));
// app.use(express.json());

// const httpServer = http.createServer(app);

// await mongoose.connect(ENV.MONGODB_URI);
// console.log('✅ MongoDB connected');

// const { Schema, model, models } = mongoose;

// const ParticipantSchema = new Schema({
//   email: { type: String, required: true, lowercase: true, trim: true },
//   role:  { type: String, enum: ['patient','doctor','admin'], required: true },
// }, { _id: false });

// const MeetingSchema = new Schema({
//   code: { type: String, required: true, index: { unique: true } },
//   appointmentId: { type: String },
//   participants: { type: [ParticipantSchema], default: [] },
//   status: { type: String, enum: ['Scheduled','Live','Ended'], default: 'Scheduled' },
// }, { timestamps: true });

// const Meeting = models.Meeting || model('Meeting', MeetingSchema);

// const lower = (x) => String(x || '').trim().toLowerCase();
// const genCode = () => String(Math.floor(100000 + Math.random() * 900000));
// async function genUniqueCode() {
//   for (let i = 0; i < 14; i++) {
//     const c = genCode();
//     const exists = await Meeting.exists({ code: c });
//     if (!exists) return c;
//   }
//   throw new Error('Could not generate unique meeting code');
// }
// const sign = (payload, expSec = 3600) =>
//   jwt.sign(payload, ENV.MEETING_JWT_SECRET, { expiresIn: expSec });

// function buildIceServers() {
//   const ice = [{ urls: ['stun:stun.l.google.com:19302'] }];
//   if (ENV.TURN_URL && ENV.TURN_USER && ENV.TURN_PASS) {
//     ice.push({ urls: [ENV.TURN_URL], username: ENV.TURN_USER, credential: ENV.TURN_PASS });
//   }
//   return ice;
// }
// function getFrontendOrigin(req) {
//   if (ENV.FRONTEND_URL) {
//     try { return new URL(ENV.FRONTEND_URL).origin; } catch {}
//   }
//   const proto = req.get('x-forwarded-proto') || (req.secure ? 'https' : 'http');
//   const host = req.get('x-forwarded-host') || req.get('host');
//   return `${proto}://${host}`;
// }
// function getSignalingUrl(req) {
//   if (ENV.SIGNALING_URL) return ENV.SIGNALING_URL;
//   const isHttps = (req.get('x-forwarded-proto') || '').includes('https') || req.secure;
//   const host = req.get('x-forwarded-host') || req.get('host');
//   return `${isHttps ? 'wss' : 'ws'}://${host}/ws`;
// }

// app.get('/', (_req, res) => res.send('Meeting backend up ✅'));
// app.get('/healthz', (req, res) => res.json({
//   ok: true,
//   env: {
//     port: ENV.PORT,
//     hasFrontendUrl: !!ENV.FRONTEND_URL,
//     hasSignalingOverride: !!ENV.SIGNALING_URL,
//     hasTurn: !!(ENV.TURN_URL && ENV.TURN_USER && ENV.TURN_PASS),
//   },
//   ip: req.ip,
// }));

// app.post('/api/meetings/create', async (req, res) => {
//   try {
//     const { appointmentId, patientEmail, doctorEmail } = req.body || {};
//     if (!patientEmail || !doctorEmail) {
//       return res.status(400).json({ error: 'patientEmail and doctorEmail required' });
//     }
//     const code = await genUniqueCode();
//     const participants = [
//       { email: lower(patientEmail), role: 'patient' },
//       { email: lower(doctorEmail),  role: 'doctor'  },
//     ];
//     if (ENV.ADMIN_EMAIL && !participants.some(p => p.email === lower(ENV.ADMIN_EMAIL))) {
//       participants.push({ email: lower(ENV.ADMIN_EMAIL), role: 'admin' });
//     }
//     const meeting = await Meeting.create({ code, appointmentId: appointmentId || null, participants });

//     const origin = getFrontendOrigin(req);
//     const mk = (r, e) => `${origin.replace(/\/$/, '')}/meeting/${code}?role=${r}&email=${encodeURIComponent(lower(e))}`;
//     res.json({
//       code,
//       meetingId: meeting._id,
//       patientUrl: mk('patient', patientEmail),
//       doctorUrl:  mk('doctor', doctorEmail),
//       adminUrl:   ENV.ADMIN_EMAIL ? mk('admin', ENV.ADMIN_EMAIL) : null,
//     });
//   } catch (e) {
//     if (e?.code === 11000) return res.status(409).json({ error: 'Code collision, retry' });
//     res.status(400).json({ error: e?.message || 'Create failed' });
//   }
// });

// app.post('/api/meetings/verify', async (req, res) => {
//   try {
//     const { code, email, role } = req.body || {};
//     if (!code || !email || !role) return res.status(400).json({ error: 'code, email, role required' });
//     if (!['patient','doctor','admin'].includes(role)) return res.status(400).json({ error: 'Invalid role' });

//     const meeting = await Meeting.findOne({ code });
//     if (!meeting) return res.status(400).json({ error: 'Invalid meeting code' });
//     if (meeting.status === 'Ended') return res.status(403).json({ error: 'Meeting ended' });

//     const e = lower(email);
//     let p = meeting.participants.find(p => p.email === e);
//     if (!p) {
//       const MAX = 16;
//       if (meeting.participants.length >= MAX) return res.status(403).json({ error: 'Room is full' });
//       meeting.participants.push({ email: e, role });
//       await meeting.save();
//       p = { email: e, role };
//     }
//     if ((p.role === 'doctor' || p.role === 'admin') && meeting.status === 'Scheduled') {
//       meeting.status = 'Live'; await meeting.save();
//     }
//     const token = sign({ code, email: e, role: p.role }, 60 * 60);
//     const signalingUrl = getSignalingUrl(req);

//     res.json({
//       token,
//       iceServers: buildIceServers(),
//       signalingUrl,
//       appointmentId: meeting.appointmentId || null,
//       role: p.role,
//     });
//   } catch (e) {
//     res.status(400).json({ error: e?.message || 'Verify failed' });
//   }
// });

// /* WS signaling */
// const wss = new WebSocketServer({ noServer: true });
// const rooms = new Map(); // code -> Map(email -> ws)

// function getRoom(code) { if (!rooms.has(code)) rooms.set(code, new Map()); return rooms.get(code); }
// function joinRoom(code, email, role, ws) {
//   const room = getRoom(code);
//   room.set(email, ws);
//   ws._room = code; ws._email = email; ws._role = role; ws._authed = true;
// }
// function leaveRoom(ws) {
//   const code = ws._room; const email = ws._email;
//   if (!code) return;
//   const room = rooms.get(code);
//   if (!room) return;
//   room.delete(email);
//   if (room.size === 0) rooms.delete(code);
// }
// function broadcastToRoom(code, payload, exceptEmail=null) {
//   const room = rooms.get(code); if (!room) return;
//   for (const [email, peer] of room.entries()) {
//     if (exceptEmail && email === exceptEmail) continue;
//     if (peer.readyState === 1) { try { peer.send(JSON.stringify(payload)); } catch {} }
//   }
// }

// wss.on('connection', (ws) => {
//   ws.isAlive = true;
//   const authTimer = setTimeout(() => { if (!ws._authed) try { ws.close(4001, 'no-auth'); } catch {} }, 6000);
//   ws.on('pong', () => { ws.isAlive = true; });

//   ws.on('message', async (raw) => {
//     let msg; try { msg = JSON.parse(raw); } catch { return; }

//     if (!ws._authed) {
//       if (msg.type !== 'auth' || !msg.token) return;
//       try {
//         const { code, email, role, exp } = jwt.verify(msg.token, ENV.MEETING_JWT_SECRET);
//         const meeting = await Meeting.findOne({ code });
//         if (!meeting) throw new Error('bad-meeting');
//         const allowed = meeting.participants.some(p => p.email === email && p.role === role);
//         if (!allowed) throw new Error('bad-user');

//         joinRoom(code, email, role, ws);
//         ws.send(JSON.stringify({ type: 'auth-ok', you: { code, email, role, exp } }));
//         broadcastToRoom(code, { type: 'room:join', email, role }, email);
//       } catch {
//         ws.send(JSON.stringify({ type: 'auth-error' })); try { ws.close(4002, 'bad-token'); } catch {}
//       }
//       clearTimeout(authTimer);
//       return;
//     }

//     const code = ws._room; const room = rooms.get(code); if (!room) return;
//     const sendTo = (toEmail, payload) => {
//       const peer = room.get(toEmail);
//       if (peer && peer.readyState === 1) {
//         try { peer.send(JSON.stringify({ ...payload, fromEmail: ws._email, fromRole: ws._role })); } catch {}
//       }
//     };

//     switch (msg.type) {
//       case 'room:who': {
//         const roster = [];
//         for (const [email, peer] of room.entries()) {
//           roster.push({ email, role: peer._role, online: peer.readyState === 1 });
//         }
//         ws.send(JSON.stringify({ type: 'room:roster', roster }));
//         break;
//       }
//       case 'rtc:offer': {
//         if (!msg.toEmail || !msg.sdp) return;
//         sendTo(msg.toEmail, { type: 'offer', sdp: msg.sdp });
//         break;
//       }
//       case 'rtc:answer': {
//         if (!msg.toEmail || !msg.sdp) return;
//         sendTo(msg.toEmail, { type: 'answer', sdp: msg.sdp });
//         break;
//       }
//       case 'rtc:candidate': {
//         if (!msg.toEmail || !msg.candidate) return;
//         sendTo(msg.toEmail, { type: 'candidate', candidate: msg.candidate });
//         break;
//       }
//     }
//   });

//   ws.on('close', () => {
//     const code = ws._room; const email = ws._email;
//     leaveRoom(ws);
//     if (code && email) broadcastToRoom(code, { type: 'room:leave', email });
//   });
// });

// httpServer.on('upgrade', (req, socket, head) => {
//   if (!req.url || !req.url.startsWith('/ws')) { socket.destroy(); return; }
//   wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
// });

// setInterval(() => {
//   wss.clients.forEach((ws) => {
//     if (!ws.isAlive) return ws.terminate();
//     ws.isAlive = false;
//     try { ws.ping(); } catch {}
//   });
// }, 15000);

// httpServer.listen(ENV.PORT, () => {
//   console.log('——— Meeting Server ———');
//   console.log(`HTTP/WS Port : ${ENV.PORT}`);
//   console.log(`Frontend URL : ${ENV.FRONTEND_URL || '(auto from request)'}`);
//   console.log(`Signaling URL: ${ENV.SIGNALING_URL || '(auto per-request)'}`);
//   console.log(`TURN Enabled : ${ENV.TURN_URL && ENV.TURN_USER && ENV.TURN_PASS ? 'yes' : 'no'}`);
//   console.log('———————————————');
// });
// server/meeting-server.js


// import http from 'http';
// import express from 'express';
// import cors from 'cors';
// import dotenv from 'dotenv';
// import mongoose from 'mongoose';
// import jwt from 'jsonwebtoken';
// import { WebSocketServer } from 'ws';

// dotenv.config();

// const ENV = {
//   PORT: Number(process.env.PORT || 5080),
//   MONGODB_URI: process.env.MONGODB_URI,
//   MEETING_JWT_SECRET: process.env.MEETING_JWT_SECRET,
//   FRONTEND_URL: process.env.FRONTEND_URL || '',
//   SIGNALING_URL: process.env.SIGNALING_URL || '',
//   TURN_URL: process.env.TURN_URL || '',     // e.g. turns:turn.yourdomain.com:5349?transport=tcp
//   TURN_USER: process.env.TURN_USER || '',
//   TURN_PASS: process.env.TURN_PASS || '',
//   CORS_ORIGINS: process.env.CORS_ORIGINS || '', // comma-separated allowlist (optional)
//   ADMIN_EMAIL: process.env.ADMIN_EMAIL || '',
// };

// for (const k of ['MONGODB_URI', 'MEETING_JWT_SECRET']) {
//   if (!ENV[k] || String(ENV[k]).trim() === '') throw new Error(`${k} missing`);
// }

// const app = express();
// app.set('trust proxy', true);

// const allowOrigins = (ENV.CORS_ORIGINS || '')
//   .split(',').map(s => s.trim()).filter(Boolean);

// app.use(cors({
//   origin: (origin, cb) => {
//     if (!origin) return cb(null, true);
//     if (!allowOrigins.length && !ENV.FRONTEND_URL) return cb(null, true);
//     try {
//       const allowedSet = new Set(allowOrigins.length ? allowOrigins : [new URL(ENV.FRONTEND_URL).origin]);
//       const o = new URL(origin).origin;
//       return cb(null, allowedSet.has(o));
//     } catch {
//       return cb(null, false);
//     }
//   },
//   credentials: true,
// }));
// app.use(express.json());

// const httpServer = http.createServer(app);

// await mongoose.connect(ENV.MONGODB_URI);
// console.log('✅ MongoDB connected');

// const { Schema, model, models } = mongoose;

// const ParticipantSchema = new Schema({
//   email: { type: String, required: true, lowercase: true, trim: true },
//   role:  { type: String, enum: ['patient','doctor','admin'], required: true },
// }, { _id: false });

// const MeetingSchema = new Schema({
//   code: { type: String, required: true, index: { unique: true } },
//   appointmentId: { type: String },
//   participants: { type: [ParticipantSchema], default: [] },
//   status: { type: String, enum: ['Scheduled','Live','Ended'], default: 'Scheduled' },
// }, { timestamps: true });

// const Meeting = models.Meeting || model('Meeting', MeetingSchema);

// const lower = (x) => String(x || '').trim().toLowerCase();
// const genCode = () => String(Math.floor(100000 + Math.random() * 900000));
// async function genUniqueCode() {
//   for (let i = 0; i < 14; i++) {
//     const c = genCode();
//     const exists = await Meeting.exists({ code: c });
//     if (!exists) return c;
//   }
//   throw new Error('Could not generate unique meeting code');
// }
// const sign = (payload, expSec = 3600) =>
//   jwt.sign(payload, ENV.MEETING_JWT_SECRET, { expiresIn: expSec });

// function buildIceServers() {
//   const ice = [{ urls: ['stun:stun.l.google.com:19302'] }];
//   if (ENV.TURN_URL && ENV.TURN_USER && ENV.TURN_PASS) {
//     ice.push({ urls: [ENV.TURN_URL], username: ENV.TURN_USER, credential: ENV.TURN_PASS });
//   }
//   return ice;
// }
// function getFrontendOrigin(req) {
//   if (ENV.FRONTEND_URL) {
//     try { return new URL(ENV.FRONTEND_URL).origin; } catch {}
//   }
//   const proto = req.get('x-forwarded-proto') || (req.secure ? 'https' : 'http');
//   const host = req.get('x-forwarded-host') || req.get('host');
//   return `${proto}://${host}`;
// }
// function getSignalingUrl(req) {
//   if (ENV.SIGNALING_URL) return ENV.SIGNALING_URL;
//   const isHttps = (req.get('x-forwarded-proto') || '').includes('https') || req.secure;
//   const host = req.get('x-forwarded-host') || req.get('host');
//   return `${isHttps ? 'wss' : 'ws'}://${host}/ws`;
// }

// app.get('/', (_req, res) => res.send('Meeting backend up ✅'));
// app.get('/healthz', (req, res) => res.json({
//   ok: true,
//   env: {
//     port: ENV.PORT,
//     hasFrontendUrl: !!ENV.FRONTEND_URL,
//     hasSignalingOverride: !!ENV.SIGNALING_URL,
//     hasTurn: !!(ENV.TURN_URL && ENV.TURN_USER && ENV.TURN_PASS),
//   },
//   ip: req.ip,
// }));

// app.post('/api/meetings/create', async (req, res) => {
//   try {
//     const { appointmentId, patientEmail, doctorEmail } = req.body || {};
//     if (!patientEmail || !doctorEmail) {
//       return res.status(400).json({ error: 'patientEmail and doctorEmail required' });
//     }
//     const code = await genUniqueCode();
//     const participants = [
//       { email: lower(patientEmail), role: 'patient' },
//       { email: lower(doctorEmail),  role: 'doctor'  },
//     ];
//     if (ENV.ADMIN_EMAIL && !participants.some(p => p.email === lower(ENV.ADMIN_EMAIL))) {
//       participants.push({ email: lower(ENV.ADMIN_EMAIL), role: 'admin' });
//     }
//     const meeting = await Meeting.create({ code, appointmentId: appointmentId || null, participants });

//     const origin = getFrontendOrigin(req);
//     const mk = (r, e) => `${origin.replace(/\/$/, '')}/meeting/${code}?role=${r}&email=${encodeURIComponent(lower(e))}`;
//     res.json({
//       code,
//       meetingId: meeting._id,
//       patientUrl: mk('patient', patientEmail),
//       doctorUrl:  mk('doctor', doctorEmail),
//       adminUrl:   ENV.ADMIN_EMAIL ? mk('admin', ENV.ADMIN_EMAIL) : null,
//     });
//   } catch (e) {
//     if (e?.code === 11000) return res.status(409).json({ error: 'Code collision, retry' });
//     res.status(400).json({ error: e?.message || 'Create failed' });
//   }
// });

// app.post('/api/meetings/verify', async (req, res) => {
//   try {
//     const { code, email, role } = req.body || {};
//     if (!code || !email || !role) return res.status(400).json({ error: 'code, email, role required' });
//     if (!['patient','doctor','admin'].includes(role)) return res.status(400).json({ error: 'Invalid role' });

//     const meeting = await Meeting.findOne({ code });
//     if (!meeting) return res.status(400).json({ error: 'Invalid meeting code' });
//     if (meeting.status === 'Ended') return res.status(403).json({ error: 'Meeting ended' });

//     const e = lower(email);
//     let p = meeting.participants.find(p => p.email === e);
//     if (!p) {
//       const MAX = 16;
//       if (meeting.participants.length >= MAX) return res.status(403).json({ error: 'Room is full' });
//       meeting.participants.push({ email: e, role });
//       await meeting.save();
//       p = { email: e, role };
//     }
//     if ((p.role === 'doctor' || p.role === 'admin') && meeting.status === 'Scheduled') {
//       meeting.status = 'Live'; await meeting.save();
//     }

//     const token = sign({ code, email: e, role: p.role }, 60 * 60);
//     const signalingUrl = getSignalingUrl(req);

//     res.json({
//       token,
//       iceServers: buildIceServers(),
//       signalingUrl,
//       appointmentId: meeting.appointmentId || null,
//       role: p.role,
//     });
//   } catch (e) {
//     res.status(400).json({ error: e?.message || 'Verify failed' });
//   }
// });

// /* ---------- WebSocket Signaling ---------- */
// const wss = new WebSocketServer({ noServer: true });
// const rooms = new Map(); // code -> Map(email -> ws)

// function getRoom(code) { if (!rooms.has(code)) rooms.set(code, new Map()); return rooms.get(code); }
// function joinRoom(code, email, role, ws) {
//   const room = getRoom(code);
//   room.set(email, ws);
//   ws._room = code; ws._email = email; ws._role = role; ws._authed = true;
// }
// function leaveRoom(ws) {
//   const code = ws._room; const email = ws._email;
//   if (!code) return;
//   const room = rooms.get(code);
//   if (!room) return;
//   room.delete(email);
//   if (room.size === 0) rooms.delete(code);
// }
// function broadcastToRoom(code, payload, exceptEmail=null) {
//   const room = rooms.get(code); if (!room) return;
//   for (const [email, peer] of room.entries()) {
//     if (exceptEmail && email === exceptEmail) continue;
//     if (peer.readyState === 1) { try { peer.send(JSON.stringify(payload)); } catch {} }
//   }
// }

// wss.on('connection', (ws) => {
//   ws.isAlive = true;
//   const authTimer = setTimeout(() => { if (!ws._authed) try { ws.close(4001, 'no-auth'); } catch {} }, 6000);
//   ws.on('pong', () => { ws.isAlive = true; });

//   ws.on('message', async (raw) => {
//     let msg; try { msg = JSON.parse(raw); } catch { return; }

//     if (!ws._authed) {
//       if (msg.type !== 'auth' || !msg.token) return;
//       try {
//         const { code, email, role, exp } = jwt.verify(msg.token, ENV.MEETING_JWT_SECRET);
//         const meeting = await Meeting.findOne({ code });
//         if (!meeting) throw new Error('bad-meeting');
//         const allowed = meeting.participants.some(p => p.email === email && p.role === role);
//         if (!allowed) throw new Error('bad-user');

//         joinRoom(code, email, role, ws);
//         ws.send(JSON.stringify({ type: 'auth-ok', you: { code, email, role, exp } }));
//         broadcastToRoom(code, { type: 'room:join', email, role }, email);
//       } catch {
//         ws.send(JSON.stringify({ type: 'auth-error' })); try { ws.close(4002, 'bad-token'); } catch {}
//       }
//       clearTimeout(authTimer);
//       return;
//     }

//     const code = ws._room; const room = rooms.get(code); if (!room) return;
//     const sendTo = (toEmail, payload) => {
//       const peer = room.get(toEmail);
//       if (peer && peer.readyState === 1) {
//         try { peer.send(JSON.stringify({ ...payload, fromEmail: ws._email, fromRole: ws._role })); } catch {}
//       }
//     };

//     switch (msg.type) {
//       case 'room:who': {
//         const roster = [];
//         for (const [email, peer] of room.entries()) {
//           roster.push({ email, role: peer._role, online: peer.readyState === 1 });
//         }
//         ws.send(JSON.stringify({ type: 'room:roster', roster }));
//         break;
//       }
//       case 'rtc:offer': {
//         if (!msg.toEmail || !msg.sdp) return;
//         sendTo(msg.toEmail, { type: 'offer', sdp: msg.sdp });
//         break;
//       }
//       case 'rtc:answer': {
//         if (!msg.toEmail || !msg.sdp) return;
//         sendTo(msg.toEmail, { type: 'answer', sdp: msg.sdp });
//         break;
//       }
//       case 'rtc:candidate': {
//         if (!msg.toEmail || !msg.candidate) return;
//         sendTo(msg.toEmail, { type: 'candidate', candidate: msg.candidate });
//         break;
//       }
//     }
//   });

//   ws.on('close', () => {
//     const code = ws._room; const email = ws._email;
//     leaveRoom(ws);
//     if (code && email) broadcastToRoom(code, { type: 'room:leave', email });
//   });
// });

// httpServer.on('upgrade', (req, socket, head) => {
//   if (!req.url || !req.url.startsWith('/ws')) { socket.destroy(); return; }
//   wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
// });

// setInterval(() => {
//   wss.clients.forEach((ws) => {
//     if (!ws.isAlive) return ws.terminate();
//     ws.isAlive = false;
//     try { ws.ping(); } catch {}
//   });
// }, 15000);

// httpServer.listen(ENV.PORT, () => {
//   console.log('——— Meeting Server ———');
//   console.log(`HTTP/WS Port : ${ENV.PORT}`);
//   console.log(`Frontend URL : ${ENV.FRONTEND_URL || '(auto from request)'}`);
//   console.log(`Signaling URL: ${ENV.SIGNALING_URL || '(auto per-request)'}`);
//   console.log(`TURN Enabled : ${ENV.TURN_URL && ENV.TURN_USER && ENV.TURN_PASS ? 'yes' : 'no'}`);
//   console.log('———————————————');
// });
import http from 'http';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { WebSocketServer } from 'ws';
import helmet from 'helmet';

dotenv.config();

const ENV = {
  PORT: Number(process.env.PORT || 5080),
  MONGODB_URI: process.env.MONGODB_URI,
  MEETING_JWT_SECRET: process.env.MEETING_JWT_SECRET,
  FRONTEND_URL: process.env.FRONTEND_URL || '',
  SIGNALING_URL: process.env.SIGNALING_URL || '',
  TURN_URL: process.env.TURN_URL || '',     // e.g. turns:turn.yourdomain.com:5349?transport=tcp
  TURN_USER: process.env.TURN_USER || '',
  TURN_PASS: process.env.TURN_PASS || '',
  CORS_ORIGINS: process.env.CORS_ORIGINS || '', // comma-separated allowlist (optional)
  ADMIN_EMAIL: (process.env.ADMIN_EMAIL || '').toLowerCase(),
  ROOM_CAPACITY: Number(process.env.ROOM_CAPACITY || 16),
};

for (const k of ['MONGODB_URI', 'MEETING_JWT_SECRET']) {
  if (!ENV[k] || String(ENV[k]).trim() === '') throw new Error(`${k} missing`);
}

const app = express();
app.set('trust proxy', true);
app.use(helmet({ crossOriginEmbedderPolicy: false, contentSecurityPolicy: false }));

const allowOrigins = (ENV.CORS_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (!allowOrigins.length && !ENV.FRONTEND_URL) return cb(null, true);
      try {
        const allowedSet = new Set(allowOrigins.length ? allowOrigins : [new URL(ENV.FRONTEND_URL).origin]);
        const o = new URL(origin).origin;
        return cb(null, allowedSet.has(o));
      } catch {
        return cb(null, false);
      }
    },
    credentials: true,
  })
);
app.use(express.json());

const httpServer = http.createServer(app);

await mongoose.connect(ENV.MONGODB_URI);
console.log('✅ MongoDB connected');

const { Schema, model, models } = mongoose;

const ParticipantSchema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    role: { type: String, enum: ['patient', 'doctor', 'admin'], required: true },
  },
  { _id: false }
);

const MeetingSchema = new Schema(
  {
    code: { type: String, required: true, index: { unique: true } },
    appointmentId: { type: String },
    participants: { type: [ParticipantSchema], default: [] },
    status: { type: String, enum: ['Scheduled', 'Live', 'Ended'], default: 'Scheduled' },
  },
  { timestamps: true }
);

const Meeting = models.Meeting || model('Meeting', MeetingSchema);

const lower = (x) => String(x || '').trim().toLowerCase();
const genCode = () => String(Math.floor(100000 + Math.random() * 900000));
async function genUniqueCode() {
  for (let i = 0; i < 14; i++) {
    const c = genCode();
    const exists = await Meeting.exists({ code: c });
    if (!exists) return c;
  }
  throw new Error('Could not generate unique meeting code');
}
const sign = (payload, expSec = 3600) => jwt.sign(payload, ENV.MEETING_JWT_SECRET, { expiresIn: expSec });

function buildIceServers() {
  const ice = [{ urls: ['stun:stun.l.google.com:19302'] }];
  if (ENV.TURN_URL && ENV.TURN_USER && ENV.TURN_PASS) {
    ice.push({ urls: [ENV.TURN_URL], username: ENV.TURN_USER, credential: ENV.TURN_PASS });
  }
  return ice;
}
function getFrontendOrigin(req) {
  if (ENV.FRONTEND_URL) {
    try { return new URL(ENV.FRONTEND_URL).origin; } catch {}
  }
  const proto = req.get('x-forwarded-proto') || (req.secure ? 'https' : 'http');
  const host = req.get('x-forwarded-host') || req.get('host');
  return `${proto}://${host}`;
}
function getSignalingUrl(req) {
  if (ENV.SIGNALING_URL) return ENV.SIGNALING_URL;
  const isHttps = (req.get('x-forwarded-proto') || '').includes('https') || req.secure;
  const host = req.get('x-forwarded-host') || req.get('host');
  return `${isHttps ? 'wss' : 'ws'}://${host}/ws`;
}

app.get('/', (_req, res) => res.send('Meeting backend up ✅'));
app.get('/healthz', (req, res) =>
  res.json({
    ok: true,
    env: {
      port: ENV.PORT,
      hasFrontendUrl: !!ENV.FRONTEND_URL,
      hasSignalingOverride: !!ENV.SIGNALING_URL,
      hasTurn: !!(ENV.TURN_URL && ENV.TURN_USER && ENV.TURN_PASS),
      roomCapacity: ENV.ROOM_CAPACITY,
    },
    ip: req.ip,
  })
);

// Create meeting from appointment
app.post('/api/meetings/create', async (req, res) => {
  try {
    const { appointmentId, patientEmail, doctorEmail } = req.body || {};
    if (!patientEmail || !doctorEmail) {
      return res.status(400).json({ error: 'patientEmail and doctorEmail required' });
    }
    const code = await genUniqueCode();
    const participants = [
      { email: lower(patientEmail), role: 'patient' },
      { email: lower(doctorEmail), role: 'doctor' },
    ];
    if (ENV.ADMIN_EMAIL && !participants.some((p) => p.email === lower(ENV.ADMIN_EMAIL))) {
      participants.push({ email: lower(ENV.ADMIN_EMAIL), role: 'admin' });
    }
    const meeting = await Meeting.create({ code, appointmentId: appointmentId || null, participants });

    const origin = getFrontendOrigin(req);
    const mk = (r, e) => `${origin.replace(/\/$/, '')}/meeting/${code}?role=${r}&email=${encodeURIComponent(lower(e))}`;
    res.json({
      code,
      meetingId: meeting._id,
      patientUrl: mk('patient', patientEmail),
      doctorUrl: mk('doctor', doctorEmail),
      adminUrl: ENV.ADMIN_EMAIL ? mk('admin', ENV.ADMIN_EMAIL) : null,
    });
  } catch (e) {
    if (e?.code === 11000) return res.status(409).json({ error: 'Code collision, retry' });
    res.status(400).json({ error: e?.message || 'Create failed' });
  }
});

// Verify & join token
app.post('/api/meetings/verify', async (req, res) => {
  try {
    const { code, email, role } = req.body || {};
    if (!code || !email || !role) return res.status(400).json({ error: 'code, email, role required' });
    if (!['patient', 'doctor', 'admin'].includes(role)) return res.status(400).json({ error: 'Invalid role' });

    const meeting = await Meeting.findOne({ code });
    if (!meeting) return res.status(400).json({ error: 'Invalid meeting code' });
    if (meeting.status === 'Ended') return res.status(403).json({ error: 'Meeting ended' });

    const e = lower(email);
    let p = meeting.participants.find((p) => p.email === e);
    if (!p) {
      if (meeting.participants.length >= ENV.ROOM_CAPACITY) return res.status(403).json({ error: 'Room is full' });
      meeting.participants.push({ email: e, role });
      await meeting.save();
      p = { email: e, role };
    }
    if ((p.role === 'doctor' || p.role === 'admin') && meeting.status === 'Scheduled') {
      meeting.status = 'Live';
      await meeting.save();
    }

    const token = sign({ code, email: e, role: p.role }, 60 * 60);
    const signalingUrl = getSignalingUrl(req);

    res.json({
      token,
      iceServers: buildIceServers(),
      signalingUrl,
      appointmentId: meeting.appointmentId || null,
      role: p.role,
    });
  } catch (e) {
    res.status(400).json({ error: e?.message || 'Verify failed' });
  }
});

// End meeting (admin/doctor — call from your admin API)
app.post('/api/meetings/end', async (req, res) => {
  try {
    const { code } = req.body || {};
    const m = await Meeting.findOne({ code });
    if (!m) return res.status(404).json({ error: 'Not found' });
    m.status = 'Ended';
    await m.save();
    const room = rooms.get(code);
    if (room) {
      for (const [, peer] of room.entries()) {
        try { peer.send(JSON.stringify({ type: 'room:ended' })); } catch {}
        try { peer.close(1000, 'ended'); } catch {}
      }
      rooms.delete(code);
    }
    res.json({ ok: true });
  } catch (e) { res.status(400).json({ error: e?.message || 'Failed' }); }
});

/* ---------- WebSocket Signaling ---------- */
const wss = new WebSocketServer({ noServer: true });
const rooms = new Map(); // code -> Map(email -> ws)

function getRoom(code) { if (!rooms.has(code)) rooms.set(code, new Map()); return rooms.get(code); }
function joinRoom(code, email, role, ws) {
  const room = getRoom(code);
  room.set(email, ws);
  ws._room = code; ws._email = email; ws._role = role; ws._authed = true; ws.isAlive = true;
}
function leaveRoom(ws) {
  const code = ws._room; const email = ws._email;
  if (!code) return;
  const room = rooms.get(code);
  if (!room) return;
  room.delete(email);
  if (room.size === 0) rooms.delete(code);
}
function broadcastToRoom(code, payload, exceptEmail = null) {
  const room = rooms.get(code); if (!room) return;
  for (const [em, peer] of room.entries()) {
    if (exceptEmail && em === exceptEmail) continue;
    if (peer.readyState === 1) { try { peer.send(JSON.stringify(payload)); } catch {} }
  }
}

wss.on('connection', (ws) => {
  const authTimer = setTimeout(() => { if (!ws._authed) try { ws.close(4001, 'no-auth'); } catch {} }, 6000);
  ws.on('pong', () => { ws.isAlive = true; });

  ws.on('message', async (raw) => {
    let msg; try { msg = JSON.parse(raw); } catch { return; }

    if (!ws._authed) {
      if (msg.type !== 'auth' || !msg.token) return;
      try {
        const { code, email, role } = jwt.verify(msg.token, ENV.MEETING_JWT_SECRET);
        const meeting = await Meeting.findOne({ code });
        if (!meeting) throw new Error('bad-meeting');
        const allowed = meeting.participants.some((p) => p.email === email && p.role === role);
        if (!allowed) throw new Error('bad-user');

        joinRoom(code, email, role, ws);
        ws.send(JSON.stringify({ type: 'auth-ok', you: { code, email, role } }));
        broadcastToRoom(code, { type: 'room:join', email, role }, email);
      } catch {
        ws.send(JSON.stringify({ type: 'auth-error' })); try { ws.close(4002, 'bad-token'); } catch {}
      }
      clearTimeout(authTimer);
      return;
    }

    const code = ws._room; const room = rooms.get(code); if (!room) return;
    const sendTo = (toEmail, payload) => {
      const peer = room.get(toEmail);
      if (peer && peer.readyState === 1) {
        try { peer.send(JSON.stringify({ ...payload, fromEmail: ws._email, fromRole: ws._role })); } catch {}
      }
    };

    switch (msg.type) {
      case 'room:who': {
        const roster = [];
        for (const [email, peer] of room.entries()) roster.push({ email, role: peer._role, online: peer.readyState === 1 });
        ws.send(JSON.stringify({ type: 'room:roster', roster }));
        break;
      }
      case 'rtc:offer': {
        if (!msg.toEmail || !msg.sdp) return;
        sendTo(msg.toEmail, { type: 'offer', sdp: msg.sdp });
        break;
      }
      case 'rtc:answer': {
        if (!msg.toEmail || !msg.sdp) return;
        sendTo(msg.toEmail, { type: 'answer', sdp: msg.sdp });
        break;
      }
      case 'rtc:candidate': {
        if (!msg.toEmail || !msg.candidate) return;
        sendTo(msg.toEmail, { type: 'candidate', candidate: msg.candidate });
        break;
      }
    }
  });

  ws.on('close', () => {
    const code = ws._room; const email = ws._email;
    leaveRoom(ws);
    if (code && email) broadcastToRoom(code, { type: 'room:leave', email });
  });
});

httpServer.on('upgrade', (req, socket, head) => {
  if (!req.url || !req.url.startsWith('/ws')) { socket.destroy(); return; }
  wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
});

// Heartbeat
setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) return ws.terminate();
    ws.isAlive = false;
    try { ws.ping(); } catch {}
  });
}, 15000);

httpServer.listen(ENV.PORT, () => {
  console.log('——— Meeting Server ———');
  console.log(`HTTP/WS Port : ${ENV.PORT}`);
  console.log(`Frontend URL : ${ENV.FRONTEND_URL || '(auto from request)'}`);
  console.log(`Signaling URL: ${ENV.SIGNALING_URL || '(auto per-request)'}`);
  console.log(`TURN Enabled : ${ENV.TURN_URL && ENV.TURN_USER && ENV.TURN_PASS ? 'yes' : 'no'}`);
  console.log(`Room Capacity: ${ENV.ROOM_CAPACITY}`);
  console.log('———————————————');
});
