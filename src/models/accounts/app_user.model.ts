import mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
// import { required } from 'joi';
const AppUserSchema = new mongoose.Schema({
  //Basic Information of Employee
  first_name: {
    type: String,
    required: [true, 'must provide a first_name'],
    trim: true,
    maxLength: [30, 'first_name cannot be more than 30 characters']
  },
  last_name: {
    type: String,
    required: [true, 'must provide a name'],
    trim: true,
    maxLength: [30, 'last name cannot be more than 30 characters']
  },
  email: {
    type: String,
    required: [true, 'must provide an email'],
    trim: true,
    unique: true,
    lowercase: true,
    // eslint-disable-next-line no-useless-escape
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'please fill a valid email address']
  },
  password: {
    type: String,
    required: [true, 'must provide a password'],
    maxlength: [15, 'password cannot be more than 15 characters'],
    minlength: [3, 'password cannot be less then 3 characters']
  },
  //linking with other schema fields
  appReportingManagerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'app_reporting_managers',
    default: null
  },
  appAccessGroupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'app_access_groups',
    required: true
  },
  appDepartmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'app_departments',
    required: true
  },
  appDesignationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'app_designations',
    required: true
  },
  employee_type: {
    type: String,
    enum: ['Permanent', 'Internship', 'Part-time', 'Freelancer'],
    required: [true, 'must provide a employee type']
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  isAdminstrator: {
    type: Boolean,
    default: false
  }
});

//Hashing the password before storing it in the database
AppUserSchema.pre('save', async function (this: any, next: any): Promise<void> {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(this.password, salt);
    this.password = hash;
    return next();
  } catch (err) {
    return next(err);
  }
});

//match hash password with user entered password
AppUserSchema.methods.matchPassword = async function (enteredPassword: string): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};

AppUserSchema.methods.getSignedJWTToken = function (): string {
  const mySecret: any = process.env.JWT_SECRET_KEY;

  return jwt.sign(
    {
      id: this._id
    },
    mySecret,
    {
      expiresIn: process.env.JWT_EXPIRE
    }
  );
};

export default mongoose.model('app_agents', AppUserSchema);
