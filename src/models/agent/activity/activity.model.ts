import mongoose from 'mongoose';
const userActivitySchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true
    },
    activities: {
      type: [{
        activity: {
          type: String,
          enum: ['checkin', 'checkout', 'breakin', 'breakout'],
        },
        time: {
          type: String
        }
      }],
      required: true,
    }
  },
  {
    timestamps: true
  }
);


const appUserAcitivityModel = mongoose.model('app_agent_activities', userActivitySchema);

export { appUserAcitivityModel }


