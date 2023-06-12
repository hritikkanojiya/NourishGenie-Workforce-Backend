import mongoose from 'mongoose';

const AppReportingManagerSchema = new mongoose.Schema(
  {
    //foreign key
    appUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AppUser'
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('app_reporting_managers', AppReportingManagerSchema);
