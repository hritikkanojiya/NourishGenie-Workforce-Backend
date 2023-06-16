import mongoose from 'mongoose';

const appAgentAddressSchema = new mongoose.Schema(
  {
    //foreign key
    appAgentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'appAgentSchema'
    },
    country: {
      type: String,
      required: [true, 'must provide a country'],
      trim: true
    },
    state: {
      type: String,
      required: [true, 'must provide a state'],
      trim: true
    },
    city: {
      type: String,
      required: [true, 'must provide a city'],
      trim: true
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
      default: false,
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('app_agent_address', appAgentAddressSchema);
