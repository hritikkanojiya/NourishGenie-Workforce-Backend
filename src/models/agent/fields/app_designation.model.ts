import mongoose from 'mongoose';

const appDesignationSchema = new mongoose.Schema(
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

const appUserDesignationModel = mongoose.model('app_designation', appDesignationSchema);

export {
  appUserDesignationModel
}