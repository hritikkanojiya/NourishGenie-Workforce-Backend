// Import Packages
import mongoose from 'mongoose';

// Design Schema
const appCronExpressionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    expression: {
      type: String,
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Define Mongoose Model
const appCronExpressionModel = mongoose.model(
  'app_cron_expression',
  appCronExpressionSchema
);

export {
  appCronExpressionModel,
};
