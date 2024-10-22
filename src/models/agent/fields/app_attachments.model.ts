import mongoose from 'mongoose';

const appAttachmentsSchema = new mongoose.Schema(
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

const appUserAttachmentModel = mongoose.model('app_attachment', appAttachmentsSchema);

export {
  appUserAttachmentModel
}