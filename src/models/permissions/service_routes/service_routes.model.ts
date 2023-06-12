import mongoose from 'mongoose';

const AppServiceRouteSchema = new mongoose.Schema(
  {
    //foreign key

    appAccessGroupIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'app_access_groups'
      }
    ],
    method: {
      type: String,
      required: [true, 'must provide a method'],
      trim: true
    },
    type: {
      type: String,
      required: [true, 'must provide a type'],
      trim: true
    },
    path: {
      type: String,
      required: [true, 'must provide a path'],
      trim: true
    },
    secure: {
      type: Boolean,
      required: [true, 'must provide a secure'],
      trim: true
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

export default mongoose.model('app_service_routes', AppServiceRouteSchema);
