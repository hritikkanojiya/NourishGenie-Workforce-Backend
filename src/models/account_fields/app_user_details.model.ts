import mongoose from 'mongoose';

const AppUserDetailsSchema = new mongoose.Schema(
  {
    //foreign key
    appUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AppUserSchema'
    },
    primary_email: {
      type: String,
      required: [true, 'must provide a primary email'],
      trim: true,
      unique: true
    },
    company_email: {
      type: String,
      required: [true, 'must provide a company email'],
      trim: true,
      unique: true,
      default: null
    },
    gender: {
      type: String,
      required: [true, 'must provide a gender'],
      enum: ['Male', 'Female', 'Others'],
      trim: true
    },
    contact_number: {
      type: Number,
      required: [true, 'must provide a contact number'],
      trim: true
    },
    date_of_birth: {
      type: Date,
      required: [true, 'must provide a date of birth'],
      trim: true
    },
    date_of_joining: {
      type: Date,
      required: [true, 'must provide a date of joining'],
      trim: true
    },
    working_hours: {
      type: String,
      required: [true, 'must provide a working hours'],
      trim: true,
      enum: ['4-5 hrs', '5-6 hrs', '6-7 hrs', '8-9 hrs']
    },
    salary: {
      type: Number,
      required: [true, 'must provide a salary'],
      trim: true
    },
    marital_status: {
      type: String,
      required: [true, 'must provide a marital status'],
      trim: true,
      enum: ['Married', 'Single', 'Divorced', 'Widowed', 'Separated', 'Other']
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('app_agent_details', AppUserDetailsSchema);
