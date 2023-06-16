export interface CreateAppUserType {
  //user basic details
  //directory: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  appAccessGroupId: string;
  appReportingManagerId: string;
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
  city: string;
  state: string;
  country: string;
  pincode: number;
  landmark: string;

  //user contact details
  number: number;
  relation: string;

  //user file
  //aadhar_number: string;
  //pan_number: string;
}
export interface GetAppUserType {
  appAgentId: string;
}
export interface File {
  mv: any;
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  destination: string;
  filename: string;
  path: string;
  size: number;
}

export interface UploadedFiles {
  profile_picture: File[];
  aadhar_card: File[];
  pan_card: File[];
  documents: File[];
}

export interface DeleteAppUserType {
  appAgentId: string;
}

export interface UpdateAppUserType {
  appAgentId: string;
  //user basic details
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
  company_email: string | null;
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
  city: string;
  state: string;
  country: string;
  pincode: number;
  landmark: string;

  //user contact details
  number: number;
  relation: string;

  //user file
  aadhar_number: string;
  pan_number: string;
}
