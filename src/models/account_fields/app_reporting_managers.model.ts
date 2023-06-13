import mongoose from 'mongoose';

const AppReportingManagerSchema = new mongoose.Schema(
  {
    //foreign key
    appAgentId: {
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

export default mongoose.model('app_reporting_manager', AppReportingManagerSchema);
