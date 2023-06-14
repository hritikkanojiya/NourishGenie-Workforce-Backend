import mongoose from 'mongoose';

const AppDesignationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'must provide a name'],
      trim: true,
      maxLength: [100, 'name cannot be more than 30 characters']
    },
    description: {
      type: String,
      required: [true, 'must provide a description'],
      trim: true,
      maxLength: [100, 'description cannot be more than 30 characters']
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

export default mongoose.model('app_designations', AppDesignationSchema);
