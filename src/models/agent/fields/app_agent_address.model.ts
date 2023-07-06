import mongoose from 'mongoose';

const appUserAddressSchema = new mongoose.Schema(
  {
    //foreign key
    appUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'app_agent'
    },
    country: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'app_countries',
      required: [true, 'must provide a country']
    },
    state: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'app_states',
      required: [true, 'must provide a state']
    },
    city: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'app_cities',
      required: [true, 'must provide a city']
    },
    address: {
      type: String,
      required: [true, 'must provide a address'],
      trim: true
    },
    pincode: {
      type: Number,
      required: [true, 'must provide a pincode'],
      trim: true
    },
    landmark: {
      type: String,
      required: [true, 'must provide a landmark'],
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

const appUserAddressModel = mongoose.model('app_agent_address', appUserAddressSchema);

export {
  appUserAddressModel
}