import mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
// import { required } from 'joi';
import { AppAgentType } from '../../helpers/joi/agent/index'
import appDepartmentModel from '../../models/agent/fields/app_department.model'

const agentSchema = new mongoose.Schema({
  //Basic Information of Employee
  appAgentIdOfDepartment: {
    type: String,
  },
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
    ref: 'app_reporting_manager',
    default: null
  },
  appAccessGroupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'app_access_group',
    required: true
  },
  appDepartmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'app_department',
    required: true
  },
  appDesignationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'app_designation',
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

// //Hashing the password before storing it in the database
// agentSchema.pre('save', async function (this: any, next: any): Promise<void> {
//   if (!this.isModified('password')) {
//     return next();
//   }
//   try {
//     const salt = await bcrypt.genSalt(10);
//     const hash = await bcrypt.hash(this.password, salt);
//     this.password = hash;
//     return next();
//   } catch (err) {
//     return next(err);
//   }
// });




agentSchema.pre<AppAgentType>('save', async function (next) {
  try {
    // this.appAccessGroupId = this.appAccessGroupId;
    this.first_name = this.first_name?.replace(/(^\w|\s\w)/g, m => m.toUpperCase());
    this.last_name = this.last_name?.replace(/(^\w|\s\w)/g, m => m.toUpperCase());
    this.password = await bcrypt.hash(this.password ?? '', 10);
    this.appAgentIdOfDepartment = await generateAgentId(this.appDepartmentId)
    next();
  } catch (error: any) {
    next(error);
  }
});

agentSchema.pre<AppAgentType>('updateOne', async function (next) {
  try {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 10);
    }
    next();
  } catch (error: any) {
    next(error);
  }
});

//match hash password with user entered password
// agentSchema.methods.isValidPassword = async function (enteredPassword: string): Promise<boolean> {
//   return await bcrypt.compare(enteredPassword, this.password);
// };
agentSchema.methods.isValidPassword = async function (this: any, plainPassword: string): Promise<boolean> {
  return await bcrypt.compare(plainPassword, this.password);
};

agentSchema.methods.getSignedJWTToken = function (): string {
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

const appAgentModel = mongoose.model('app_agents', agentSchema);

export default appAgentModel;


async function generateAgentId(departmentId: any): Promise<string> {
  const department = await appDepartmentModel.findOne({ _id: departmentId }).catch(error => { throw error })
  let prefix;
  if (department?.name == 'Information Technology') {
    prefix = 'NGIT'
  }
  else if (department?.name == 'Sales') {
    prefix = 'NGSA'
  }
  else if (department?.name == 'Customer Service') {
    prefix = 'NGCS'
  }
  else {
    prefix = 'NGCL'
  }
  const lastAgent = await appAgentModel.findOne().sort({ _id: -1 }).limit(1);
  // let lastCount = await appAgentModel.find().countDocuments();
  let count = 1;
  if (lastAgent) {
    let lastAgentId;
    if (department?.name == 'Information Technology') {
      lastAgentId = lastAgent.appAgentIdOfDepartment ? lastAgent.appAgentIdOfDepartment : 'NGIT00';
    }
    else if (department?.name == 'Sales') {
      lastAgentId = lastAgent.appAgentIdOfDepartment ? lastAgent.appAgentIdOfDepartment : 'NGSA00';
    }
    else if (department?.name == 'Customer Service') {
      lastAgentId = lastAgent.appAgentIdOfDepartment ? lastAgent.appAgentIdOfDepartment : 'NGCS00';
    }
    else {
      lastAgentId = lastAgent.appAgentIdOfDepartment ? lastAgent.appAgentIdOfDepartment : 'NGCL00';
    }
    let lastCount = parseInt(lastAgentId.replace(prefix, ''), 10);
    if (isNaN(lastCount)) lastCount = 0;
    count = lastCount + 1;
  }
  // lastCount += 1;
  return prefix + count;
}
