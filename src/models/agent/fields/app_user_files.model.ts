import mongoose from 'mongoose';

const AppUserFilesSchema = new mongoose.Schema(
  {
    //foreign key
    appUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AppUserSchema'
    },
    profile_picture: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AppAttatchments'
    },
    aadhar_card_number: {
      type: String,
      required: [true, 'must provide a aadhar card number'],
      trim: true
    },
    aadhar_card_file: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AppAttatchments'
    },
    pan_card_number: {
      type: String,
      required: [true, 'must provide a pan card number']
    },
    pan_card_file: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AppAttatchments'
    },
    documents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AppAttatchments'
      }
    ]
  },
  {
    timestamps: true
  }
);

export default mongoose.model('app_agent_files', AppUserFilesSchema);
