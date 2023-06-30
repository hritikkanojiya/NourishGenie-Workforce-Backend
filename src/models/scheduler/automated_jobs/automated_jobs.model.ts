// Import Packages
import mongoose from 'mongoose';

// Design Schema
const appAutomatedJobsSchema = new mongoose.Schema(
  {
    appCronExpressionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'appCronExpressionModel',
      required: true,
    },
    appSmartFunctionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'appSmartFunctionModel',
      required: true,
    },
    parameters: {
      type: Object,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const appAutomatedJobLogsSchema = new mongoose.Schema(
  {
    appAutomatedJobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'appAutomatedJobsModel',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'CREATE',
        'UPDATE',
        'DELETE',
        'SCHEDULE',
        'EXECUTE',
        'FORCE-EXECUTE',
        'COMPLETE',
        'CANCEL',
        'TOGGLE',
        'ERROR',
      ],
      required: true,
    },
    description: {
      type: String,
      default: null,
    },
    scriptPath: {
      type: String,
      default: null,
    },
    methodName: {
      type: String,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Define Mongoose Model
const appAutomatedJobsModel = mongoose.model(
  'app_automated_job',
  appAutomatedJobsSchema
);

const appAutomatedJobLogsModel = mongoose.model(
  'app_automated_job_log',
  appAutomatedJobLogsSchema
);

export { appAutomatedJobsModel, appAutomatedJobLogsModel };
