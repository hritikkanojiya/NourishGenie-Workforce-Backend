// Import Packages
import mongoose from 'mongoose';

const parametersSchema = new mongoose.Schema({
  parameterName: {
    type: String,
    required: true,
  },
  required: {
    type: Boolean,
    required: true,
  },
});

// Design Schema
const appSmartFunctionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    parameters: {
      type: [parametersSchema],
      required: true,
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
const appSmartFunctionModel = mongoose.model(
  'app_smart_function',
  appSmartFunctionSchema
);
export { appSmartFunctionModel };
