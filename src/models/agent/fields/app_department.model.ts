import mongoose from 'mongoose';

const appDepartmentSchema = new mongoose.Schema(
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

const appUserDepartmentModel = mongoose.model('app_department', appDepartmentSchema);

export {
  appUserDepartmentModel
}