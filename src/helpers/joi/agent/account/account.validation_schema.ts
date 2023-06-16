import joi from 'joi';
import moment from 'moment';
import { joiPasswordExtendCore } from 'joi-password';
import joiObjectId from 'joi-objectid';
const objectId = joiObjectId(joi);

const joiPassword = joi.extend(joiPasswordExtendCore);
export const createAppUserSchema = joi.object({
  // directory: joi.string().trim(),
  first_name: joi.string().trim().required(),
  last_name: joi.string().trim().required(),
  email: joi.string().trim().email().lowercase().required(),
  password: joiPassword.string()
    .trim()
    .min(8)
    .max(16)
    .minOfSpecialCharacters(1)
    .minOfLowercase(1)
    .minOfUppercase(1)
    .minOfNumeric(1)
    .noWhiteSpaces()
    .required(),
  appAccessGroupId: objectId().required(),
  appReportingManagerId: objectId().allow(null).default(null),
  appDepartmentId: objectId().required(),
  appDesignationId: objectId().required(),
  employee_type: joi.string().trim().required(),

  //user company
  primary_email: joi.string().trim().email().lowercase().required(),
  company_email: joi.string().trim().email().lowercase().allow(null).default(null),
  gender: joi.string().trim().required(),
  contact_number: joi.number().required(),
  date_of_birth: joi.date().empty('').default(moment().add(1, 'days').format('YYYY-MM-DD')).required(),
  date_of_joining: joi.date().required(),
  working_hours: joi.string().trim().required(),
  salary: joi.number().required(),
  marital_status: joi.string().trim().required(),

  //bank details
  bank_name: joi.string().trim().required(),
  account_number: joi.number().required(),
  ifsc_code: joi.string().trim().required(),
  name_as_per_bank: joi.string().trim().required(),
  //address
  address: joi.string().trim().required(),
  city: joi.string().trim().required(),
  state: joi.string().trim().required(),
  country: joi.string().trim().required(),
  pincode: joi.number().required(),
  landmark: joi.string().trim().required(),
  //contact
  number: joi.number().required(),
  relation: joi.string().trim().required(),
  //document
  aadhar_number: joi.string().trim().required(),
  pan_number: joi.string().trim().required()
});

export const fileSchema = joi.object({
  fieldname: joi.string().required(),
  originalname: joi.string().required(),
  encoding: joi.string().required(),
  mimetype: joi.string().required(),
  destination: joi.string().required(),
  filename: joi.string().required(),
  path: joi.string().required(),
  size: joi.number().required()
});

export const uploadedFilesSchema = joi.object({
  profile_picture: joi.array().items(fileSchema).required(),
  aadhar_card: joi.array().items(fileSchema).required(),
  pan_card: joi.array().items(fileSchema).required(),
  // documents: joi.array().items(fileSchema).required()
});

export const getAppUserSchema = joi.object({
  appAgentId: objectId().required()
});

export const updateAppUserSchema = joi.object({
  appAgentId: objectId().required(),
  first_name: joi.string().trim(),
  last_name: joi.string().trim(),
  email: joi.string().trim().email().lowercase(),
  appAccessGroupId: objectId(),
  appReportingManagerId: objectId().allow(null).default(null),
  appDepartmentId: objectId(),
  appDesignationId: objectId(),
  employee_type: joi.string().trim(),
  //user company
  primary_email: joi.string().trim().email().lowercase(),
  company_email: joi.string().trim().email().lowercase().allow(null).default(null),
  gender: joi.string().trim(),
  contact_number: joi.string().trim(),
  date_of_birth: joi.date().empty('').default(moment().add(1, 'days').format('YYYY-MM-DD')),
  date_of_joining: joi.date(),
  working_hours: joi.string().trim(),
  salary: joi.string().trim(),
  marital_status: joi.string().trim(),

  //bank details
  bank_name: joi.string().trim(),
  account_number: joi.string().trim(),
  ifsc_code: joi.string().trim(),
  name_as_per_bank: joi.string().trim(),
  //address
  address: joi.string().trim(),
  city: joi.string().trim(),
  state: joi.string().trim(),
  country: joi.string().trim(),
  pincode: joi.string().trim(),
  landmark: joi.string().trim(),
  //contact
  number: joi.string().trim(),
  relation: joi.string().trim(),
  //document
  aadhar_number: joi.string().trim(),
  pan_number: joi.string().trim()
});

export const deleteAppUserSchema = joi.object({
  appAgentId: objectId().required()
});
//export default { createAppUserSchema, uploadedFilesSchema, fileSchema };
