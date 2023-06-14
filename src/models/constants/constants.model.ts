import { Schema, model } from 'mongoose';

const appConstantsSchema = new Schema(
  {
    name: {
      type: String,
      required: true
    },
    value: {
      type: Schema.Types.Mixed,
      required: true
    },
    isAutoLoad: {
      type: Boolean,
      default: false
    },
    isDeleted: {
      type: Boolean,
      required: true,
      default: false
    }
  },
  {
    timestamps: true
  }
);

const appConstantsModel = model('app_constant', appConstantsSchema);

export { appConstantsModel };
