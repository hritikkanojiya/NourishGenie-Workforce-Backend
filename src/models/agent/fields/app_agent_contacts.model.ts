import mongoose from 'mongoose';

const appUserContactsSchema = new mongoose.Schema(
  {
    //foreign key
    appUserId: {
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

const appUserContactsModel = mongoose.model('app_agent_contact', appUserContactsSchema);

export {
  appUserContactsModel
}