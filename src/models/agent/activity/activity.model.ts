import moment from 'moment';
import 'moment-timezone';
import mongoose from 'mongoose';
const userActivitySchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  fullname: {
    type: String,
    required: true
  },
  activities: {
    type: [{
      activity: {
        type: String,
        enum: ['checkin', 'checkout','breakin','breakout'],
      },
      time: {
        type: String,
      }
    }],
    required: true,
  },
  date: {
    type: String,
    default: moment().tz('Asia/Kolkata').format('YYYY-MM-DD'),
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});


export default mongoose.model('userActivity', userActivitySchema);


