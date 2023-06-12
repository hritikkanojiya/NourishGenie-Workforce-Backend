import mongoose from 'mongoose';

const appMenuSchema = new mongoose.Schema(
  {
    //foreign key
    appAccessGroupIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'app_access_groups'
    },
    name: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    hasSubMenus: {
      type: Boolean,
      required: true
    },
    url: {
      type: String
    },
    sequenceNumber: {
      type: Number,
      required: true
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

const appSubMenuSchema = new mongoose.Schema(
  {
    appMenuId: {
      type: mongoose.Types.ObjectId,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    sequenceNumber: {
      type: Number,
      required: true
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

const appMenuModel = mongoose.model('app_menu', appMenuSchema);
const appSubMenuModel = mongoose.model('app_sub_menu', appSubMenuSchema);

export { appMenuModel, appSubMenuModel };
