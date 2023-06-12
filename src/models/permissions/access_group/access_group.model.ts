import mongoose from 'mongoose';

const AppAccessGroupSchema = new mongoose.Schema({
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

export default mongoose.model('app_access_groups', AppAccessGroupSchema);
