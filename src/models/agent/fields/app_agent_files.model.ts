import mongoose from 'mongoose';

const appAgentFilesSchema = new mongoose.Schema(
  {
    //foreign key
    appAgentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'appAgentSchema'
    },
    profile_picture: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      ref: 'app_attachment'
    },
    aadhar_card_number: {
      type: String,
      // required: [true, 'must provide a aadhar card number'],
      // trim: true
    },
    aadhar_card_file: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      ref: 'app_attachment'
    },
    pan_card_number: {
      type: String,
      // required: [true, 'must provide a pan card number']
    },
    pan_card_file: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      ref: 'app_attachment'
    },
    otherFiles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'app_attachment'
      }
    ],
    isDeleted: {
      type: Boolean,
      require: true,
      default: false
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('app_agent_file', appAgentFilesSchema);
