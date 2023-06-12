import mongoose from 'mongoose';

const AppRoleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'must provide a name'],
    trim: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
});

export default mongoose.model('app_agent_roles', AppRoleSchema);
