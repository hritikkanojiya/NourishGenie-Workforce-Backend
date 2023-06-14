import mongoose from 'mongoose';

const AppUserContactsSchema = new mongoose.Schema(
  {
    //foreign key
    appUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AppUserSchema'
    },
    number: {
      type: Number,
      required: [true, 'must provide a mobile number'],
      trim: true
    },
    relation: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('app_agent_contacts', AppUserContactsSchema);
