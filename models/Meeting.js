// models/Meeting.js
import mongoose from 'mongoose';

const ParticipantSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true },
  role: { type: String, enum: ['patient', 'doctor', 'admin'], required: true },
}, { _id: false });

const MeetingSchema = new mongoose.Schema({
  code: { type: String, required: true }, // "6-digit"
  appointmentId: { type: String },        // optional string ref to your Next API's appointment _id
  participants: { type: [ParticipantSchema], default: [] },
  status: { type: String, enum: ['Scheduled', 'Live', 'Ended'], default: 'Scheduled' },
}, { timestamps: true });

export default mongoose.models.Meeting || mongoose.model('Meeting', MeetingSchema);
