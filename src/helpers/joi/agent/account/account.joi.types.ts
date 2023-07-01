import { MetaDataResponse } from '../../../../helpers/shared/shared.type';
import mongoose from 'mongoose';
//import { AppAgentType } from '../agent.joi.types';

export interface CreateAppAgentType {
  //user basic details
  //directory: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  appAccessGroupId: string;
  appReportingManagerId: string | null;
  appDepartmentId: string;
  appDesignationId: string;
  employee_type: string;

  //user company details
  primary_email: string;
  company_email: string;
  gender: string;
  contact_number: number;
  date_of_birth: Date;
  date_of_joining: Date;
  working_hours: string;
  salary: number;
  marital_status: string;

  //user bank details
  name_as_per_bank: string;
  account_number: number;
  ifsc_code: string;
  bank_name: string;

  //user address details
  address: string;
  city: mongoose.Types.ObjectId;
  state: mongoose.Types.ObjectId;
  country: mongoose.Types.ObjectId;
  pincode: number;
  landmark: string;

  //user contact details
  number: number;
  relation: string;

  //user file
  // aadhar_number: string;
  // pan_number: string;
}
export interface GetAppAgentType {
  appAgentId: mongoose.Types.ObjectId | null;
  appAccessGroupId: mongoose.Types.ObjectId | null;
  isAdministrator: boolean | null;
  search: string | null;
  metaData: MetaDataResponse;
}

// export interface UploadedFiles {
//   profile_picture: File[];
//   aadhar_card: File[];
//   pan_card: File[];
//   // documents: File[];
// }

export interface DeleteAppAgentType {
  appAgentId: mongoose.Types.ObjectId;
}

export interface FilterAgentType {
  appDepartmentId: mongoose.Types.ObjectId;
  appDesignationId: mongoose.Types.ObjectId;
  metaData: MetaDataResponse;
  search: string | null;
}

export interface UpdateAppAgentType {
  appAgentId: mongoose.Types.ObjectId;
  //user basic details
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  appAccessGroupId: mongoose.Types.ObjectId;
  appReportingManagerId: mongoose.Types.ObjectId;
  appDepartmentId: mongoose.Types.ObjectId;
  appDesignationId: mongoose.Types.ObjectId;
  employee_type: string;

  //user company details
  primary_email: string;
  company_email: string | null;
  gender: string;
  contact_number: string;
  date_of_birth: Date;
  date_of_joining: Date;
  working_hours: string;
  salary: number;
  marital_status: string;

  //user bank details
  name_as_per_bank: string;
  account_number: string;
  ifsc_code: string;
  bank_name: string;

  //user address details
  address: string;
  city: mongoose.Types.ObjectId;
  state: mongoose.Types.ObjectId;
  country: mongoose.Types.ObjectId;
  pincode: string;
  landmark: string;

  //user contact details
  number: string;
  relation: string;

  //user file
  // aadhar_number: string;
  // pan_number: string;
  // aadhar_number: string;
  // pan_number: string;

  //isDeleted: boolean;
}
