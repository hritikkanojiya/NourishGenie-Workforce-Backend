import mongoose from 'mongoose';

const appAccessGroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'must provide a name'],
    trim: true,
    maxLength: [30, 'name cannot be more than 30 characters']
  },
  description: {
    type: String,
    required: [true, 'must provide a description'],
    trim: true,
    maxLength: [100, 'description cannot be more than 30 characters']
  },
  isAdministrator: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
});

const appAccessGroupModel = mongoose.model('app_access_group', appAccessGroupSchema);

export {
  appAccessGroupModel
}
