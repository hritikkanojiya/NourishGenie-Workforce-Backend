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

const appServiceRouteModel = mongoose.model('app_service_routes', AppServiceRouteSchema);

export {
  appServiceRouteModel
}