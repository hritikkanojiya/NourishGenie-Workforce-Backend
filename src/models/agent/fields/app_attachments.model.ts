import mongoose from 'mongoose';

const AppAttatchmentsSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'must provide a name'],
      trim: true
    },
    type: {
      type: String,
      required: [true, 'must provide a type'],
      trim: true
    },
    extension: {
      type: String,
      required: [true, 'must provide a extension'],
      trim: true
    },
    uploadedBy: {
      type: mongoose.Types.ObjectId,
      required: [true, 'must provide a uploadedBy'],
      trim: true
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    original_name: {
      type: String,
      required: [true, 'must provide a original_name']
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('app_attachments', AppAttatchmentsSchema);
