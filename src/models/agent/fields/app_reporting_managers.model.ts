import mongoose from 'mongoose';

const appReportingManagerSchema = new mongoose.Schema(
  {
    //foreign key
    appUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'app_agents',
      required: true
    },
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

const appReportingManagerModel = mongoose.model('app_reporting_manager', appReportingManagerSchema);

export {
  appReportingManagerModel
}
