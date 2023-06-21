import mongoose from 'mongoose';

const AppUserContactsSchema = new mongoose.Schema(
  {
    //foreign key
    appAgentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'appUserSchema'
    },
    number: {
      type: String,
      required: [true, 'must provide a mobile number'],
      trim: true
    },
    relation: {
      type: String
    },
    isDeleted: {
      type: Boolean,
      default: false,
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('app_agent_contact', AppUserContactsSchema);
