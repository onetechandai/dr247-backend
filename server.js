// // // // // // // server.js
// // // // // // import express from 'express';
// // // // // // import cors from 'cors';
// // // // // // import dotenv from 'dotenv';
// // // // // // import mongoose from 'mongoose';
// // // // // // import jwt from 'jsonwebtoken';
// // // // // // import Meeting from './models/Meeting.js';

// // // // // // dotenv.config();

// // // // // // const app = express();
// // // // // // app.use(cors());
// // // // // // app.use(express.json());

// // // // // // // DB connect
// // // // // // await mongoose.connect(process.env.MONGODB_URI);
// // // // // // console.log('✅ MongoDB connected');

// // // // // // // Utils
// // // // // // const genCode = () => String(Math.floor(100000 + Math.random() * 900000));
// // // // // // const sign = (payload) =>
// // // // // //   jwt.sign(payload, process.env.MEETING_JWT_SECRET, { expiresIn: '30m' });

// // // // // // // Health
// // // // // // app.get('/', (_, res) => res.send('Meeting backend up ✅'));

// // // // // // /**
// // // // // //  * Create meeting
// // // // // //  * Body: { appointmentId?, patientEmail, doctorEmail }
// // // // // //  * Returns: { code, meetingId }
// // // // // //  */
// // // // // // app.post('/api/meetings/create', async (req, res) => {
// // // // // //   try {
// // // // // //     const { appointmentId, patientEmail, doctorEmail } = req.body;
// // // // // //     if (!patientEmail || !doctorEmail) {
// // // // // //       return res.status(400).json({ error: 'patientEmail and doctorEmail required' });
// // // // // //     }
// // // // // //     const code = genCode();
// // // // // //     const meeting = await Meeting.create({
// // // // // //       code,
// // // // // //       appointmentId: appointmentId || null,
// // // // // //       participants: [
// // // // // //         { email: String(patientEmail).toLowerCase(), role: 'patient' },
// // // // // //         { email: String(doctorEmail).toLowerCase(), role: 'doctor' },
// // // // // //       ],
// // // // // //     });
// // // // // //     res.json({ code: meeting.code, meetingId: meeting._id });
// // // // // //   } catch (e) {
// // // // // //     res.status(400).json({ error: e.message });
// // // // // //   }
// // // // // // });

// // // // // // /**
// // // // // //  * Verify join
// // // // // //  * Body: { code, email, role }
// // // // // //  * Returns: { token, iceServers, signalingUrl }
// // // // // //  */
// // // // // // app.post('/api/meetings/verify', async (req, res) => {
// // // // // //   try {
// // // // // //     const { code, email, role } = req.body;
// // // // // //     if (!code || !email || !role) {
// // // // // //       return res.status(400).json({ error: 'code, email, role required' });
// // // // // //     }
// // // // // //     const meeting = await Meeting.findOne({ code });
// // // // // //     if (!meeting) return res.status(400).json({ error: 'Invalid meeting code' });

// // // // // //     const allowed = meeting.participants.some(
// // // // // //       (p) => p.email === String(email).toLowerCase() && p.role === role
// // // // // //     );
// // // // // //     if (!allowed) return res.status(403).json({ error: 'Not allowed for this meeting' });

// // // // // //     const token = sign({ code, email: String(email).toLowerCase(), role });

// // // // // //     res.json({
// // // // // //       token,
// // // // // //       signalingUrl: process.env.SIGNALING_URL || 'ws://localhost:5081',
// // // // // //       iceServers: [
// // // // // //         { urls: ['stun:stun.l.google.com:19302'] },
// // // // // //         { urls: ['turn:localhost:3478'], username: process.env.TURN_USER, credential: process.env.TURN_PASS },
// // // // // //         // if you run TLS TURN:
// // // // // //         // { urls: ['turns:your-turn-domain:5349'], username: process.env.TURN_USER, credential: process.env.TURN_PASS },
// // // // // //       ],
// // // // // //     });
// // // // // //   } catch (e) {
// // // // // //     res.status(400).json({ error: e.message });
// // // // // //   }
// // // // // // });

// // // // // // app.listen(process.env.PORT || 5080, () =>
// // // // // //   console.log(`🚀 Meeting API listening on http://localhost:${process.env.PORT || 5080}`)
// // // // // // );



// // // // // import http from 'http';
// // // // // import express from 'express';
// // // // // import cors from 'cors';
// // // // // import dotenv from 'dotenv';
// // // // // import mongoose from 'mongoose';
// // // // // import jwt from 'jsonwebtoken';
// // // // // import { WebSocketServer } from 'ws';

// // // // // dotenv.config();

// // // // // /* =========================
// // // // //  * 1) Config
// // // // //  * =======================*/
// // // // // const {
// // // // //   PORT = 5080,
// // // // //   MONGODB_URI,
// // // // //   MEETING_JWT_SECRET,
// // // // //   FRONTEND_URL = 'http://localhost:3000',
// // // // //   ADMIN_EMAIL = '',
// // // // //   TURN_URL,
// // // // //   TURN_USER,
// // // // //   TURN_PASS,
// // // // // } = process.env;

// // // // // if (!MONGODB_URI) throw new Error('MONGODB_URI missing');
// // // // // if (!MEETING_JWT_SECRET) throw new Error('MEETING_JWT_SECRET missing');

// // // // // /* =========================
// // // // //  * 2) Express + HTTP server
// // // // //  * =======================*/
// // // // // const app = express();
// // // // // app.use(cors({ origin: true, credentials: true }));
// // // // // app.use(express.json());
// // // // // const httpServer = http.createServer(app);

// // // // // /* =========================
// // // // //  * 3) Mongo + Model (inline)
// // // // //  * =======================*/
// // // // // await mongoose.connect(MONGODB_URI);
// // // // // console.log('✅ MongoDB connected');

// // // // // const ParticipantSchema = new mongoose.Schema({
// // // // //   email: { type: String, required: true, lowercase: true, trim: true },
// // // // //   role:  { type: String, enum: ['patient', 'doctor', 'admin'], required: true },
// // // // // }, { _id: false });

// // // // // const MeetingSchema = new mongoose.Schema({
// // // // //   code: { type: String, required: true, index: { unique: true } }, // 6-digit unique
// // // // //   appointmentId: { type: String },
// // // // //   participants: { type: [ParticipantSchema], default: [] },
// // // // //   status: { type: String, enum: ['Scheduled', 'Live', 'Ended'], default: 'Scheduled' },
// // // // // }, { timestamps: true });

// // // // // const Meeting = mongoose.models.Meeting || mongoose.model('Meeting', MeetingSchema);

// // // // // /* =========================
// // // // //  * 4) Helpers
// // // // //  * =======================*/
// // // // // const genCode = () => String(Math.floor(100000 + Math.random() * 900000));
// // // // // async function genUniqueCode() {
// // // // //   for (let i = 0; i < 12; i++) {
// // // // //     const c = genCode();
// // // // //     const exists = await Meeting.exists({ code: c });
// // // // //     if (!exists) return c;
// // // // //   }
// // // // //   throw new Error('Could not generate unique meeting code');
// // // // // }
// // // // // const sign = (payload, expSec = 1800) => jwt.sign(payload, MEETING_JWT_SECRET, { expiresIn: expSec }); // 30m

// // // // // function buildIceServers() {
// // // // //   const ice = [{ urls: ['stun:stun.l.google.com:19302'] }];
// // // // //   if (TURN_URL && TURN_USER && TURN_PASS) {
// // // // //     ice.push({ urls: [TURN_URL], username: TURN_USER, credential: TURN_PASS });
// // // // //   }
// // // // //   return ice;
// // // // // }

// // // // // const lower = (x) => String(x || '').trim().toLowerCase();

// // // // // /* =========================
// // // // //  * 5) REST Routes
// // // // //  * =======================*/

// // // // // // health
// // // // // app.get('/', (_req, res) => res.send('Meeting backend up ✅'));

// // // // // /**
// // // // //  * Create Meeting
// // // // //  * Body: { appointmentId?, patientEmail, doctorEmail }
// // // // //  * Returns: { code, meetingId, patientUrl, doctorUrl, adminUrl? }
// // // // //  */
// // // // // app.post('/api/meetings/create', async (req, res) => {
// // // // //   try {
// // // // //     const { appointmentId, patientEmail, doctorEmail } = req.body || {};
// // // // //     if (!patientEmail || !doctorEmail) {
// // // // //       return res.status(400).json({ error: 'patientEmail and doctorEmail required' });
// // // // //     }
// // // // //     const code = await genUniqueCode();
// // // // //     const participants = [
// // // // //       { email: lower(patientEmail), role: 'patient' },
// // // // //       { email: lower(doctorEmail),  role: 'doctor'  },
// // // // //     ];
// // // // //     if (ADMIN_EMAIL && !participants.some(p => p.email === lower(ADMIN_EMAIL))) {
// // // // //       participants.push({ email: lower(ADMIN_EMAIL), role: 'admin' });
// // // // //     }

// // // // //     const meeting = await Meeting.create({ code, appointmentId: appointmentId || null, participants });

// // // // //     // Ready-to-open links (SAME PAGE with meeting params)
// // // // //     const patientUrl = `${FRONTEND_URL}/meeting?code=${code}&role=patient&email=${encodeURIComponent(lower(patientEmail))}`;
// // // // //     const doctorUrl  = `${FRONTEND_URL}/meeting?code=${code}&role=doctor&email=${encodeURIComponent(lower(doctorEmail))}`;
// // // // //     const adminUrl   = ADMIN_EMAIL ? `${FRONTEND_URL}/meeting?code=${code}&role=admin&email=${encodeURIComponent(lower(ADMIN_EMAIL))}` : null;

// // // // //     res.json({ code: meeting.code, meetingId: meeting._id, patientUrl, doctorUrl, adminUrl });
// // // // //   } catch (e) {
// // // // //     if (e?.code === 11000) return res.status(409).json({ error: 'Code collision, retry' });
// // // // //     res.status(400).json({ error: e?.message || 'Create failed' });
// // // // //   }
// // // // // });

// // // // // /**
// // // // //  * Verify Join
// // // // //  * Body: { code, email, role }
// // // // //  * Returns: { token, iceServers, signalingUrl }
// // // // //  */
// // // // // app.post('/api/meetings/verify', async (req, res) => {
// // // // //   try {
// // // // //     const { code, email, role } = req.body || {};
// // // // //     if (!code || !email || !role) {
// // // // //       return res.status(400).json({ error: 'code, email, role required' });
// // // // //     }
// // // // //     const meeting = await Meeting.findOne({ code });
// // // // //     if (!meeting) return res.status(400).json({ error: 'Invalid meeting code' });
// // // // //     if (meeting.status === 'Ended') return res.status(403).json({ error: 'Meeting ended' });

// // // // //     const e = lower(email);
// // // // //     const allowed = meeting.participants.some(p => p.email === e && p.role === role);
// // // // //     if (!allowed) return res.status(403).json({ error: 'Not allowed for this meeting' });

// // // // //     // Optional: set Live when first host verifies
// // // // //     if ((role === 'doctor' || role === 'admin') && meeting.status === 'Scheduled') {
// // // // //       meeting.status = 'Live';
// // // // //       await meeting.save();
// // // // //     }

// // // // //     const token = sign({ code, email: e, role }, 60 * 60); // 60m ok
// // // // //     const signalingUrl = `${(req.headers['x-forwarded-proto'] || 'http') === 'https' ? 'wss' : 'ws'}://${req.headers.host}/ws`;
// // // // //     res.json({ token, iceServers: buildIceServers(), signalingUrl });
// // // // //   } catch (e) {
// // // // //     res.status(400).json({ error: e?.message || 'Verify failed' });
// // // // //   }
// // // // // });

// // // // // /**
// // // // //  * Quick link builder (optional)
// // // // //  * GET /api/meetings/link?code=XXXXXX&email=u@e.com&role=patient
// // // // //  * Returns: { url }
// // // // //  */
// // // // // app.get('/api/meetings/link', async (req, res) => {
// // // // //   const { code, email, role } = req.query || {};
// // // // //   if (!code || !email || !role) return res.status(400).json({ error: 'code, email, role required' });
// // // // //   const url = `${FRONTEND_URL}/meeting?code=${encodeURIComponent(code)}&role=${encodeURIComponent(role)}&email=${encodeURIComponent(lower(email))}`;
// // // // //   res.json({ url });
// // // // // });


// // // // // /* =========================
// // // // //  * 6) WebSocket Signaling (same server)
// // // // //  *    - Token-auth (first message)
// // // // //  *    - Lobby: patient offers blocked until doctor/admin online
// // // // //  *    - Route messages by toEmail (no broadcast leakage)
// // // // //  * =======================*/
// // // // // const wss = new WebSocketServer({ noServer: true });

// // // // // // room map: code -> Map(email -> ws)
// // // // // const rooms = new Map();
// // // // // function getRoom(code) {
// // // // //   if (!rooms.has(code)) rooms.set(code, new Map());
// // // // //   return rooms.get(code);
// // // // // }
// // // // // function joinRoom(code, email, role, ws) {
// // // // //   const room = getRoom(code);
// // // // //   room.set(email, ws);
// // // // //   ws._room = code;
// // // // //   ws._email = email;
// // // // //   ws._role = role;
// // // // // }
// // // // // function leaveRoom(ws) {
// // // // //   const code = ws._room;
// // // // //   const email = ws._email;
// // // // //   if (!code) return;
// // // // //   const room = rooms.get(code);
// // // // //   if (!room) return;
// // // // //   room.delete(email);
// // // // //   if (room.size === 0) rooms.delete(code);
// // // // // }
// // // // // function roleOnline(code, role) {
// // // // //   const room = rooms.get(code);
// // // // //   if (!room) return false;
// // // // //   for (const [, peer] of room) {
// // // // //     if (peer._role === role && peer.readyState === 1) return true;
// // // // //   }
// // // // //   return false;
// // // // // }

// // // // // wss.on('connection', (ws) => {
// // // // //   ws.isAlive = true;
// // // // //   const authTimer = setTimeout(() => { if (!ws._authed) try { ws.close(4001, 'no-auth'); } catch {} }, 6000);

// // // // //   ws.on('pong', () => { ws.isAlive = true; });

// // // // //   ws.on('message', async (raw) => {
// // // // //     let msg;
// // // // //     try { msg = JSON.parse(raw); } catch { return; }

// // // // //     // First message must be auth
// // // // //     if (!ws._authed) {
// // // // //       if (msg.type !== 'auth' || !msg.token) return;
// // // // //       try {
// // // // //         const { code, email, role, exp } = jwt.verify(msg.token, MEETING_JWT_SECRET);
// // // // //         // extra check: meeting exists & user present
// // // // //         const meeting = await Meeting.findOne({ code });
// // // // //         if (!meeting) throw new Error('bad-meeting');
// // // // //         const allowed = meeting.participants.some(p => p.email === email && p.role === role);
// // // // //         if (!allowed) throw new Error('bad-user');

// // // // //         ws._authed = true;
// // // // //         joinRoom(code, email, role, ws);
// // // // //         ws.send(JSON.stringify({ type: 'auth-ok', you: { code, email, role, exp } }));
// // // // //       } catch {
// // // // //         ws.send(JSON.stringify({ type: 'auth-error' }));
// // // // //         try { ws.close(4002, 'bad-token'); } catch {}
// // // // //       }
// // // // //       clearTimeout(authTimer);
// // // // //       return;
// // // // //     }

// // // // //     // after auth…
// // // // //     const code = ws._room;
// // // // //     const room = rooms.get(code);
// // // // //     if (!room) return;

// // // // //     const sendTo = (toEmail, payload) => {
// // // // //       const peer = room.get(lower(toEmail));
// // // // //       if (peer && peer.readyState === 1) peer.send(JSON.stringify({ ...payload, fromEmail: ws._email }));
// // // // //     };

// // // // //     switch (msg.type) {
// // // // //       case 'room:who': {
// // // // //         const roster = [];
// // // // //         for (const [email, peer] of room.entries()) {
// // // // //           roster.push({ email, role: peer._role, online: peer.readyState === 1 });
// // // // //         }
// // // // //         ws.send(JSON.stringify({
// // // // //           type: 'room:roster',
// // // // //           roster,
// // // // //           adminOnline: roleOnline(code, 'admin') || roleOnline(code, 'doctor'),
// // // // //         }));
// // // // //         break;
// // // // //       }

// // // // //       case 'rtc:offer': {
// // // // //         // Lobby: patient cannot offer until doctor/admin online
// // // // //         const hostOnline = roleOnline(code, 'admin') || roleOnline(code, 'doctor');
// // // // //         if (ws._role === 'patient' && !hostOnline) {
// // // // //           ws.send(JSON.stringify({ type: 'lobby:wait' }));
// // // // //           return;
// // // // //         }
// // // // //         if (!msg.toEmail || !msg.sdp) return;
// // // // //         sendTo(msg.toEmail, { type: 'rtc:offer', sdp: msg.sdp });
// // // // //         break;
// // // // //       }

// // // // //       case 'rtc:answer': {
// // // // //         if (!msg.toEmail || !msg.sdp) return;
// // // // //         sendTo(msg.toEmail, { type: 'rtc:answer', sdp: msg.sdp });
// // // // //         break;
// // // // //       }

// // // // //       case 'rtc:candidate': {
// // // // //         if (!msg.toEmail || !msg.candidate) return;
// // // // //         sendTo(msg.toEmail, { type: 'rtc:candidate', candidate: msg.candidate });
// // // // //         break;
// // // // //       }
// // // // //     }
// // // // //   });

// // // // //   ws.on('close', () => leaveRoom(ws));
// // // // // });

// // // // // // upgrade HTTP → WS on /ws
// // // // // httpServer.on('upgrade', (req, socket, head) => {
// // // // //   const { url } = req;
// // // // //   if (!url || !url.startsWith('/ws')) {
// // // // //     socket.destroy(); return;
// // // // //   }
// // // // //   wss.handleUpgrade(req, socket, head, (ws) => {
// // // // //     wss.emit('connection', ws, req);
// // // // //   });
// // // // // });

// // // // // // heartbeat
// // // // // setInterval(() => {
// // // // //   wss.clients.forEach((ws) => {
// // // // //     if (!ws.isAlive) return ws.terminate();
// // // // //     ws.isAlive = false;
// // // // //     try { ws.ping(); } catch {}
// // // // //   });
// // // // // }, 15000);

// // // // // /* =========================
// // // // //  * 7) Start
// // // // //  * =======================*/
// // // // // httpServer.listen(PORT, () => {
// // // // //   console.log(`🚀 HTTP+WS server on http://localhost:${PORT}`);
// // // // //   console.log(`   WS endpoint: ws://localhost:${PORT}/ws`);
// // // // // });
// // // // // meeting-server/index.js
// // // // // server.js

// // // // // import http from 'http';
// // // // // import express from 'express';
// // // // // import cors from 'cors';
// // // // // import dotenv from 'dotenv';
// // // // // import mongoose from 'mongoose';
// // // // // import jwt from 'jsonwebtoken';
// // // // // import { WebSocketServer } from 'ws';

// // // // // dotenv.config();

// // // // // /* ========== 1) Config ========== */
// // // // // const {
// // // // //   PORT = 5080,
// // // // //   MONGODB_URI,
// // // // //   MEETING_JWT_SECRET,
// // // // //   FRONTEND_URL = 'http://localhost:3000',
// // // // //   ADMIN_EMAIL = '',           // optional: default admin auto-added on meeting create
// // // // //   TURN_URL,
// // // // //   TURN_USER,
// // // // //   TURN_PASS,
// // // // // } = process.env;

// // // // // if (!MONGODB_URI) throw new Error('MONGODB_URI missing');
// // // // // if (!MEETING_JWT_SECRET) throw new Error('MEETING_JWT_SECRET missing');

// // // // // /* ========== 2) Express + HTTP ========== */
// // // // // const app = express();
// // // // // app.use(cors({ origin: true, credentials: true }));
// // // // // app.use(express.json());
// // // // // const httpServer = http.createServer(app);

// // // // // /* ========== 3) Mongo Models ========== */
// // // // // await mongoose.connect(MONGODB_URI);
// // // // // console.log('✅ MongoDB connected');

// // // // // const ParticipantSchema = new mongoose.Schema(
// // // // //   {
// // // // //     email: { type: String, required: true, lowercase: true, trim: true },
// // // // //     role:  { type: String, enum: ['patient', 'doctor', 'admin'], required: true },
// // // // //   },
// // // // //   { _id: false }
// // // // // );

// // // // // const MeetingSchema = new mongoose.Schema(
// // // // //   {
// // // // //     code: { type: String, required: true, index: { unique: true } }, // 6-digit
// // // // //     appointmentId: { type: String },
// // // // //     participants: { type: [ParticipantSchema], default: [] },         // [{email,role}]
// // // // //     status: { type: String, enum: ['Scheduled', 'Live', 'Ended'], default: 'Scheduled' },
// // // // //   },
// // // // //   { timestamps: true }
// // // // // );

// // // // // const Meeting = mongoose.models.Meeting || mongoose.model('Meeting', MeetingSchema);

// // // // // /* ========== 4) Helpers ========== */
// // // // // const genCode = () => String(Math.floor(100000 + Math.random() * 900000));
// // // // // async function genUniqueCode() {
// // // // //   for (let i = 0; i < 12; i++) {
// // // // //     const c = genCode();
// // // // //     const exists = await Meeting.exists({ code: c });
// // // // //     if (!exists) return c;
// // // // //   }
// // // // //   throw new Error('Could not generate unique meeting code');
// // // // // }
// // // // // const sign = (payload, expSec = 3600) => jwt.sign(payload, MEETING_JWT_SECRET, { expiresIn: expSec });

// // // // // function buildIceServers() {
// // // // //   const ice = [{ urls: ['stun:stun.l.google.com:19302'] }];
// // // // //   if (TURN_URL && TURN_USER && TURN_PASS) {
// // // // //     ice.push({ urls: [TURN_URL], username: TURN_USER, credential: TURN_PASS });
// // // // //   }
// // // // //   return ice;
// // // // // }
// // // // // const lower = (x) => String(x || '').trim().toLowerCase();

// // // // // /* ========== 5) Routes ========== */
// // // // // app.get('/', (_req, res) => res.send('Meeting backend up ✅'));

// // // // // /**
// // // // //  * Create Meeting (optional helper from your appointments flow)
// // // // //  * Body: { appointmentId?, patientEmail, doctorEmail }
// // // // //  */
// // // // // app.post('/api/meetings/create', async (req, res) => {
// // // // //   try {
// // // // //     const { appointmentId, patientEmail, doctorEmail } = req.body || {};
// // // // //     if (!patientEmail || !doctorEmail) {
// // // // //       return res.status(400).json({ error: 'patientEmail and doctorEmail required' });
// // // // //     }
// // // // //     const code = await genUniqueCode();
// // // // //     const participants = [
// // // // //       { email: lower(patientEmail), role: 'patient' },
// // // // //       { email: lower(doctorEmail),  role: 'doctor'  },
// // // // //     ];
// // // // //     if (ADMIN_EMAIL && !participants.some(p => p.email === lower(ADMIN_EMAIL))) {
// // // // //       participants.push({ email: lower(ADMIN_EMAIL), role: 'admin' });
// // // // //     }

// // // // //     const meeting = await Meeting.create({ code, appointmentId: appointmentId || null, participants });

// // // // //     const makeUrl = (r, e) => `${FRONTEND_URL}/meeting/${code}?role=${r}&email=${encodeURIComponent(lower(e))}`;
// // // // //     res.json({
// // // // //       code: meeting.code,
// // // // //       meetingId: meeting._id,
// // // // //       patientUrl: makeUrl('patient', patientEmail),
// // // // //       doctorUrl:  makeUrl('doctor', doctorEmail),
// // // // //       adminUrl:   ADMIN_EMAIL ? makeUrl('admin', ADMIN_EMAIL) : null,
// // // // //     });
// // // // //   } catch (e) {
// // // // //     if (e?.code === 11000) return res.status(409).json({ error: 'Code collision, retry' });
// // // // //     res.status(400).json({ error: e?.message || 'Create failed' });
// // // // //   }
// // // // // });

// // // // // /**
// // // // //  * Verify & Auto-Add
// // // // //  * Body: { code, email, role }  // role ∈ {patient,doctor,admin}
// // // // //  */
// // // // // app.post('/api/meetings/verify', async (req, res) => {
// // // // //   try {
// // // // //     const { code, email, role } = req.body || {};
// // // // //     if (!code || !email || !role) {
// // // // //       return res.status(400).json({ error: 'code, email, role required' });
// // // // //     }
// // // // //     if (!['patient','doctor','admin'].includes(role)) {
// // // // //       return res.status(400).json({ error: 'Invalid role' });
// // // // //     }

// // // // //     const meeting = await Meeting.findOne({ code });
// // // // //     if (!meeting) return res.status(400).json({ error: 'Invalid meeting code' });
// // // // //     if (meeting.status === 'Ended') return res.status(403).json({ error: 'Meeting ended' });

// // // // //     const e = lower(email);

// // // // //     // Prevent duplicate email with different role → keep first role
// // // // //     let p = meeting.participants.find(p => p.email === e);
// // // // //     if (!p) {
// // // // //       // Optional room size cap
// // // // //       const MAX_ROOM = 12;
// // // // //       if (meeting.participants.length >= MAX_ROOM) {
// // // // //         return res.status(403).json({ error: 'Room is full' });
// // // // //       }
// // // // //       meeting.participants.push({ email: e, role });
// // // // //       await meeting.save();
// // // // //       p = { email: e, role };
// // // // //     }

// // // // //     // If host (doctor/admin) is joining & meeting is Scheduled → set Live
// // // // //     if ((p.role === 'doctor' || p.role === 'admin') && meeting.status === 'Scheduled') {
// // // // //       meeting.status = 'Live';
// // // // //       await meeting.save();
// // // // //     }

// // // // //     const token = sign({ code, email: e, role: p.role }, 60 * 60);
// // // // //     const signalingUrl = `${(req.headers['x-forwarded-proto'] || 'http') === 'https' ? 'wss' : 'ws'}://${req.headers.host}/ws`;

// // // // //     res.json({
// // // // //       token,
// // // // //       iceServers: buildIceServers(),
// // // // //       signalingUrl,
// // // // //       appointmentId: meeting.appointmentId || null,
// // // // //       role: p.role, // send effective role back
// // // // //     });
// // // // //   } catch (e) {
// // // // //     res.status(400).json({ error: e?.message || 'Verify failed' });
// // // // //   }
// // // // // });

// // // // // /**
// // // // //  * Link builder (optional)
// // // // //  */
// // // // // app.get('/api/meetings/link', async (req, res) => {
// // // // //   const { code, email, role } = req.query || {};
// // // // //   if (!code || !email || !role) return res.status(400).json({ error: 'code, email, role required' });
// // // // //   const url = `${FRONTEND_URL}/meeting/${encodeURIComponent(code)}?role=${encodeURIComponent(role)}&email=${encodeURIComponent(lower(email))}`;
// // // // //   res.json({ url });
// // // // // });

// // // // // /* ========== 6) WebSocket Signaling (rooms + broadcast) ========== */
// // // // // const wss = new WebSocketServer({ noServer: true });
// // // // // const rooms = new Map(); // code -> Map(email -> ws)

// // // // // function getRoom(code) {
// // // // //   if (!rooms.has(code)) rooms.set(code, new Map());
// // // // //   return rooms.get(code);
// // // // // }
// // // // // function joinRoom(code, email, role, ws) {
// // // // //   const room = getRoom(code);
// // // // //   room.set(email, ws);
// // // // //   ws._room = code;
// // // // //   ws._email = email;
// // // // //   ws._role = role;
// // // // // }
// // // // // function leaveRoom(ws) {
// // // // //   const code = ws._room;
// // // // //   const email = ws._email;
// // // // //   if (!code) return;
// // // // //   const room = rooms.get(code);
// // // // //   if (!room) return;
// // // // //   room.delete(email);
// // // // //   if (room.size === 0) rooms.delete(code);
// // // // // }
// // // // // function roleOnline(code, role) {
// // // // //   const room = rooms.get(code);
// // // // //   if (!room) return false;
// // // // //   for (const [, peer] of room) {
// // // // //     if (peer._role === role && peer.readyState === 1) return true;
// // // // //   }
// // // // //   return false;
// // // // // }
// // // // // function broadcastToRoom(code, payload, exceptEmail=null) {
// // // // //   const room = rooms.get(code);
// // // // //   if (!room) return;
// // // // //   for (const [email, peer] of room.entries()) {
// // // // //     if (exceptEmail && email === exceptEmail) continue;
// // // // //     if (peer.readyState === 1) {
// // // // //       try { peer.send(JSON.stringify(payload)); } catch {}
// // // // //     }
// // // // //   }
// // // // // }

// // // // // wss.on('connection', (ws) => {
// // // // //   ws.isAlive = true;
// // // // //   const authTimer = setTimeout(() => { if (!ws._authed) try { ws.close(4001, 'no-auth'); } catch {} }, 6000);

// // // // //   ws.on('pong', () => { ws.isAlive = true; });

// // // // //   ws.on('message', async (raw) => {
// // // // //     let msg;
// // // // //     try { msg = JSON.parse(raw); } catch { return; }

// // // // //     // First message must be auth
// // // // //     if (!ws._authed) {
// // // // //       if (msg.type !== 'auth' || !msg.token) return;
// // // // //       try {
// // // // //         const { code, email, role, exp } = jwt.verify(msg.token, MEETING_JWT_SECRET);

// // // // //         // extra safety: meeting exists & user present with same role
// // // // //         const meeting = await Meeting.findOne({ code });
// // // // //         if (!meeting) throw new Error('bad-meeting');
// // // // //         const allowed = meeting.participants.some(p => p.email === email && p.role === role);
// // // // //         if (!allowed) throw new Error('bad-user');

// // // // //         ws._authed = true;
// // // // //         joinRoom(code, email, role, ws);

// // // // //         ws.send(JSON.stringify({ type: 'auth-ok', you: { code, email, role, exp } }));

// // // // //         // notify others I joined
// // // // //         broadcastToRoom(code, { type: 'room:join', email, role }, email);
// // // // //       } catch {
// // // // //         ws.send(JSON.stringify({ type: 'auth-error' }));
// // // // //         try { ws.close(4002, 'bad-token'); } catch {}
// // // // //       }
// // // // //       clearTimeout(authTimer);
// // // // //       return;
// // // // //     }

// // // // //     // after auth...
// // // // //     const code = ws._room;
// // // // //     const room = rooms.get(code);
// // // // //     if (!room) return;

// // // // //     const sendTo = (toEmail, payload) => {
// // // // //       const peer = room.get(toEmail);
// // // // //       if (peer && peer.readyState === 1) {
// // // // //         try { peer.send(JSON.stringify({ ...payload, fromEmail: ws._email })); } catch {}
// // // // //       }
// // // // //     };

// // // // //     switch (msg.type) {
// // // // //       case 'room:who': {
// // // // //         const roster = [];
// // // // //         for (const [email, peer] of room.entries()) {
// // // // //           roster.push({ email, role: peer._role, online: peer.readyState === 1 });
// // // // //         }
// // // // //         ws.send(JSON.stringify({
// // // // //           type: 'room:roster',
// // // // //           roster,
// // // // //           adminOnline: roleOnline(code, 'admin') || roleOnline(code, 'doctor'),
// // // // //         }));
// // // // //         break;
// // // // //       }

// // // // //       case 'rtc:offer': {
// // // // //         // Lobby: patient cannot offer until a host is online
// // // // //         const hostOnline = roleOnline(code, 'admin') || roleOnline(code, 'doctor');
// // // // //         if (ws._role === 'patient' && !hostOnline) {
// // // // //           ws.send(JSON.stringify({ type: 'lobby:wait' }));
// // // // //           return;
// // // // //         }
// // // // //         if (!msg.toEmail || !msg.sdp) return;
// // // // //         sendTo(msg.toEmail, { type: 'offer', sdp: msg.sdp });
// // // // //         break;
// // // // //       }

// // // // //       case 'rtc:answer': {
// // // // //         if (!msg.toEmail || !msg.sdp) return;
// // // // //         sendTo(msg.toEmail, { type: 'answer', sdp: msg.sdp });
// // // // //         break;
// // // // //       }

// // // // //       case 'rtc:candidate': {
// // // // //         if (!msg.toEmail || !msg.candidate) return;
// // // // //         sendTo(msg.toEmail, { type: 'candidate', candidate: msg.candidate });
// // // // //         break;
// // // // //       }
// // // // //     }
// // // // //   });

// // // // //   ws.on('close', () => {
// // // // //     const code = ws._room;
// // // // //     const email = ws._email;
// // // // //     leaveRoom(ws);
// // // // //     if (code && email) broadcastToRoom(code, { type: 'room:leave', email });
// // // // //   });
// // // // // });

// // // // // // upgrade HTTP → WS on /ws
// // // // // httpServer.on('upgrade', (req, socket, head) => {
// // // // //   if (!req.url || !req.url.startsWith('/ws')) { socket.destroy(); return; }
// // // // //   wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
// // // // // });

// // // // // // heartbeat
// // // // // setInterval(() => {
// // // // //   wss.clients.forEach((ws) => {
// // // // //     if (!ws.isAlive) return ws.terminate();
// // // // //     ws.isAlive = false;
// // // // //     try { ws.ping(); } catch {}
// // // // //   });
// // // // // }, 15000);

// // // // // /* ========== 7) Start ========== */
// // // // // httpServer.listen(PORT, () => {
// // // // //   console.log(`🚀 HTTP+WS server on http://localhost:${PORT}`);
// // // // //   console.log(`   WS  endpoint: ws://localhost:${PORT}/ws`);
// // // // // });
// // // // // meeting-server/server.js
// // // // import http from 'http';
// // // // import express from 'express';
// // // // import cors from 'cors';
// // // // import dotenv from 'dotenv';
// // // // import mongoose from 'mongoose';
// // // // import jwt from 'jsonwebtoken';
// // // // import { WebSocketServer } from 'ws';

// // // // dotenv.config();

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

// // // // const app = express();
// // // // app.use(cors({ origin: true, credentials: true }));
// // // // app.use(express.json());
// // // // const httpServer = http.createServer(app);

// // // // await mongoose.connect(MONGODB_URI);
// // // // console.log('✅ MongoDB connected');

// // // // const ParticipantSchema = new mongoose.Schema(
// // // //   { email: { type: String, required: true, lowercase: true, trim: true }, role: { type: String, enum: ['patient','doctor','admin'], required: true } },
// // // //   { _id: false }
// // // // );
// // // // const MeetingSchema = new mongoose.Schema(
// // // //   { code: { type: String, required: true, index: { unique: true } }, appointmentId: { type: String }, participants: { type: [ParticipantSchema], default: [] }, status: { type: String, enum: ['Scheduled','Live','Ended'], default: 'Scheduled' } },
// // // //   { timestamps: true }
// // // // );
// // // // const Meeting = mongoose.models.Meeting || mongoose.model('Meeting', MeetingSchema);

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
// // // //   if (TURN_URL && TURN_USER && TURN_PASS) ice.push({ urls: [TURN_URL], username: TURN_USER, credential: TURN_PASS });
// // // //   return ice;
// // // // }
// // // // const lower = (x) => String(x || '').trim().toLowerCase();

// // // // app.get('/', (_req, res) => res.send('Meeting backend up ✅'));

// // // // app.post('/api/meetings/create', async (req, res) => {
// // // //   try {
// // // //     const { appointmentId, patientEmail, doctorEmail } = req.body || {};
// // // //     if (!patientEmail || !doctorEmail) return res.status(400).json({ error: 'patientEmail and doctorEmail required' });
// // // //     const code = await genUniqueCode();
// // // //     const participants = [
// // // //       { email: lower(patientEmail), role: 'patient' },
// // // //       { email: lower(doctorEmail),  role: 'doctor'  },
// // // //     ];
// // // //     if (ADMIN_EMAIL && !participants.some(p => p.email === lower(ADMIN_EMAIL))) {
// // // //       participants.push({ email: lower(ADMIN_EMAIL), role: 'admin' });
// // // //     }
// // // //     const meeting = await Meeting.create({ code, appointmentId: appointmentId || null, participants });
// // // //     const link = (r, e) => `${FRONTEND_URL}/meeting/${code}?role=${r}&email=${encodeURIComponent(lower(e))}`;
// // // //     res.json({ code, meetingId: meeting._id, patientUrl: link('patient', patientEmail), doctorUrl: link('doctor', doctorEmail), adminUrl: ADMIN_EMAIL ? link('admin', ADMIN_EMAIL) : null });
// // // //   } catch (e) {
// // // //     if (e?.code === 11000) return res.status(409).json({ error: 'Code collision, retry' });
// // // //     res.status(400).json({ error: e?.message || 'Create failed' });
// // // //   }
// // // // });

// // // // app.post('/api/meetings/verify', async (req, res) => {
// // // //   try {
// // // //     const { code, email, role } = req.body || {};
// // // //     if (!code || !email || !role) return res.status(400).json({ error: 'code, email, role required' });
// // // //     if (!['patient','doctor','admin'].includes(role)) return res.status(400).json({ error: 'Invalid role' });

// // // //     const meeting = await Meeting.findOne({ code });
// // // //     if (!meeting) return res.status(400).json({ error: 'Invalid meeting code' });
// // // //     if (meeting.status === 'Ended') return res.status(403).json({ error: 'Meeting ended' });

// // // //     const e = lower(email);
// // // //     let p = meeting.participants.find(p => p.email === e);
// // // //     if (!p) {
// // // //       const MAX = 16;
// // // //       if (meeting.participants.length >= MAX) return res.status(403).json({ error: 'Room is full' });
// // // //       meeting.participants.push({ email: e, role }); await meeting.save();
// // // //       p = { email: e, role };
// // // //     }
// // // //     if ((p.role === 'doctor' || p.role === 'admin') && meeting.status === 'Scheduled') {
// // // //       meeting.status = 'Live'; await meeting.save();
// // // //     }

// // // //     const token = sign({ code, email: e, role: p.role }, 3600);
// // // //     const isHttps = (req.headers['x-forwarded-proto'] || '').toString().includes('https') || req.secure;
// // // //     const signalingUrl = `${isHttps ? 'wss' : 'ws'}://${req.headers.host}/ws`;

// // // //     res.json({ token, iceServers: buildIceServers(), signalingUrl, appointmentId: meeting.appointmentId || null, role: p.role });
// // // //   } catch (e) { res.status(400).json({ error: e?.message || 'Verify failed' }); }
// // // // });

// // // // app.get('/api/meetings/link', (req, res) => {
// // // //   const { code, email, role } = req.query || {};
// // // //   if (!code || !email || !role) return res.status(400).json({ error: 'code, email, role required' });
// // // //   const url = `${FRONTEND_URL}/meeting/${encodeURIComponent(code)}?role=${encodeURIComponent(role)}&email=${encodeURIComponent(lower(email))}`;
// // // //   res.json({ url });
// // // // });

// // // // /* WebSocket signaling */
// // // // const wss = new WebSocketServer({ noServer: true });
// // // // const rooms = new Map(); // code -> Map(email -> ws)

// // // // function getRoom(code) { if (!rooms.has(code)) rooms.set(code, new Map()); return rooms.get(code); }
// // // // function joinRoom(code, email, role, ws) { const room = getRoom(code); room.set(email, ws); ws._room = code; ws._email = email; ws._role = role; ws._authed = true; }
// // // // function leaveRoom(ws) { const code = ws._room, email = ws._email; if (!code) return; const room = rooms.get(code); if (!room) return; room.delete(email); if (room.size === 0) rooms.delete(code); }
// // // // function broadcastToRoom(code, payload, exceptEmail=null) {
// // // //   const room = rooms.get(code); if (!room) return;
// // // //   for (const [email, peer] of room.entries()) {
// // // //     if (exceptEmail && email === exceptEmail) continue;
// // // //     if (peer.readyState === 1) { try { peer.send(JSON.stringify(payload)); } catch {} }
// // // //   }
// // // // }
// // // // wss.on('connection', (ws) => {
// // // //   ws.isAlive = true;
// // // //   const authTimer = setTimeout(() => { if (!ws._authed) try { ws.close(4001, 'no-auth'); } catch {} }, 6000);
// // // //   ws.on('pong', () => { ws.isAlive = true; });

// // // //   ws.on('message', async (raw) => {
// // // //     let msg; try { msg = JSON.parse(raw); } catch { return; }

// // // //     if (!ws._authed) {
// // // //       if (msg.type !== 'auth' || !msg.token) return;
// // // //       try {
// // // //         const { code, email, role, exp } = jwt.verify(msg.token, MEETING_JWT_SECRET);
// // // //         const meeting = await Meeting.findOne({ code });
// // // //         if (!meeting) throw new Error('bad-meeting');
// // // //         const allowed = meeting.participants.some(p => p.email === email && p.role === role);
// // // //         if (!allowed) throw new Error('bad-user');
// // // //         joinRoom(code, email, role, ws);
// // // //         ws.send(JSON.stringify({ type: 'auth-ok', you: { code, email, role, exp } }));
// // // //         broadcastToRoom(code, { type: 'room:join', email, role }, email);
// // // //       } catch {
// // // //         ws.send(JSON.stringify({ type: 'auth-error' })); try { ws.close(4002, 'bad-token'); } catch {}
// // // //       }
// // // //       clearTimeout(authTimer);
// // // //       return;
// // // //     }

// // // //     const code = ws._room; const room = rooms.get(code); if (!room) return;
// // // //     const sendTo = (toEmail, payload) => {
// // // //       const peer = room.get(toEmail);
// // // //       if (peer && peer.readyState === 1) { try { peer.send(JSON.stringify({ ...payload, fromEmail: ws._email, fromRole: ws._role })); } catch {} }
// // // //     };

// // // //     switch (msg.type) {
// // // //       case 'room:who': {
// // // //         const roster = [];
// // // //         for (const [email, peer] of room.entries()) roster.push({ email, role: peer._role, online: peer.readyState === 1 });
// // // //         ws.send(JSON.stringify({ type: 'room:roster', roster }));
// // // //         break;
// // // //       }
// // // //       case 'rtc:offer': {
// // // //         if (!msg.toEmail || !msg.sdp) return; sendTo(msg.toEmail, { type: 'offer', sdp: msg.sdp }); break;
// // // //       }
// // // //       case 'rtc:answer': {
// // // //         if (!msg.toEmail || !msg.sdp) return; sendTo(msg.toEmail, { type: 'answer', sdp: msg.sdp }); break;
// // // //       }
// // // //       case 'rtc:candidate': {
// // // //         if (!msg.toEmail || !msg.candidate) return; sendTo(msg.toEmail, { type: 'candidate', candidate: msg.candidate }); break;
// // // //       }
// // // //     }
// // // //   });

// // // //   ws.on('close', () => {
// // // //     const code = ws._room; const email = ws._email;
// // // //     leaveRoom(ws);
// // // //     if (code && email) broadcastToRoom(code, { type: 'room:leave', email });
// // // //   });
// // // // });

// // // // httpServer.on('upgrade', (req, socket, head) => {
// // // //   if (!req.url || !req.url.startsWith('/ws')) { socket.destroy(); return; }
// // // //   wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
// // // // });

// // // // setInterval(() => {
// // // //   wss.clients.forEach((ws) => {
// // // //     if (!ws.isAlive) return ws.terminate();
// // // //     ws.isAlive = false;
// // // //     try { ws.ping(); } catch {}
// // // //   });
// // // // }, 15000);

// // // // httpServer.listen(PORT, () => {
// // // //   console.log(`🚀 Meeting server http://localhost:${PORT}`);
// // // //   console.log(`   WS endpoint: ws://localhost:${PORT}/ws`);
// // // // });



// // // // import http from 'http';
// // // // import express from 'express';
// // // // import cors from 'cors';
// // // // import dotenv from 'dotenv';
// // // // import mongoose from 'mongoose';
// // // // import jwt from 'jsonwebtoken';
// // // // import { WebSocketServer } from 'ws';

// // // // dotenv.config();

// // // // /* ---------- 1) ENV + VALIDATION ---------- */
// // // // const ENV = {
// // // //   PORT: Number(process.env.PORT || 5080),
// // // //   MONGODB_URI: process.env.MONGODB_URI,
// // // //   MEETING_JWT_SECRET: process.env.MEETING_JWT_SECRET,
// // // //   FRONTEND_URL: process.env.FRONTEND_URL,            // optional, can be auto
// // // //   ADMIN_EMAIL: process.env.ADMIN_EMAIL || '',
// // // //   TURN_URL: process.env.TURN_URL || '',
// // // //   TURN_USER: process.env.TURN_USER || '',
// // // //   TURN_PASS: process.env.TURN_PASS || '',
// // // //   SIGNALING_URL: process.env.SIGNALING_URL || '',    // optional override e.g. wss://signal.example.com/ws
// // // // };

// // // // const required = ['MONGODB_URI', 'MEETING_JWT_SECRET'];
// // // // for (const k of required) {
// // // //   if (!ENV[k] || String(ENV[k]).trim() === '') {
// // // //     throw new Error(`${k} missing`);
// // // //   }
// // // // }

// // // // /* ---------- 2) APP BASICS ---------- */
// // // // const app = express();
// // // // app.set('trust proxy', true); // very important behind Railway/Render/NGINX for req.secure, forwarded headers

// // // // // Allow CORS from anywhere OR restrict to FRONTEND_URL if defined
// // // // app.use(
// // // //   cors({
// // // //     origin: (origin, cb) => {
// // // //       if (!origin) return cb(null, true);
// // // //       if (!ENV.FRONTEND_URL) return cb(null, true);
// // // //       try {
// // // //         const allowed = new URL(ENV.FRONTEND_URL).origin;
// // // //         return cb(null, origin === allowed);
// // // //       } catch { return cb(null, true); }
// // // //     },
// // // //     credentials: true,
// // // //   })
// // // // );
// // // // app.use(express.json());

// // // // const httpServer = http.createServer(app);

// // // // /* ---------- 3) DB ---------- */
// // // // await mongoose.connect(ENV.MONGODB_URI);
// // // // console.log('✅ MongoDB connected');

// // // // /* ---------- 4) MODELS ---------- */
// // // // import mongoosePkg from 'mongoose';
// // // // const { Schema, model, models } = mongoosePkg;

// // // // const ParticipantSchema = new Schema(
// // // //   {
// // // //     email: { type: String, required: true, lowercase: true, trim: true },
// // // //     role:  { type: String, enum: ['patient','doctor','admin'], required: true },
// // // //   },
// // // //   { _id: false }
// // // // );

// // // // const MeetingSchema = new Schema(
// // // //   {
// // // //     code: { type: String, required: true, index: { unique: true } }, // 6-digit
// // // //     appointmentId: { type: String },
// // // //     participants: { type: [ParticipantSchema], default: [] },
// // // //     status: { type: String, enum: ['Scheduled','Live','Ended'], default: 'Scheduled' },
// // // //   },
// // // //   { timestamps: true }
// // // // );

// // // // const Meeting = models.Meeting || model('Meeting', MeetingSchema);

// // // // /* ---------- 5) HELPERS ---------- */
// // // // const lower = (x) => String(x || '').trim().toLowerCase();
// // // // const genCode = () => String(Math.floor(100000 + Math.random() * 900000));
// // // // async function genUniqueCode() {
// // // //   for (let i = 0; i < 12; i++) {
// // // //     const c = genCode();
// // // //     const exists = await Meeting.exists({ code: c });
// // // //     if (!exists) return c;
// // // //   }
// // // //   throw new Error('Could not generate unique meeting code');
// // // // }
// // // // const sign = (payload, expSec = 3600) =>
// // // //   jwt.sign(payload, ENV.MEETING_JWT_SECRET, { expiresIn: expSec });

// // // // // TURN only when all 3 provided
// // // // function buildIceServers() {
// // // //   const ice = [{ urls: ['stun:stun.l.google.com:19302'] }];
// // // //   if (ENV.TURN_URL && ENV.TURN_USER && ENV.TURN_PASS) {
// // // //     ice.push({ urls: [ENV.TURN_URL], username: ENV.TURN_USER, credential: ENV.TURN_PASS });
// // // //   }
// // // //   return ice;
// // // // }

// // // // // Compute FRONTEND origin fallback from request if env missing
// // // // function getFrontendOrigin(req) {
// // // //   if (ENV.FRONTEND_URL) {
// // // //     try { return new URL(ENV.FRONTEND_URL).origin; } catch { /* ignore */ }
// // // //   }
// // // //   const proto = req.get('x-forwarded-proto') || (req.secure ? 'https' : 'http');
// // // //   const host = req.get('x-forwarded-host') || req.get('host');
// // // //   return `${proto}://${host}`;
// // // // }

// // // // // Compute signaling URL:
// // // // // 1) If SIGNALING_URL env set → use it (must be ws:// or wss:// and include /ws path)
// // // // // 2) Else derive from current host + /ws with correct ws/wss based on forwarded proto/req.secure
// // // // function getSignalingUrl(req) {
// // // //   if (ENV.SIGNALING_URL) return ENV.SIGNALING_URL;
// // // //   const isHttps = (req.get('x-forwarded-proto') || '').includes('https') || req.secure;
// // // //   const host = req.get('x-forwarded-host') || req.get('host');
// // // //   return `${isHttps ? 'wss' : 'ws'}://${host}/ws`;
// // // // }

// // // // /* ---------- 6) ROUTES ---------- */
// // // // app.get('/', (_req, res) => res.send('Meeting backend up ✅'));

// // // // // Health & config peek (no secrets)
// // // // app.get('/healthz', (req, res) => {
// // // //   res.json({
// // // //     ok: true,
// // // //     env: {
// // // //       port: ENV.PORT,
// // // //       hasFrontendUrl: !!ENV.FRONTEND_URL,
// // // //       hasSignalingOverride: !!ENV.SIGNALING_URL,
// // // //       hasTurn: !!(ENV.TURN_URL && ENV.TURN_USER && ENV.TURN_PASS),
// // // //     },
// // // //     ip: req.ip,
// // // //   });
// // // // });

// // // // /** Create meeting */
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
// // // //     if (ENV.ADMIN_EMAIL && !participants.some(p => p.email === lower(ENV.ADMIN_EMAIL))) {
// // // //       participants.push({ email: lower(ENV.ADMIN_EMAIL), role: 'admin' });
// // // //     }

// // // //     const meeting = await Meeting.create({ code, appointmentId: appointmentId || null, participants });

// // // //     const origin = getFrontendOrigin(req); // dynamic fallback
// // // //     const mk = (r, e) => `${origin.replace(/\/$/, '')}/meeting/${code}?role=${r}&email=${encodeURIComponent(lower(e))}`;
// // // //     res.json({
// // // //       code,
// // // //       meetingId: meeting._id,
// // // //       patientUrl: mk('patient', patientEmail),
// // // //       doctorUrl:  mk('doctor', doctorEmail),
// // // //       adminUrl:   ENV.ADMIN_EMAIL ? mk('admin', ENV.ADMIN_EMAIL) : null,
// // // //     });
// // // //   } catch (e) {
// // // //     if (e?.code === 11000) return res.status(409).json({ error: 'Code collision, retry' });
// // // //     res.status(400).json({ error: e?.message || 'Create failed' });
// // // //   }
// // // // });

// // // // /** Verify + add + ICE + signaling URL */
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
// // // //     let p = meeting.participants.find(p => p.email === e);
// // // //     if (!p) {
// // // //       const MAX = 16;
// // // //       if (meeting.participants.length >= MAX) {
// // // //         return res.status(403).json({ error: 'Room is full' });
// // // //       }
// // // //       meeting.participants.push({ email: e, role });
// // // //       await meeting.save();
// // // //       p = { email: e, role };
// // // //     }

// // // //     if ((p.role === 'doctor' || p.role === 'admin') && meeting.status === 'Scheduled') {
// // // //       meeting.status = 'Live'; await meeting.save();
// // // //     }

// // // //     const token = sign({ code, email: e, role: p.role }, 60 * 60);
// // // //     const signalingUrl = getSignalingUrl(req);

// // // //     res.json({
// // // //       token,
// // // //       iceServers: buildIceServers(),
// // // //       signalingUrl,
// // // //       appointmentId: meeting.appointmentId || null,
// // // //       role: p.role,
// // // //     });
// // // //   } catch (e) {
// // // //     res.status(400).json({ error: e?.message || 'Verify failed' });
// // // //   }
// // // // });

// // // // /** Link builder (optional) */
// // // // app.get('/api/meetings/link', (req, res) => {
// // // //   const { code, email, role } = req.query || {};
// // // //   if (!code || !email || !role) return res.status(400).json({ error: 'code, email, role required' });
// // // //   const origin = getFrontendOrigin(req);
// // // //   const url = `${origin.replace(/\/$/, '')}/meeting/${encodeURIComponent(code)}?role=${encodeURIComponent(role)}&email=${encodeURIComponent(lower(email))}`;
// // // //   res.json({ url });
// // // // });

// // // // /* ---------- 7) WS SIGNALING ---------- */
// // // // const wss = new WebSocketServer({ noServer: true });
// // // // const rooms = new Map(); // code -> Map(email -> ws)

// // // // function getRoom(code) { if (!rooms.has(code)) rooms.set(code, new Map()); return rooms.get(code); }
// // // // function joinRoom(code, email, role, ws) {
// // // //   const room = getRoom(code);
// // // //   room.set(email, ws);
// // // //   ws._room = code; ws._email = email; ws._role = role; ws._authed = true;
// // // // }
// // // // function leaveRoom(ws) {
// // // //   const code = ws._room; const email = ws._email;
// // // //   if (!code) return;
// // // //   const room = rooms.get(code);
// // // //   if (!room) return;
// // // //   room.delete(email);
// // // //   if (room.size === 0) rooms.delete(code);
// // // // }
// // // // function broadcastToRoom(code, payload, exceptEmail=null) {
// // // //   const room = rooms.get(code); if (!room) return;
// // // //   for (const [email, peer] of room.entries()) {
// // // //     if (exceptEmail && email === exceptEmail) continue;
// // // //     if (peer.readyState === 1) { try { peer.send(JSON.stringify(payload)); } catch {} }
// // // //   }
// // // // }

// // // // wss.on('connection', (ws) => {
// // // //   ws.isAlive = true;
// // // //   const authTimer = setTimeout(() => { if (!ws._authed) try { ws.close(4001, 'no-auth'); } catch {} }, 6000);
// // // //   ws.on('pong', () => { ws.isAlive = true; });

// // // //   ws.on('message', async (raw) => {
// // // //     let msg; try { msg = JSON.parse(raw); } catch { return; }

// // // //     if (!ws._authed) {
// // // //       if (msg.type !== 'auth' || !msg.token) return;
// // // //       try {
// // // //         const { code, email, role, exp } = jwt.verify(msg.token, ENV.MEETING_JWT_SECRET);
// // // //         const meeting = await Meeting.findOne({ code });
// // // //         if (!meeting) throw new Error('bad-meeting');
// // // //         const allowed = meeting.participants.some(p => p.email === email && p.role === role);
// // // //         if (!allowed) throw new Error('bad-user');

// // // //         joinRoom(code, email, role, ws);
// // // //         ws.send(JSON.stringify({ type: 'auth-ok', you: { code, email, role, exp } }));
// // // //         broadcastToRoom(code, { type: 'room:join', email, role }, email);
// // // //       } catch {
// // // //         ws.send(JSON.stringify({ type: 'auth-error' })); try { ws.close(4002, 'bad-token'); } catch {}
// // // //       }
// // // //       clearTimeout(authTimer);
// // // //       return;
// // // //     }

// // // //     const code = ws._room; const room = rooms.get(code); if (!room) return;
// // // //     const sendTo = (toEmail, payload) => {
// // // //       const peer = room.get(toEmail);
// // // //       if (peer && peer.readyState === 1) {
// // // //         try { peer.send(JSON.stringify({ ...payload, fromEmail: ws._email, fromRole: ws._role })); } catch {}
// // // //       }
// // // //     };

// // // //     switch (msg.type) {
// // // //       case 'room:who': {
// // // //         const roster = [];
// // // //         for (const [email, peer] of room.entries()) {
// // // //           roster.push({ email, role: peer._role, online: peer.readyState === 1 });
// // // //         }
// // // //         ws.send(JSON.stringify({ type: 'room:roster', roster }));
// // // //         break;
// // // //       }
// // // //       case 'rtc:offer': {
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
// // // //     const code = ws._room; const email = ws._email;
// // // //     leaveRoom(ws);
// // // //     if (code && email) broadcastToRoom(code, { type: 'room:leave', email });
// // // //   });
// // // // });

// // // // // HTTP → WS upgrade on /ws
// // // // httpServer.on('upgrade', (req, socket, head) => {
// // // //   if (!req.url || !req.url.startsWith('/ws')) { socket.destroy(); return; }
// // // //   wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
// // // // });

// // // // // WS heartbeat
// // // // setInterval(() => {
// // // //   wss.clients.forEach((ws) => {
// // // //     if (!ws.isAlive) return ws.terminate();
// // // //     ws.isAlive = false;
// // // //     try { ws.ping(); } catch {}
// // // //   });
// // // // }, 15000);

// // // // // Startup summary (no secrets)
// // // // httpServer.listen(ENV.PORT, () => {
// // // //   console.log('——— Meeting Server ———');
// // // //   console.log(`HTTP/WS Port : ${ENV.PORT}`);
// // // //   console.log(`Frontend URL : ${ENV.FRONTEND_URL || '(auto from request)'}`);
// // // //   console.log(`Signaling URL: ${ENV.SIGNALING_URL || '(auto per-request)'}`);
// // // //   console.log(`TURN Enabled : ${ENV.TURN_URL && ENV.TURN_USER && ENV.TURN_PASS ? 'yes' : 'no'}`);
// // // //   console.log('———————————————');
// // // // });
// // // // server/meeting-server.js
// // // import http from 'http';
// // // import express from 'express';
// // // import cors from 'cors';
// // // import dotenv from 'dotenv';
// // // import mongoose from 'mongoose';
// // // import jwt from 'jsonwebtoken';
// // // import { WebSocketServer } from 'ws';

// // // dotenv.config();

// // // const ENV = {
// // //   PORT: Number(process.env.PORT || 5080),
// // //   MONGODB_URI: process.env.MONGODB_URI,
// // //   MEETING_JWT_SECRET: process.env.MEETING_JWT_SECRET,
// // //   FRONTEND_URL: process.env.FRONTEND_URL || '',
// // //   SIGNALING_URL: process.env.SIGNALING_URL || '',
// // //   TURN_URL: process.env.TURN_URL || '',
// // //   TURN_USER: process.env.TURN_USER || '',
// // //   TURN_PASS: process.env.TURN_PASS || '',
// // //   CORS_ORIGINS: process.env.CORS_ORIGINS || '',
// // //   ADMIN_EMAIL: process.env.ADMIN_EMAIL || '',
// // // };

// // // for (const k of ['MONGODB_URI', 'MEETING_JWT_SECRET']) {
// // //   if (!ENV[k] || String(ENV[k]).trim() === '') throw new Error(`${k} missing`);
// // // }

// // // const app = express();
// // // app.set('trust proxy', true);

// // // const allowOrigins = (ENV.CORS_ORIGINS || '')
// // //   .split(',').map(s => s.trim()).filter(Boolean);

// // // app.use(cors({
// // //   origin: (origin, cb) => {
// // //     if (!origin) return cb(null, true);
// // //     if (!allowOrigins.length && !ENV.FRONTEND_URL) return cb(null, true);
// // //     try {
// // //       const allowedSet = new Set(allowOrigins.length ? allowOrigins : [new URL(ENV.FRONTEND_URL).origin]);
// // //       return cb(null, allowedSet.has(new URL(origin).origin));
// // //     } catch {
// // //       return cb(null, false);
// // //     }
// // //   },
// // //   credentials: true,
// // // }));
// // // app.use(express.json());

// // // const httpServer = http.createServer(app);

// // // await mongoose.connect(ENV.MONGODB_URI);
// // // console.log('✅ MongoDB connected');

// // // const { Schema, model, models } = mongoose;

// // // const ParticipantSchema = new Schema({
// // //   email: { type: String, required: true, lowercase: true, trim: true },
// // //   role:  { type: String, enum: ['patient','doctor','admin'], required: true },
// // // }, { _id: false });

// // // const MeetingSchema = new Schema({
// // //   code: { type: String, required: true, index: { unique: true } },
// // //   appointmentId: { type: String },
// // //   participants: { type: [ParticipantSchema], default: [] },
// // //   status: { type: String, enum: ['Scheduled','Live','Ended'], default: 'Scheduled' },
// // // }, { timestamps: true });

// // // const Meeting = models.Meeting || model('Meeting', MeetingSchema);

// // // const lower = (x) => String(x || '').trim().toLowerCase();
// // // const genCode = () => String(Math.floor(100000 + Math.random() * 900000));
// // // async function genUniqueCode() {
// // //   for (let i = 0; i < 14; i++) {
// // //     const c = genCode();
// // //     const exists = await Meeting.exists({ code: c });
// // //     if (!exists) return c;
// // //   }
// // //   throw new Error('Could not generate unique meeting code');
// // // }
// // // const sign = (payload, expSec = 3600) =>
// // //   jwt.sign(payload, ENV.MEETING_JWT_SECRET, { expiresIn: expSec });

// // // function buildIceServers() {
// // //   const ice = [{ urls: ['stun:stun.l.google.com:19302'] }];
// // //   if (ENV.TURN_URL && ENV.TURN_USER && ENV.TURN_PASS) {
// // //     ice.push({ urls: [ENV.TURN_URL], username: ENV.TURN_USER, credential: ENV.TURN_PASS });
// // //   }
// // //   return ice;
// // // }
// // // function getFrontendOrigin(req) {
// // //   if (ENV.FRONTEND_URL) {
// // //     try { return new URL(ENV.FRONTEND_URL).origin; } catch {}
// // //   }
// // //   const proto = req.get('x-forwarded-proto') || (req.secure ? 'https' : 'http');
// // //   const host = req.get('x-forwarded-host') || req.get('host');
// // //   return `${proto}://${host}`;
// // // }
// // // function getSignalingUrl(req) {
// // //   if (ENV.SIGNALING_URL) return ENV.SIGNALING_URL;
// // //   const isHttps = (req.get('x-forwarded-proto') || '').includes('https') || req.secure;
// // //   const host = req.get('x-forwarded-host') || req.get('host');
// // //   return `${isHttps ? 'wss' : 'ws'}://${host}/ws`;
// // // }

// // // app.get('/', (_req, res) => res.send('Meeting backend up ✅'));
// // // app.get('/healthz', (req, res) => res.json({
// // //   ok: true,
// // //   env: {
// // //     port: ENV.PORT,
// // //     hasFrontendUrl: !!ENV.FRONTEND_URL,
// // //     hasSignalingOverride: !!ENV.SIGNALING_URL,
// // //     hasTurn: !!(ENV.TURN_URL && ENV.TURN_USER && ENV.TURN_PASS),
// // //   },
// // //   ip: req.ip,
// // // }));

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

// // //     const origin = getFrontendOrigin(req);
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

// // // /* WS signaling */
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
// //   TURN_URL: process.env.TURN_URL || '',     // e.g. turns:turn.yourdomain.com:5349?transport=tcp
// //   TURN_USER: process.env.TURN_USER || '',
// //   TURN_PASS: process.env.TURN_PASS || '',
// //   CORS_ORIGINS: process.env.CORS_ORIGINS || '', // comma-separated allowlist (optional)
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
// //       const o = new URL(origin).origin;
// //       return cb(null, allowedSet.has(o));
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

// // /* ---------- WebSocket Signaling ---------- */
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
// // import http from 'http';
// // import express from 'express';
// // import cors from 'cors';
// // import dotenv from 'dotenv';
// // import mongoose from 'mongoose';
// // import jwt from 'jsonwebtoken';
// // import { WebSocketServer } from 'ws';
// // import helmet from 'helmet';

// // dotenv.config();

// // const ENV = {
// //   PORT: Number(process.env.PORT || 5080),
// //   MONGODB_URI: process.env.MONGODB_URI,
// //   MEETING_JWT_SECRET: process.env.MEETING_JWT_SECRET,
// //   FRONTEND_URL: process.env.FRONTEND_URL || '',
// //   SIGNALING_URL: process.env.SIGNALING_URL || '',
// //   TURN_URL: process.env.TURN_URL || '',     // e.g. turns:turn.yourdomain.com:5349?transport=tcp
// //   TURN_USER: process.env.TURN_USER || '',
// //   TURN_PASS: process.env.TURN_PASS || '',
// //   CORS_ORIGINS: process.env.CORS_ORIGINS || '', // comma-separated allowlist (optional)
// //   ADMIN_EMAIL: (process.env.ADMIN_EMAIL || '').toLowerCase(),
// //   ROOM_CAPACITY: Number(process.env.ROOM_CAPACITY || 16),
// // };

// // for (const k of ['MONGODB_URI', 'MEETING_JWT_SECRET']) {
// //   if (!ENV[k] || String(ENV[k]).trim() === '') throw new Error(`${k} missing`);
// // }

// // const app = express();
// // app.set('trust proxy', true);
// // app.use(helmet({ crossOriginEmbedderPolicy: false, contentSecurityPolicy: false }));

// // const allowOrigins = (ENV.CORS_ORIGINS || '')
// //   .split(',')
// //   .map((s) => s.trim())
// //   .filter(Boolean);

// // app.use(
// //   cors({
// //     origin: (origin, cb) => {
// //       if (!origin) return cb(null, true);
// //       if (!allowOrigins.length && !ENV.FRONTEND_URL) return cb(null, true);
// //       try {
// //         const allowedSet = new Set(allowOrigins.length ? allowOrigins : [new URL(ENV.FRONTEND_URL).origin]);
// //         const o = new URL(origin).origin;
// //         return cb(null, allowedSet.has(o));
// //       } catch {
// //         return cb(null, false);
// //       }
// //     },
// //     credentials: true,
// //   })
// // );
// // app.use(express.json());

// // const httpServer = http.createServer(app);

// // await mongoose.connect(ENV.MONGODB_URI);
// // console.log('✅ MongoDB connected');

// // const { Schema, model, models } = mongoose;

// // const ParticipantSchema = new Schema(
// //   {
// //     email: { type: String, required: true, lowercase: true, trim: true },
// //     role: { type: String, enum: ['patient', 'doctor', 'admin'], required: true },
// //   },
// //   { _id: false }
// // );

// // const MeetingSchema = new Schema(
// //   {
// //     code: { type: String, required: true, index: { unique: true } },
// //     appointmentId: { type: String },
// //     participants: { type: [ParticipantSchema], default: [] },
// //     status: { type: String, enum: ['Scheduled', 'Live', 'Ended'], default: 'Scheduled' },
// //   },
// //   { timestamps: true }
// // );

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
// // const sign = (payload, expSec = 3600) => jwt.sign(payload, ENV.MEETING_JWT_SECRET, { expiresIn: expSec });

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
// // app.get('/healthz', (req, res) =>
// //   res.json({
// //     ok: true,
// //     env: {
// //       port: ENV.PORT,
// //       hasFrontendUrl: !!ENV.FRONTEND_URL,
// //       hasSignalingOverride: !!ENV.SIGNALING_URL,
// //       hasTurn: !!(ENV.TURN_URL && ENV.TURN_USER && ENV.TURN_PASS),
// //       roomCapacity: ENV.ROOM_CAPACITY,
// //     },
// //     ip: req.ip,
// //   })
// // );

// // // Create meeting from appointment
// // app.post('/api/meetings/create', async (req, res) => {
// //   try {
// //     const { appointmentId, patientEmail, doctorEmail } = req.body || {};
// //     if (!patientEmail || !doctorEmail) {
// //       return res.status(400).json({ error: 'patientEmail and doctorEmail required' });
// //     }
// //     const code = await genUniqueCode();
// //     const participants = [
// //       { email: lower(patientEmail), role: 'patient' },
// //       { email: lower(doctorEmail), role: 'doctor' },
// //     ];
// //     if (ENV.ADMIN_EMAIL && !participants.some((p) => p.email === lower(ENV.ADMIN_EMAIL))) {
// //       participants.push({ email: lower(ENV.ADMIN_EMAIL), role: 'admin' });
// //     }
// //     const meeting = await Meeting.create({ code, appointmentId: appointmentId || null, participants });

// //     const origin = getFrontendOrigin(req);
// //     const mk = (r, e) => `${origin.replace(/\/$/, '')}/meeting/${code}?role=${r}&email=${encodeURIComponent(lower(e))}`;
// //     res.json({
// //       code,
// //       meetingId: meeting._id,
// //       patientUrl: mk('patient', patientEmail),
// //       doctorUrl: mk('doctor', doctorEmail),
// //       adminUrl: ENV.ADMIN_EMAIL ? mk('admin', ENV.ADMIN_EMAIL) : null,
// //     });
// //   } catch (e) {
// //     if (e?.code === 11000) return res.status(409).json({ error: 'Code collision, retry' });
// //     res.status(400).json({ error: e?.message || 'Create failed' });
// //   }
// // });

// // // Verify & join token
// // app.post('/api/meetings/verify', async (req, res) => {
// //   try {
// //     const { code, email, role } = req.body || {};
// //     if (!code || !email || !role) return res.status(400).json({ error: 'code, email, role required' });
// //     if (!['patient', 'doctor', 'admin'].includes(role)) return res.status(400).json({ error: 'Invalid role' });

// //     const meeting = await Meeting.findOne({ code });
// //     if (!meeting) return res.status(400).json({ error: 'Invalid meeting code' });
// //     if (meeting.status === 'Ended') return res.status(403).json({ error: 'Meeting ended' });

// //     const e = lower(email);
// //     let p = meeting.participants.find((p) => p.email === e);
// //     if (!p) {
// //       if (meeting.participants.length >= ENV.ROOM_CAPACITY) return res.status(403).json({ error: 'Room is full' });
// //       meeting.participants.push({ email: e, role });
// //       await meeting.save();
// //       p = { email: e, role };
// //     }
// //     if ((p.role === 'doctor' || p.role === 'admin') && meeting.status === 'Scheduled') {
// //       meeting.status = 'Live';
// //       await meeting.save();
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

// // // End meeting (admin/doctor — call from your admin API)
// // app.post('/api/meetings/end', async (req, res) => {
// //   try {
// //     const { code } = req.body || {};
// //     const m = await Meeting.findOne({ code });
// //     if (!m) return res.status(404).json({ error: 'Not found' });
// //     m.status = 'Ended';
// //     await m.save();
// //     const room = rooms.get(code);
// //     if (room) {
// //       for (const [, peer] of room.entries()) {
// //         try { peer.send(JSON.stringify({ type: 'room:ended' })); } catch {}
// //         try { peer.close(1000, 'ended'); } catch {}
// //       }
// //       rooms.delete(code);
// //     }
// //     res.json({ ok: true });
// //   } catch (e) { res.status(400).json({ error: e?.message || 'Failed' }); }
// // });

// // /* ---------- WebSocket Signaling ---------- */
// // const wss = new WebSocketServer({ noServer: true });
// // const rooms = new Map(); // code -> Map(email -> ws)

// // function getRoom(code) { if (!rooms.has(code)) rooms.set(code, new Map()); return rooms.get(code); }
// // function joinRoom(code, email, role, ws) {
// //   const room = getRoom(code);
// //   room.set(email, ws);
// //   ws._room = code; ws._email = email; ws._role = role; ws._authed = true; ws.isAlive = true;
// // }
// // function leaveRoom(ws) {
// //   const code = ws._room; const email = ws._email;
// //   if (!code) return;
// //   const room = rooms.get(code);
// //   if (!room) return;
// //   room.delete(email);
// //   if (room.size === 0) rooms.delete(code);
// // }
// // function broadcastToRoom(code, payload, exceptEmail = null) {
// //   const room = rooms.get(code); if (!room) return;
// //   for (const [em, peer] of room.entries()) {
// //     if (exceptEmail && em === exceptEmail) continue;
// //     if (peer.readyState === 1) { try { peer.send(JSON.stringify(payload)); } catch {} }
// //   }
// // }

// // wss.on('connection', (ws) => {
// //   const authTimer = setTimeout(() => { if (!ws._authed) try { ws.close(4001, 'no-auth'); } catch {} }, 6000);
// //   ws.on('pong', () => { ws.isAlive = true; });

// //   ws.on('message', async (raw) => {
// //     let msg; try { msg = JSON.parse(raw); } catch { return; }

// //     if (!ws._authed) {
// //       if (msg.type !== 'auth' || !msg.token) return;
// //       try {
// //         const { code, email, role } = jwt.verify(msg.token, ENV.MEETING_JWT_SECRET);
// //         const meeting = await Meeting.findOne({ code });
// //         if (!meeting) throw new Error('bad-meeting');
// //         const allowed = meeting.participants.some((p) => p.email === email && p.role === role);
// //         if (!allowed) throw new Error('bad-user');

// //         joinRoom(code, email, role, ws);
// //         ws.send(JSON.stringify({ type: 'auth-ok', you: { code, email, role } }));
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
// //         for (const [email, peer] of room.entries()) roster.push({ email, role: peer._role, online: peer.readyState === 1 });
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

// // // Heartbeat
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
// //   console.log(`Room Capacity: ${ENV.ROOM_CAPACITY}`);
// //   console.log('———————————————');
// // });
// // server/meeting-server.js
// // server/meeting-server.js

// // import http from 'http';
// // import express from 'express';
// // import cors from 'cors';
// // import dotenv from 'dotenv';
// // import mongoose from 'mongoose';
// // import jwt from 'jsonwebtoken';
// // import { WebSocketServer } from 'ws';
// // import helmet from 'helmet';

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
// //   ADMIN_EMAIL: (process.env.ADMIN_EMAIL || '').toLowerCase(),
// //   ROOM_CAPACITY: 5,
// //   MEETING_DURATION: Number(process.env.MEETING_DURATION || 7200),
// // };

// // class ProfessionalMeetingServer {
// //   constructor() {
// //     this.app = express();
// //     this.httpServer = http.createServer(this.app);
// //     this.wss = new WebSocketServer({ 
// //       noServer: true,
// //       clientTracking: true
// //     });
// //     this.rooms = new Map();
// //     this.initialize();
// //   }

// //   async initialize() {
// //     await this.connectDatabase();
// //     this.setupMiddleware();
// //     this.setupRoutes();
// //     this.setupWebSocket();
// //     this.startCleanupInterval();
// //   }

// //   async connectDatabase() {
// //     try {
// //       await mongoose.connect(ENV.MONGODB_URI);
// //       console.log('✅ MongoDB connected');
// //       await this.setupIndexes();
// //     } catch (error) {
// //       console.error('❌ MongoDB connection failed:', error);
// //       process.exit(1);
// //     }
// //   }

// //   async setupIndexes() {
// //     await mongoose.model('Meeting').createIndexes();
// //   }

// //   setupMiddleware() {
// //     this.app.use(helmet({
// //       crossOriginEmbedderPolicy: false,
// //       contentSecurityPolicy: false
// //     }));

// //     const allowOrigins = (ENV.CORS_ORIGINS || '')
// //       .split(',')
// //       .map(s => s.trim())
// //       .filter(Boolean);

// //     this.app.use(cors({
// //       origin: (origin, callback) => {
// //         if (!origin) return callback(null, true);
// //         try {
// //           const allowedSet = new Set(
// //             allowOrigins.length ? allowOrigins : [new URL(ENV.FRONTEND_URL).origin]
// //           );
// //           const requestOrigin = new URL(origin).origin;
// //           callback(null, allowedSet.has(requestOrigin));
// //         } catch {
// //           callback(null, false);
// //         }
// //       },
// //       credentials: true,
// //     }));

// //     this.app.use(express.json({ limit: '10mb' }));
// //     this.app.use(express.urlencoded({ extended: true }));
// //   }

// //   setupRoutes() {
// //     this.app.get('/health', (req, res) => {
// //       res.json({
// //         status: 'ok',
// //         timestamp: new Date().toISOString(),
// //         rooms: this.rooms.size,
// //         connections: this.wss.clients.size
// //       });
// //     });

// //     this.app.post('/api/meetings/create', this.createMeeting.bind(this));
// //     this.app.post('/api/meetings/verify', this.verifyMeeting.bind(this));
// //     this.app.post('/api/meetings/end', this.endMeeting.bind(this));
// //     this.app.get('/api/meetings/:code', this.getMeetingInfo.bind(this));
// //   }

// //   setupWebSocket() {
// //     this.httpServer.on('upgrade', (req, socket, head) => {
// //       if (!req.url?.startsWith('/ws')) {
// //         socket.destroy();
// //         return;
// //       }
// //       this.wss.handleUpgrade(req, socket, head, (ws) => {
// //         this.wss.emit('connection', ws, req);
// //       });
// //     });

// //     this.wss.on('connection', (ws, req) => {
// //       this.handleWebSocketConnection(ws, req);
// //     });

// //     // Heartbeat
// //     setInterval(() => {
// //       this.wss.clients.forEach((ws) => {
// //         if (!ws.isAlive) {
// //           console.log('Terminating inactive connection');
// //           ws.terminate();
// //           return;
// //         }
// //         ws.isAlive = false;
// //         try { 
// //           ws.ping(); 
// //         } catch (error) {
// //           console.error('Error pinging client:', error);
// //           ws.terminate();
// //         }
// //       });
// //     }, 30000);
// //   }

// //   handleWebSocketConnection(ws, req) {
// //     console.log('New WebSocket connection');
// //     ws.isAlive = true;
// //     const authTimeout = setTimeout(() => {
// //       if (!ws._authed) {
// //         console.log('Authentication timeout');
// //         ws.close(4001, 'Authentication timeout');
// //       }
// //     }, 10000);

// //     ws.on('pong', () => {
// //       ws.isAlive = true;
// //     });

// //     ws.on('message', async (data) => {
// //       try {
// //         const message = JSON.parse(data.toString());
// //         console.log('WebSocket message received:', message.type);
// //         await this.handleWebSocketMessage(ws, message);
// //       } catch (error) {
// //         console.error('WebSocket message error:', error);
// //         ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
// //       }
// //     });

// //     ws.on('close', (code, reason) => {
// //       console.log('WebSocket closed:', code, reason.toString());
// //       clearTimeout(authTimeout);
// //       this.handleWebSocketDisconnect(ws);
// //     });

// //     ws.on('error', (error) => {
// //       console.error('WebSocket error:', error);
// //       this.handleWebSocketDisconnect(ws);
// //     });
// //   }

// //   // ✅ FIXED: Complete WebSocket message handling
// //   async handleWebSocketMessage(ws, message) {
// //     if (!ws._authed) {
// //       if (message.type === 'auth' && message.token) {
// //         await this.handleAuthentication(ws, message.token);
// //       }
// //       return;
// //     }

// //     const { code, email } = ws;
// //     const room = this.rooms.get(code);

// //     if (!room) {
// //       console.log('Room not found:', code);
// //       ws.close(4003, 'Room not found');
// //       return;
// //     }

// //     console.log('Processing message:', message.type, 'from:', email);

// //     switch (message.type) {
// //       case 'room:who':
// //         this.sendRoomRoster(ws, room);
// //         break;

// //       // ✅ ADDED: WebRTC signaling messages
// //       case 'rtc:offer':
// //       case 'rtc:answer':
// //       case 'rtc:candidate':
// //         this.relayWebRTCMessage(room, message, email);
// //         break;

// //       case 'chat':
// //         console.log('Chat message from:', email, message.text);
// //         this.broadcastToRoom(room, {
// //           type: 'chat',
// //           from: email,
// //           text: message.text, // ✅ Fixed: 'message' to 'text'
// //           timestamp: new Date().toISOString()
// //         }, email);
// //         break;

// //       case 'ping':
// //         ws.send(JSON.stringify({ type: 'pong' }));
// //         break;

// //       default:
// //         console.log('Unknown message type:', message.type);
// //     }
// //   }

// //   // ✅ ADDED: WebRTC message relaying
// //   relayWebRTCMessage(room, message, fromEmail) {
// //     const targetPeer = room.get(message.toEmail);
// //     if (targetPeer && targetPeer.readyState === 1) {
// //       console.log('Relaying WebRTC message to:', message.toEmail, 'type:', message.type);
// //       targetPeer.send(JSON.stringify({
// //         ...message,
// //         fromEmail,
// //         fromRole: room.get(fromEmail)?.role
// //       }));
// //     } else {
// //       console.log('Target peer not found or not ready:', message.toEmail);
// //     }
// //   }

// //   // ✅ IMPROVED: Authentication with room joining
// //   async handleAuthentication(ws, token) {
// //     try {
// //       console.log('Authenticating user...');
// //       const { code, email, role } = jwt.verify(token, ENV.MEETING_JWT_SECRET);
      
// //       const meeting = await mongoose.model('Meeting').findOne({ code });
// //       if (!meeting) throw new Error('Meeting not found');
// //       if (meeting.status === 'Ended') throw new Error('Meeting has ended');

// //       const participant = meeting.participants.find(p => p.email === email && p.role === role);

// //       if (!participant) {
// //         if (meeting.participants.length >= ENV.ROOM_CAPACITY) {
// //           throw new Error('Room is full (max 5 participants)');
// //         }
// //         meeting.participants.push({ email, role });
// //         await meeting.save();
// //         console.log('New participant added:', email);
// //       }

// //       this.joinRoom(code, email, role, ws);

// //       ws.send(JSON.stringify({ 
// //         type: 'auth-ok', 
// //         user: { email, role, code } 
// //       }));

// //       console.log('User authenticated:', email);

// //       // ✅ Notify others about new participant
// //       this.broadcastToRoom(this.rooms.get(code), {
// //         type: 'room:join',
// //         email,
// //         role,
// //         timestamp: new Date().toISOString()
// //       }, email);

// //     } catch (error) {
// //       console.error('Authentication error:', error);
// //       ws.send(JSON.stringify({ 
// //         type: 'auth-error', 
// //         message: error.message 
// //       }));
// //       ws.close(4002, 'Authentication failed');
// //     }
// //   }

// //   // ✅ ADDED: Room management
// //   joinRoom(code, email, role, ws) {
// //     if (!this.rooms.has(code)) {
// //       console.log('Creating new room:', code);
// //       this.rooms.set(code, new Map());
// //     }

// //     const room = this.rooms.get(code);
// //     room.set(email, ws);

// //     ws._authed = true;
// //     ws.code = code;
// //     ws.email = email;
// //     ws.role = role;
// //     ws.joinedAt = new Date();

// //     console.log('User joined room:', email, 'Room size:', room.size);
// //   }

// //   // ✅ ADDED: Handle disconnection properly
// //   handleWebSocketDisconnect(ws) {
// //     if (!ws._authed) return;

// //     const { code, email } = ws;
// //     const room = this.rooms.get(code);

// //     if (room) {
// //       room.delete(email);
// //       console.log('User left room:', email, 'Room size:', room.size);

// //       // ✅ Notify others about participant leaving
// //       this.broadcastToRoom(room, {
// //         type: 'room:leave',
// //         email,
// //         timestamp: new Date().toISOString()
// //       });

// //       if (room.size === 0) {
// //         console.log('Room is empty, deleting:', code);
// //         this.rooms.delete(code);
// //       }
// //     }
// //   }

// //   // ✅ ADDED: Send room roster
// //   sendRoomRoster(ws, room) {
// //     const roster = Array.from(room.entries()).map(([email, peer]) => ({
// //       email,
// //       role: peer.role,
// //       online: peer.readyState === 1,
// //       joinedAt: peer.joinedAt
// //     }));

// //     console.log('Sending roster to:', ws.email, 'participants:', roster.length);
// //     ws.send(JSON.stringify({
// //       type: 'room:roster',
// //       roster
// //     }));
// //   }

// //   // ✅ IMPROVED: Broadcast with exception handling
// //   broadcastToRoom(room, message, exceptEmail = null) {
// //     let sentCount = 0;
// //     for (const [email, peer] of room.entries()) {
// //       if (exceptEmail && email === exceptEmail) continue;
// //       if (peer.readyState === 1) {
// //         try {
// //           peer.send(JSON.stringify(message));
// //           sentCount++;
// //         } catch (error) {
// //           console.error('Broadcast error to:', email, error);
// //         }
// //       }
// //     }
// //     console.log(`Broadcasted message to ${sentCount} participants`);
// //   }

// //   // ... (rest of your API handlers remain the same)
// //   async createMeeting(req, res) {
// //     // ... your existing code
// //   }

// //   async verifyMeeting(req, res) {
// //     // ... your existing code
// //   }

// //   async endMeeting(req, res) {
// //     // ... your existing code
// //   }

// //   async getMeetingInfo(req, res) {
// //     // ... your existing code
// //   }

// //   // Utility methods
// //   normalizeEmail(email) {
// //     return String(email || '').trim().toLowerCase();
// //   }

// //   async generateUniqueCode() {
// //     for (let i = 0; i < 10; i++) {
// //       const code = String(Math.floor(100000 + Math.random() * 900000));
// //       const exists = await mongoose.model('Meeting').exists({ code });
// //       if (!exists) return code;
// //     }
// //     throw new Error('Could not generate unique meeting code');
// //   }

// //   buildIceServers() {
// //     const servers = [
// //       { urls: 'stun:stun.l.google.com:19302' },
// //       { urls: 'stun:stun1.l.google.com:19302' }
// //     ];

// //     if (ENV.TURN_URL && ENV.TURN_USER && ENV.TURN_PASS) {
// //       servers.push({
// //         urls: ENV.TURN_URL,
// //         username: ENV.TURN_USER,
// //         credential: ENV.TURN_PASS
// //       });
// //     }

// //     return servers;
// //   }

// //   getBaseUrl(req) {
// //     if (ENV.FRONTEND_URL) {
// //       return ENV.FRONTEND_URL.replace(/\/$/, '');
// //     }
// //     const proto = req.get('x-forwarded-proto') || (req.secure ? 'https' : 'http');
// //     const host = req.get('x-forwarded-host') || req.get('host');
// //     return `${proto}://${host}`;
// //   }

// //   getSignalingUrl(req) {
// //     if (ENV.SIGNALING_URL) {
// //       return ENV.SIGNALING_URL;
// //     }
// //     const isHttps = (req.get('x-forwarded-proto') || '').includes('https') || req.secure;
// //     const host = req.get('x-forwarded-host') || req.get('host');
// //     return `${isHttps ? 'wss' : 'ws'}://${host}/ws`;
// //   }

// //   startCleanupInterval() {
// //     setInterval(async () => {
// //       try {
// //         const now = new Date();
// //         const expiredMeetings = await mongoose.model('Meeting')
// //           .find({ status: 'Live', expiresAt: { $lt: now } });

// //         for (const meeting of expiredMeetings) {
// //           meeting.status = 'Ended';
// //           await meeting.save();

// //           const room = this.rooms.get(meeting.code);
// //           if (room) {
// //             this.broadcastToRoom(room, {
// //               type: 'room:ended',
// //               reason: 'Meeting time expired'
// //             });

// //             for (const [, ws] of room.entries()) {
// //               try { ws.close(1000, 'Meeting expired'); } catch {}
// //             }
// //             this.rooms.delete(meeting.code);
// //           }
// //         }

// //         for (const [code, room] of this.rooms.entries()) {
// //           if (room.size === 0) {
// //             console.log('Cleaning up empty room:', code);
// //             this.rooms.delete(code);
// //           }
// //         }

// //       } catch (error) {
// //         console.error('Cleanup interval error:', error);
// //       }
// //     }, 60000);
// //   }

// //   start(port = ENV.PORT) {
// //     this.httpServer.listen(port, () => {
// //       console.log('🎯 Professional Meeting Server Started');
// //       console.log(`📍 Port: ${port}`);
// //       console.log(`🌐 Frontend: ${ENV.FRONTEND_URL || '(auto)'}`);
// //       console.log(`📡 Signaling: ${ENV.SIGNALING_URL || '(auto)'}`);
// //       console.log(`👥 Capacity: ${ENV.ROOM_CAPACITY} participants`);
// //       console.log('─────────────────────────────');
// //     });
// //   }
// // }

// // // MongoDB Schema (same as before)
// // const meetingSchema = new mongoose.Schema({
// //   code: { type: String, required: true, unique: true, index: true },
// //   appointmentId: { type: String, index: true },
// //   participants: [{
// //     email: { type: String, required: true },
// //     role: { type: String, enum: ['patient', 'doctor', 'admin'], required: true }
// //   }],
// //   status: { 
// //     type: String, 
// //     enum: ['Scheduled', 'Live', 'Ended'], 
// //     default: 'Scheduled' 
// //   },
// //   duration: { type: Number, default: ENV.MEETING_DURATION },
// //   expiresAt: { type: Date },
// //   startedAt: { type: Date },
// //   endedAt: { type: Date }
// // }, { 
// //   timestamps: true 
// // });

// // meetingSchema.index({ expiresAt: 1 });
// // meetingSchema.index({ status: 1 });
// // meetingSchema.index({ 'participants.email': 1 });

// // const Meeting = mongoose.model('Meeting', meetingSchema);

// // // Start server
// // const server = new ProfessionalMeetingServer();
// // server.start();

// // export default server;
// // server.js (ESM)

// import http from 'http';
// import express from 'express';
// import cors from 'cors';
// import dotenv from 'dotenv';
// import mongoose from 'mongoose';
// import jwt from 'jsonwebtoken';
// import { WebSocketServer } from 'ws';
// import helmet from 'helmet';

// dotenv.config();

// // ───────────────────────────────────────────────────────────────────────────────
// // ENV
// // ───────────────────────────────────────────────────────────────────────────────
// const ENV = {
//   PORT: Number(process.env.PORT || 5080),
//   MONGODB_URI: process.env.MONGODB_URI,
//   MEETING_JWT_SECRET: process.env.MEETING_JWT_SECRET,
//   FRONTEND_URL: process.env.FRONTEND_URL || '',            // e.g. http://localhost:3000
//   SIGNALING_URL: process.env.SIGNALING_URL || '',          // e.g. wss://meet.example.com/ws
//   TURN_URL: process.env.TURN_URL || '',                    // e.g. turns:turn.example.com:5349
//   TURN_USER: process.env.TURN_USER || '',
//   TURN_PASS: process.env.TURN_PASS || '',
//   CORS_ORIGINS: process.env.CORS_ORIGINS || '',            // comma-separated list
//   ADMIN_EMAIL: (process.env.ADMIN_EMAIL || '').toLowerCase(),
//   ROOM_CAPACITY: Number(process.env.ROOM_CAPACITY || 100),
//   MEETING_DURATION: Number(process.env.MEETING_DURATION || 7200), // seconds
// };

// if (!ENV.MONGODB_URI) { console.error('❌ Missing MONGODB_URI'); process.exit(1); }
// if (!ENV.MEETING_JWT_SECRET) { console.error('❌ Missing MEETING_JWT_SECRET'); process.exit(1); }

// // ───────────────────────────────────────────────────────────────────────────────
// // MongoDB Schema & Model
// // ───────────────────────────────────────────────────────────────────────────────
// const meetingSchema = new mongoose.Schema({
//   code: { type: String, required: true, unique: true, index: true },
//   appointmentId: { type: String, index: true },
//   participants: [{
//     email: { type: String, required: true },
//     role: { type: String, enum: ['patient', 'doctor', 'admin'], required: true },
//   }],
//   status: { type: String, enum: ['Scheduled', 'Live', 'Ended'], default: 'Scheduled' },
//   duration: { type: Number, default: ENV.MEETING_DURATION },
//   expiresAt: { type: Date },
//   startedAt: { type: Date },
//   endedAt: { type: Date },
// }, { timestamps: true });

// meetingSchema.index({ expiresAt: 1 });
// meetingSchema.index({ status: 1 });
// meetingSchema.index({ 'participants.email': 1 });

// const Meeting = mongoose.model('Meeting', meetingSchema);

// // ───────────────────────────────────────────────────────────────────────────────
// // Server
// // ───────────────────────────────────────────────────────────────────────────────
// class ProfessionalMeetingServer {
//   constructor() {
//     this.app = express();
//     this.httpServer = http.createServer(this.app);
//     this.wss = new WebSocketServer({ noServer: true, clientTracking: true });

//     // Map<code, Map<email, ws>>
//     this.rooms = new Map();

//     this.initialize();
//   }

//   async initialize() {
//     await this.connectDatabase();
//     this.setupMiddleware();
//     this.setupRoutes();
//     this.setupWebSocket();
//     this.startCleanupInterval();
//   }

//   async connectDatabase() {
//     await mongoose.connect(ENV.MONGODB_URI);
//     console.log('[INFO] ✅ MongoDB connected');
//     await Meeting.createIndexes();
//     console.log('[INFO] 📚 Indexes ensured');
//   }

//   setupMiddleware() {
//     this.app.use(helmet({ crossOriginEmbedderPolicy: false, contentSecurityPolicy: false }));

//     const allowOrigins = (ENV.CORS_ORIGINS || '')
//       .split(',').map(s => s.trim()).filter(Boolean);

//     this.app.use(cors({
//       origin: (origin, cb) => {
//         if (!origin) return cb(null, true);
//         try {
//           const allowed = new Set(
//             allowOrigins.length ? allowOrigins : [new URL(ENV.FRONTEND_URL).origin]
//           );
//           const reqOrigin = new URL(origin).origin;
//           cb(null, allowed.has(reqOrigin));
//         } catch {
//           cb(null, false);
//         }
//       },
//       credentials: true,
//     }));

//     this.app.use(express.json({ limit: '10mb' }));
//     this.app.use(express.urlencoded({ extended: true }));
//   }

//   // ───────────────────────────────────────────────────────────────────────────
//   // REST
//   // ───────────────────────────────────────────────────────────────────────────
//   setupRoutes() {
//     this.app.get('/health', (req, res) => {
//       res.json({
//         status: 'ok',
//         timestamp: new Date().toISOString(),
//         rooms: this.rooms.size,
//         connections: this.wss.clients.size,
//       });
//     });

//     this.app.post('/api/meetings/create', this.createMeeting.bind(this));
//     this.app.post('/api/meetings/verify', this.verifyMeeting.bind(this));
//     this.app.post('/api/meetings/end', this.endMeeting.bind(this));
//     this.app.get('/api/meetings/:code', this.getMeetingInfo.bind(this));
//   }

//   async createMeeting(req, res) {
//     try {
//       const { appointmentId, patientEmail, doctorEmail, duration } = req.body;
//       if (!patientEmail || !doctorEmail) {
//         return res.status(400).json({ error: 'Patient and doctor emails are required' });
//       }

//       const code = await this.generateUniqueCode();
//       const normalizedPatient = this.normalizeEmail(patientEmail);
//       const normalizedDoctor = this.normalizeEmail(doctorEmail);
//       const participants = [
//         { email: normalizedPatient, role: 'patient' },
//         { email: normalizedDoctor, role: 'doctor' },
//       ];
//       if (ENV.ADMIN_EMAIL) {
//         participants.push({ email: this.normalizeEmail(ENV.ADMIN_EMAIL), role: 'admin' });
//       }

//       const dur = Number(duration || ENV.MEETING_DURATION);
//       const expiresAt = new Date(Date.now() + dur * 1000);

//       const meeting = await Meeting.create({
//         code, appointmentId, participants, duration: dur, expiresAt,
//       });

//       const baseUrl = this.getBaseUrl(req);
//       const urls = {
//         patient: `${baseUrl}/meeting/${code}?role=patient&email=${encodeURIComponent(normalizedPatient)}`,
//         doctor:  `${baseUrl}/meeting/${code}?role=doctor&email=${encodeURIComponent(normalizedDoctor)}`,
//         admin:   ENV.ADMIN_EMAIL ? `${baseUrl}/meeting/${code}?role=admin&email=${encodeURIComponent(ENV.ADMIN_EMAIL)}` : null,
//       };

//       res.json({ ok: true, code, meetingId: meeting._id, urls, expiresAt, maxParticipants: ENV.ROOM_CAPACITY });
//     } catch (e) {
//       console.error('Create meeting error:', e);
//       res.status(400).json({ error: e.message });
//     }
//   }

//   async verifyMeeting(req, res) {
//     try {
//       const { code, email, role } = req.body;
//       console.log('[HTTP] POST /api/meetings/verify', { code, email, role });

//       if (!code || !email || !role) return res.status(400).json({ error: 'Code, email, and role are required' });

//       const meeting = await Meeting.findOne({ code });
//       if (!meeting) return res.status(404).json({ error: 'Meeting not found' });
//       if (meeting.status === 'Ended') return res.status(403).json({ error: 'Meeting has ended' });

//       const normalizedEmail = this.normalizeEmail(email);
//       let participant = meeting.participants.find(p => p.email === normalizedEmail);

//       if (!participant) {
//         if (meeting.participants.length >= ENV.ROOM_CAPACITY) {
//           return res.status(403).json({ error: `Room is full (max ${ENV.ROOM_CAPACITY} participants)` });
//         }
//         meeting.participants.push({ email: normalizedEmail, role });
//         await meeting.save();
//         participant = { email: normalizedEmail, role };
//       }

//       if ((role === 'doctor' || role === 'admin') && meeting.status === 'Scheduled') {
//         meeting.status = 'Live';
//         meeting.startedAt = new Date();
//         await meeting.save();
//       }

//       const token = jwt.sign(
//         { code, email: normalizedEmail, role: participant.role },
//         ENV.MEETING_JWT_SECRET,
//         { expiresIn: '2h' }
//       );

//       const ice = this.buildIceServers();
//       const sig = this.getSignalingUrl(req);
//       console.log('[INFO] ICE servers', ice.map(s => s.urls));
//       console.log('[INFO] Signaling URL (auto):', sig);

//       res.json({
//         ok: true,
//         token,
//         iceServers: ice,
//         signalingUrl: sig,
//         role: participant.role,
//         meeting: {
//           code: meeting.code,
//           status: meeting.status,
//           participants: meeting.participants.length,
//           maxParticipants: ENV.ROOM_CAPACITY,
//           expiresAt: meeting.expiresAt,
//         },
//       });
//     } catch (e) {
//       console.error('Verify meeting error:', e);
//       res.status(400).json({ error: e.message });
//     }
//   }

//   async endMeeting(req, res) {
//     try {
//       const { code } = req.body;
//       const meeting = await Meeting.findOne({ code });
//       if (!meeting) return res.status(404).json({ error: 'Meeting not found' });

//       meeting.status = 'Ended';
//       meeting.endedAt = new Date();
//       await meeting.save();

//       const room = this.rooms.get(code);
//       if (room) {
//         this.broadcastToRoom(room, { type: 'room:ended', timestamp: new Date().toISOString() });
//         for (const [, ws] of room.entries()) { try { ws.close(1000, 'Meeting ended'); } catch {} }
//         this.rooms.delete(code);
//       }

//       res.json({ ok: true, endedAt: meeting.endedAt });
//     } catch (e) {
//       console.error('End meeting error:', e);
//       res.status(400).json({ error: e.message });
//     }
//   }

//   async getMeetingInfo(req, res) {
//     try {
//       const { code } = req.params;
//       const meeting = await Meeting.findOne({ code });
//       if (!meeting) return res.status(404).json({ error: 'Meeting not found' });

//       const room = this.rooms.get(code);
//       const onlineParticipants = room ? Array.from(room.keys()) : [];

//       res.json({
//         ok: true,
//         code: meeting.code,
//         status: meeting.status,
//         participants: meeting.participants,
//         onlineCount: onlineParticipants.length,
//         onlineParticipants,
//         maxParticipants: ENV.ROOM_CAPACITY,
//         createdAt: meeting.createdAt,
//         startedAt: meeting.startedAt,
//         expiresAt: meeting.expiresAt,
//       });
//     } catch (e) {
//       console.error('Get meeting info error:', e);
//       res.status(400).json({ error: e.message });
//     }
//   }

//   // ───────────────────────────────────────────────────────────────────────────
//   // WebSocket
//   // ───────────────────────────────────────────────────────────────────────────
//   setupWebSocket() {
//     this.httpServer.on('upgrade', (req, socket, head) => {
//       console.log('[WS] HTTP upgrade attempt', { url: req.url, h: req.headers.host });
//       if (!req.url?.startsWith('/ws')) { socket.destroy(); return; }
//       this.wss.handleUpgrade(req, socket, head, (ws) => this.wss.emit('connection', ws, req));
//     });

//     this.wss.on('connection', (ws, req) => {
//       console.log('[WS] Client connected', { ip: req.socket.remoteAddress });
//       this.handleWebSocketConnection(ws);
//     });

//     // Heartbeat
//     setInterval(() => {
//       this.wss.clients.forEach((ws) => {
//         if (!ws.isAlive) { try { ws.terminate(); } catch {} return; }
//         ws.isAlive = false;
//         try { ws.ping(); } catch { try { ws.terminate(); } catch {} }
//       });
//     }, 30000);
//   }

//   handleWebSocketConnection(ws) {
//     ws.isAlive = true;

//     const authTimeout = setTimeout(() => {
//       if (!ws._authed) { try { ws.close(4001, 'Authentication timeout'); } catch {} }
//     }, 30000);

//     ws.on('pong', () => { ws.isAlive = true; });

//     ws.on('message', async (buf) => {
//       let message;
//       try { message = JSON.parse(buf.toString()); }
//       catch { ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' })); return; }

//       if (!ws._authed) {
//         if (message.type === 'auth' && message.token) {
//           await this.handleAuthentication(ws, message.token);
//         }
//         return;
//       }

//       const { code, email } = ws;
//       const room = this.rooms.get(code);
//       if (!room) { ws.close(4003, 'Room not found'); return; }

//       switch (message.type) {
//         case 'room:who': this.sendRoomRoster(ws, room); break;
//         case 'rtc:offer':
//         case 'rtc:answer':
//         case 'rtc:candidate':
//           this.relayWebRTCMessage(room, message, email); break;
//         case 'chat':
//           this.broadcastToRoom(room, {
//             type: 'chat',
//             from: email,
//             text: String(message.text || '').slice(0, 5000),
//             timestamp: new Date().toISOString(),
//           }, email);
//           break;
//         case 'ping': ws.send(JSON.stringify({ type: 'pong' })); break;
//         default: break;
//       }
//     });

//     ws.on('close', (code, reasonBuf) => {
//       const reason = reasonBuf ? reasonBuf.toString() : '';
//       console.log('[WS] Closed', { code, reason });
//       clearTimeout(authTimeout);
//       this.handleWebSocketDisconnect(ws);
//     });

//     ws.on('error', (err) => {
//       console.error('[WS] Error', err?.message || err);
//       clearTimeout(authTimeout);
//       this.handleWebSocketDisconnect(ws);
//     });
//   }

//   async handleAuthentication(ws, token) {
//     try {
//       const { code, email, role } = jwt.verify(token, ENV.MEETING_JWT_SECRET);
//       console.log('[AUTH] JWT OK', { code, email, role });

//       const meeting = await Meeting.findOne({ code });
//       if (!meeting) throw new Error('Meeting not found');
//       if (meeting.status === 'Ended') throw new Error('Meeting has ended');

//       let participant = meeting.participants.find(p => p.email === email && p.role === role);
//       if (!participant) {
//         if (meeting.participants.length >= ENV.ROOM_CAPACITY) throw new Error(`Room is full (max ${ENV.ROOM_CAPACITY} participants)`);
//         meeting.participants.push({ email, role });
//         await meeting.save();
//       }

//       this.joinRoom(code, email, role, ws);

//       ws.send(JSON.stringify({ type: 'auth-ok', user: { email, role, code } }));

//       const room = this.rooms.get(code);
//       this.broadcastToRoom(room, { type: 'room:join', email, role, timestamp: new Date().toISOString() }, email);
//       console.log('[WS] Auth completed & join broadcasted', { code, email });
//     } catch (e) {
//       ws.send(JSON.stringify({ type: 'auth-error', message: e.message }));
//       try { ws.close(4002, 'Authentication failed'); } catch {}
//     }
//   }

//   joinRoom(code, email, role, ws) {
//     if (!this.rooms.has(code)) this.rooms.set(code, new Map());
//     const room = this.rooms.get(code);

//     const old = room.get(email);
//     if (old && old !== ws) {
//       console.log('[WS] Replacing old socket for', email);
//       try { old.close(4000, 'Reconnected'); } catch {}
//     }

//     room.set(email, ws);
//     ws._authed = true;
//     ws.code = code;
//     ws.email = email;
//     ws.role = role;
//     ws.joinedAt = new Date();

//     console.log('[WS] Joined room', { code, email, size: room.size });
//   }

//   handleWebSocketDisconnect(ws) {
//     if (!ws._authed) return;
//     const { code, email } = ws;
//     const room = this.rooms.get(code);
//     if (!room) return;

//     const current = room.get(email);
//     let removed = false;
//     if (current === ws) {
//       room.delete(email);
//       removed = true;
//       console.log('[WS] Removed from room', { code, email, size: room.size });
//     }

//     if (removed) {
//       this.broadcastToRoom(room, { type: 'room:leave', email, timestamp: new Date().toISOString() });
//     }

//     if (room.size === 0) {
//       this.rooms.delete(code);
//       console.log('[WS] Deleted empty room', { code });
//     }
//   }

//   sendRoomRoster(ws, room) {
//     const roster = Array.from(room.entries()).map(([email, peer]) => ({
//       email,
//       role: peer.role,
//       online: peer.readyState === 1,
//       joinedAt: peer.joinedAt,
//     }));
//     console.log('[WS] → roster sent', { count: roster.length });
//     ws.send(JSON.stringify({ type: 'room:roster', roster }));
//   }

//   relayWebRTCMessage(room, message, fromEmail) {
//     const to = String(message.toEmail || '').toLowerCase();
//     const target = room.get(to);
//     if (target && target.readyState === 1) {
//       target.send(JSON.stringify({ ...message, fromEmail, fromRole: room.get(fromEmail)?.role }));
//     }
//   }

//   broadcastToRoom(room, payload, exceptEmail = null) {
//     let sent = 0;
//     for (const [email, peer] of room.entries()) {
//       if (exceptEmail && email === exceptEmail) continue;
//       if (peer.readyState !== 1) continue;
//       try { peer.send(JSON.stringify(payload)); sent++; } catch {}
//     }
//     if (payload?.type) console.log('[WS] Broadcast', { type: payload.type, sent });
//   }

//   // ───────────────────────────────────────────────────────────────────────────
//   // Utils
//   // ───────────────────────────────────────────────────────────────────────────
//   normalizeEmail(email) { return String(email || '').trim().toLowerCase(); }

//   async generateUniqueCode() {
//     for (let i = 0; i < 20; i++) {
//       const code = String(Math.floor(100000 + Math.random() * 900000));
//       const exists = await Meeting.exists({ code });
//       if (!exists) return code;
//     }
//     throw new Error('Could not generate unique meeting code');
//   }

//   buildIceServers() {
//     const servers = [
//       { urls: 'stun:stun.l.google.com:19302' },
//       { urls: 'stun:stun1.l.google.com:19302' },
//     ];
//     if (ENV.TURN_URL && ENV.TURN_USER && ENV.TURN_PASS) {
//       servers.push({ urls: ENV.TURN_URL, username: ENV.TURN_USER, credential: ENV.TURN_PASS });
//     }
//     return servers;
//   }

//   getBaseUrl(req) {
//     if (ENV.FRONTEND_URL) return ENV.FRONTEND_URL.replace(/\/$/, '');
//     const proto = req.get('x-forwarded-proto') || (req.secure ? 'https' : 'http');
//     const host  = req.get('x-forwarded-host') || req.get('host');
//     return `${proto}://${host}`;
//   }

//   getSignalingUrl(req) {
//     if (ENV.SIGNALING_URL) {
//       try {
//         const u = new URL(ENV.SIGNALING_URL);
//         if (u.protocol === 'http:') u.protocol = 'ws:';
//         if (u.protocol === 'https:') u.protocol = 'wss:';
//         if (!u.pathname || u.pathname === '/') u.pathname = '/ws';
//         return u.toString();
//       } catch {}
//     }
//     const xfProto = (req.get('x-forwarded-proto') || '').toLowerCase();
//     const isHttps = xfProto.includes('https') || !!req.secure;
//     const host = req.get('x-forwarded-host') || req.get('host');
//     return `${isHttps ? 'wss' : 'ws'}://${host}/ws`;
//   }

//   startCleanupInterval() {
//     setInterval(async () => {
//       try {
//         const now = new Date();
//         const expired = await Meeting.find({ status: 'Live', expiresAt: { $lt: now } });
//         for (const m of expired) {
//           m.status = 'Ended'; m.endedAt = new Date(); await m.save();
//           const room = this.rooms.get(m.code);
//           if (room) {
//             this.broadcastToRoom(room, {
//               type: 'room:ended', reason: 'Meeting time expired', timestamp: new Date().toISOString(),
//             });
//             for (const [, ws] of room.entries()) { try { ws.close(1000, 'Meeting expired'); } catch {} }
//             this.rooms.delete(m.code);
//           }
//         }
//         for (const [code, room] of this.rooms.entries()) {
//           if (room.size === 0) this.rooms.delete(code);
//         }
//       } catch (err) { console.error('Cleanup error:', err); }
//     }, 60_000);
//   }

//   start(port = ENV.PORT) {
//     this.httpServer.listen(port, () => {
//       console.log('[INFO] 🎯 Professional Meeting Server Started');
//       console.log('[INFO] 📍 Port:', port);
//       console.log('[INFO] 🌐 Frontend:', ENV.FRONTEND_URL || '(auto)');
//       console.log('[INFO] 📡 Signaling:', ENV.SIGNALING_URL || '(auto via /ws)');
//       console.log('[INFO] 👥 Capacity:', ENV.ROOM_CAPACITY, 'participants');
//       console.log('[INFO] ─────────────────────────────');
//     });
//   }
// }

// // ───────────────────────────────────────────────────────────────────────────────
// // Boot
// // ───────────────────────────────────────────────────────────────────────────────
// const server = new ProfessionalMeetingServer();
// server.start();

// process.on('SIGTERM', () => { console.log('SIGTERM, shutting down…'); server.httpServer.close(() => process.exit(0)); });
// process.on('SIGINT',  () => { console.log('SIGINT, shutting down…');  server.httpServer.close(() => process.exit(0)); });

// export default server;
import http from 'http';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import helmet from 'helmet';
import { WebSocketServer } from 'ws';

dotenv.config();

/* ---------------------------- ENV + Defaults ---------------------------- */
const ENV = {
  PORT: Number(process.env.PORT || 5080),
  MONGODB_URI: process.env.MONGODB_URI || '',
  MEETING_JWT_SECRET: process.env.MEETING_JWT_SECRET || '',
  FRONTEND_URL: process.env.FRONTEND_URL || '',       // e.g. http://localhost:3000
  SIGNALING_URL: process.env.SIGNALING_URL || '',     // e.g. wss://meet.example.com/ws
  TURN_URL: process.env.TURN_URL || '',               // e.g. turn:turn.example.com:3478 or turns:...:5349
  TURN_USER: process.env.TURN_USER || '',
  TURN_PASS: process.env.TURN_PASS || '',
  CORS_ORIGINS: process.env.CORS_ORIGINS || '',       // comma-separated origins
  ROOM_CAPACITY: Number(process.env.ROOM_CAPACITY || 100),
  MEETING_DURATION: Number(process.env.MEETING_DURATION || 7200),
};

if (!ENV.MONGODB_URI) { console.error('[ERR] Missing MONGODB_URI'); process.exit(1); }
if (!ENV.MEETING_JWT_SECRET) { console.error('[ERR] Missing MEETING_JWT_SECRET'); process.exit(1); }

/* --------------------------------- DB ---------------------------------- */
const meetingSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, index: true },
  appointmentId: { type: String, index: true },
  participants: [{
    email: { type: String, required: true },
    role: { type: String, enum: ['patient', 'doctor', 'admin'], required: true },
  }],
  status: { type: String, enum: ['Scheduled', 'Live', 'Ended'], default: 'Scheduled' },
  duration: { type: Number, default: ENV.MEETING_DURATION },
  expiresAt: { type: Date },
  startedAt: { type: Date },
  endedAt: { type: Date },
}, { timestamps: true });

meetingSchema.index({ expiresAt: 1 });
meetingSchema.index({ status: 1 });
meetingSchema.index({ 'participants.email': 1 });

const Meeting = mongoose.model('Meeting', meetingSchema);

/* --------------------------- Server + Signaling ------------------------- */
class MeetingServer {
  constructor() {
    this.app = express();
    this.httpServer = http.createServer(this.app);
    this.wss = new WebSocketServer({ noServer: true, clientTracking: true });

    /** Map<code, Map<email, ws>> */
    this.rooms = new Map();

    this.init();
  }

  async init() {
    await this.connectDB();
    this.middleware();
    this.routes();
    this.ws();
    this.cleanupLoop();
  }

  async connectDB() {
    await mongoose.connect(ENV.MONGODB_URI);
    await Meeting.createIndexes();
    this.log('✅ MongoDB connected');
  }

  middleware() {
    this.app.use(helmet({ crossOriginEmbedderPolicy: false, contentSecurityPolicy: false }));

    // CORS - Allow ALL origins (no restrictions)
    this.app.use(cors({
      origin: true, // Allow all origins
      credentials: true,
    }));

    this.app.use(express.json({ limit: '100mb' })); // Increased limit
    this.app.use(express.urlencoded({ extended: true, limit: '100mb' }));
  }

  routes() {
    this.app.get('/health', (req, res) => {
      res.json({
        ok: true,
        rooms: this.rooms.size,
        connections: this.wss.clients.size,
        ts: new Date().toISOString(),
      });
    });

    this.app.post('/api/meetings/create', this.createMeeting.bind(this));
    this.app.post('/api/meetings/verify', this.verifyMeeting.bind(this));
    this.app.post('/api/meetings/end', this.endMeeting.bind(this));
    this.app.get('/api/meetings/:code', this.getMeetingInfo.bind(this));
  }

  /* ----------------------------- REST: Core ---------------------------- */

  async createMeeting(req, res) {
    try {
      const { appointmentId, patientEmail, doctorEmail, duration } = req.body;
      if (!patientEmail || !doctorEmail) return res.status(400).json({ error: 'patientEmail and doctorEmail are required' });

      const code = await this.uniqueCode();
      const participants = [
        { email: this.ne(patientEmail), role: 'patient' },
        { email: this.ne(doctorEmail), role: 'doctor' },
      ];
      if (ENV.ADMIN_EMAIL) participants.push({ email: this.ne(ENV.ADMIN_EMAIL), role: 'admin' });

      const dur = Number(duration || ENV.MEETING_DURATION);
      const expiresAt = new Date(Date.now() + dur * 1000);

      const meeting = await Meeting.create({ code, appointmentId, participants, duration: dur, expiresAt });

      const base = this.baseUrl(req);
      res.json({
        ok: true,
        code,
        meetingId: meeting._id,
        expiresAt,
        maxParticipants: ENV.ROOM_CAPACITY,
        urls: {
          patient: `${base}/meeting/${code}?role=patient&email=${encodeURIComponent(this.ne(patientEmail))}`,
          doctor: `${base}/meeting/${code}?role=doctor&email=${encodeURIComponent(this.ne(doctorEmail))}`,
          admin: ENV.ADMIN_EMAIL ? `${base}/meeting/${code}?role=admin&email=${encodeURIComponent(this.ne(ENV.ADMIN_EMAIL))}` : null,
        },
      });
    } catch (e) {
      this.log('[create] error:', e.message);
      res.status(400).json({ error: e.message });
    }
  }

  async verifyMeeting(req, res) {
    try {
      const { code, email, role } = req.body;
      if (!code || !email || !role) return res.status(400).json({ error: 'code, email, role required' });

      const meeting = await Meeting.findOne({ code });
      if (!meeting) return res.status(404).json({ error: 'Meeting not found' });
      // STRICT SECURITY: Only pre-authorized participants can join
      const norm = this.ne(email);
      const participant = meeting.participants.find(x => x.email === norm && x.role === role);
      
      if (!participant) {
        this.log('[verify] UNAUTHORIZED ACCESS DENIED:', { code, email: norm, role });
        return res.status(403).json({ 
          ok: false, 
          error: 'Access denied: You are not authorized to join this meeting.',
          message: 'Only invited participants can join. Please check your email and role.'
        });
      }

      this.log('[verify] AUTHORIZED ACCESS:', { code, email: norm, role });

      // Automatically set meeting to Live when authorized user joins
      if (meeting.status === 'Scheduled') {
        meeting.status = 'Live';
        meeting.startedAt = new Date();
        await meeting.save();
      }

      const token = jwt.sign({ code, email: norm, role: participant.role }, ENV.MEETING_JWT_SECRET, { expiresIn: '24h' });
      const signalingUrl = this.signalingUrl(req);

      this.log('[verify] AUTHORIZED USER', { code, email: norm, role: participant.role, signalingUrl });

      res.json({
        ok: true,
        token,
        role: participant.role,
        signalingUrl,
        iceServers: this.iceServers(),
        meeting: {
          code: meeting.code,
          status: meeting.status,
          participants: meeting.participants.length,
          authorizedOnly: true, // Strict security enabled
          expiresAt: meeting.expiresAt,
        },
      });
    } catch (e) {
      this.log('[verify] ERROR:', e.message);
      return res.status(500).json({ 
        ok: false, 
        error: 'Meeting verification failed',
        message: e.message 
      });
    }
  }

  async endMeeting(req, res) {
    try {
      const { code } = req.body;
      const meeting = await Meeting.findOne({ code });
      if (!meeting) return res.status(404).json({ error: 'Meeting not found' });

      meeting.status = 'Ended';
      meeting.endedAt = new Date();
      await meeting.save();

      const room = this.rooms.get(code);
      if (room) {
        this.broadcast(room, { type: 'room:ended', ts: Date.now() });
        for (const [, ws] of room.entries()) { try { ws.close(1000, 'Meeting ended'); } catch {} }
        this.rooms.delete(code);
      }

      res.json({ ok: true, endedAt: meeting.endedAt });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  }

  async getMeetingInfo(req, res) {
    try {
      const { code } = req.params;
      const m = await Meeting.findOne({ code });
      if (!m) return res.status(404).json({ error: 'Meeting not found' });
      const room = this.rooms.get(code);
      res.json({
        ok: true,
        code: m.code,
        status: m.status,
        participants: m.participants,
        onlineCount: room ? room.size : 0,
        onlineParticipants: room ? Array.from(room.keys()) : [],
        maxParticipants: ENV.ROOM_CAPACITY,
        createdAt: m.createdAt,
        startedAt: m.startedAt,
        expiresAt: m.expiresAt,
      });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  }

  /* ------------------------------- WS Core ------------------------------ */

  ws() {
    // HTTP -> WS upgrade at /ws
    this.httpServer.on('upgrade', (req, socket, head) => {
      if (!req.url?.startsWith('/ws')) return socket.destroy();
      this.wss.handleUpgrade(req, socket, head, (ws) => this.wss.emit('connection', ws, req));
    });

    this.wss.on('connection', (ws, req) => this.wsConn(ws, req));

    // Heartbeat
    setInterval(() => {
      for (const ws of this.wss.clients) {
        if (!ws.isAlive) { try { ws.terminate(); } catch {} continue; }
        ws.isAlive = false;
        try { ws.ping(); } catch {}
      }
    }, 30000);
  }

  wsConn(ws, req) {
    ws.isAlive = true;
    const ip = req.socket?.remoteAddress || 'unknown';
    this.log('[ws] connect - NO RESTRICTIONS', ip);

    // REMOVED: Auth timeout - allow unlimited time to authenticate
    const authTimeout = null;

    ws.on('pong', () => { ws.isAlive = true; });

    ws.on('message', async (raw) => {
      let msg;
      try { msg = JSON.parse(raw.toString()); } catch { return; }
      if (!ws._authed) {
        if (msg.type === 'auth' && msg.token) await this.wsAuth(ws, msg.token);
        return;
      }
      await this.wsMsg(ws, msg);
    });

    ws.on('close', () => {
      if (authTimeout) clearTimeout(authTimeout);
      this.wsLeave(ws);
    });

    ws.on('error', () => {
      if (authTimeout) clearTimeout(authTimeout);
      this.wsLeave(ws);
    });
  }

  async wsAuth(ws, token) {
    try {
      // Verify token
      const { code, email, role } = jwt.verify(token, ENV.MEETING_JWT_SECRET);
      
      // STRICT: Verify meeting exists and user is authorized
      const meeting = await Meeting.findOne({ code });
      if (!meeting) {
        this.log('[wsAuth] DENIED - Meeting not found:', code);
        ws.send(JSON.stringify({ type: 'auth-error', message: 'Meeting not found' }));
        return ws.close(4001, 'Meeting not found');
      }

      // STRICT: Check if user is in participants list
      const participant = meeting.participants.find(x => x.email === email && x.role === role);
      if (!participant) {
        this.log('[wsAuth] DENIED - Unauthorized user:', { email, role, code });
        ws.send(JSON.stringify({ type: 'auth-error', message: 'Unauthorized: Not in participants list' }));
        return ws.close(4003, 'Unauthorized');
      }

      this.log('[wsAuth] AUTHORIZED:', { code, email, role });

      // Room slot
      if (!this.rooms.has(code)) this.rooms.set(code, new Map());
      const room = this.rooms.get(code);

      // Replace old socket (self-reconnect)
      const old = room.get(email);
      if (old && old !== ws) { 
        try { old.close(4000, 'Reconnected'); } catch {} 
      }

      room.set(email, ws);
      ws._authed = true;
      ws.code = code;
      ws.email = email;
      ws.role = role;
      ws.joinedAt = new Date();

      ws.send(JSON.stringify({ type: 'auth-ok', user: { code, email, role } }));
      // Notify others
      this.broadcast(room, { type: 'room:join', email, role, ts: Date.now() }, email);
    } catch (e) {
      this.log('[wsAuth] ERROR:', e.message);
      ws.send(JSON.stringify({ type: 'auth-error', message: 'Invalid token or unauthorized' }));
      try { ws.close(4002, 'Auth failed'); } catch {}
    }
  }

  async wsMsg(ws, msg) {
    const room = this.rooms.get(ws.code);
    if (!room) { try { ws.close(4003, 'Room missing'); } catch {} return; }

    switch (msg.type) {
      case 'room:who':
        ws.send(JSON.stringify({
          type: 'room:roster',
          roster: Array.from(room.entries()).map(([email, peer]) => ({
            email,
            role: peer.role,
            online: peer.readyState === 1,
            joinedAt: peer.joinedAt
          }))
        }));
        break;

      case 'rtc:offer':
      case 'rtc:answer':
      case 'rtc:candidate': {
        const to = String(msg.toEmail || '').toLowerCase();
        const peer = room.get(to);
        if (peer && peer.readyState === 1) {
          peer.send(JSON.stringify({ ...msg, fromEmail: ws.email, fromRole: ws.role }));
        }
        break;
      }

      case 'chat': {
        const text = String(msg.text || '').slice(0, 3000);
        this.broadcast(room, { type: 'chat', from: ws.email, text, ts: Date.now() }, ws.email);
        break;
      }

      case 'typing': {
        // Broadcast typing indicator to all peers
        this.broadcast(room, { 
          type: 'typing', 
          from: ws.email, 
          isTyping: !!msg.isTyping 
        }, ws.email);
        break;
      }

      case 'ping':
        ws.send(JSON.stringify({ type: 'pong' }));
        break;

      default:
        console.log('[WS] Unknown message type:', msg.type);
        break;
    }
  }

  wsLeave(ws) {
    if (!ws._authed) return;
    const room = this.rooms.get(ws.code);
    if (!room) return;
    const current = room.get(ws.email);
    if (current === ws) {
      room.delete(ws.email);
      this.broadcast(room, { type: 'room:leave', email: ws.email, ts: Date.now() });
    }
    if (room.size === 0) this.rooms.delete(ws.code);
  }

  broadcast(room, payload, exceptEmail = null) {
    for (const [email, peer] of room.entries()) {
      if (exceptEmail && email === exceptEmail) continue;
      if (peer.readyState === 1) {
        try { peer.send(JSON.stringify(payload)); } catch {}
      }
    }
  }

  /* ------------------------------- Utils -------------------------------- */

  ne(email) { return String(email || '').trim().toLowerCase(); }

  async uniqueCode() {
    for (let i = 0; i < 25; i++) {
      const code = String(Math.floor(100000 + Math.random() * 900000));
      const exists = await Meeting.exists({ code });
      if (!exists) return code;
    }
    throw new Error('Could not generate meeting code');
  }

  iceServers() {
    const servers = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ];
    if (ENV.TURN_URL && ENV.TURN_USER && ENV.TURN_PASS) {
      servers.push({ urls: ENV.TURN_URL, username: ENV.TURN_USER, credential: ENV.TURN_PASS });
    }
    return servers;
  }

  baseUrl(req) {
    if (ENV.FRONTEND_URL) return ENV.FRONTEND_URL.replace(/\/$/, '');
    const proto = req.get('x-forwarded-proto') || (req.secure ? 'https' : 'http');
    const host = req.get('x-forwarded-host') || req.get('host');
    return `${proto}://${host}`;
  }

  signalingUrl(req) {
    if (ENV.SIGNALING_URL) {
      try {
        const u = new URL(ENV.SIGNALING_URL);
        if (u.protocol === 'http:') u.protocol = 'ws:';
        if (u.protocol === 'https:') u.protocol = 'wss:';
        if (!u.pathname || u.pathname === '/') u.pathname = '/ws';
        return u.toString();
      } catch { /* fallthrough */ }
    }
    const xf = (req.get('x-forwarded-proto') || '').toLowerCase();
    const isHttps = xf.includes('https') || !!req.secure;
    const host = req.get('x-forwarded-host') || req.get('host');
    return `${isHttps ? 'wss' : 'ws'}://${host}/ws`;
  }

  cleanupLoop() {
    setInterval(async () => {
      try {
        const now = new Date();
        const expired = await Meeting.find({ status: 'Live', expiresAt: { $lt: now } });
        for (const m of expired) {
          m.status = 'Ended';
          m.endedAt = new Date();
          await m.save();

          const room = this.rooms.get(m.code);
          if (room) {
            this.broadcast(room, { type: 'room:ended', reason: 'expired', ts: Date.now() });
            for (const [, ws] of room.entries()) { try { ws.close(1000, 'Meeting expired'); } catch {} }
            this.rooms.delete(m.code);
          }
        }
      } catch (e) {
        this.log('[cleanup] error', e.message);
      }
    }, 60_000);
  }

  start() {
    this.httpServer.listen(ENV.PORT, () => {
      this.log('🎯 Professional Meeting Server Started');
      this.log('📍 Port:', ENV.PORT);
      this.log('🌐 Frontend:', ENV.FRONTEND_URL || '(auto)');
      this.log('📡 Signaling:', ENV.SIGNALING_URL || '(auto via /ws)');
      this.log('👥 Capacity:', ENV.ROOM_CAPACITY);
      this.log('─────────────────────────────');
    });
  }

  log(...args) {
    const ts = new Date().toISOString().slice(11, 19);
    console.log('[INFO]', ts, ...args);
  }
}

/* ------------------------------- Boot ---------------------------------- */
const srv = new MeetingServer();
srv.start();

process.on('SIGTERM', () => { console.log('SIGTERM'); srv.httpServer.close(() => process.exit(0)); });
process.on('SIGINT', () => { console.log('SIGINT'); srv.httpServer.close(() => process.exit(0)); });

export default srv;
