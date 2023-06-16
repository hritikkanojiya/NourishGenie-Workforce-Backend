import Joi from 'joi';
import moment from 'moment';
import { joiPasswordExtendCore } from 'joi-password';

const JoiPassword = Joi.extend(joiPasswordExtendCore);
export const createAppUserSchema = Joi.object({
  //directory: Joi.string().trim(),
  first_name: Joi.string().trim().required(),
  last_name: Joi.string().trim().required(),
  email: Joi.string().trim().email().lowercase().required(),
  password: JoiPassword.string()
    .trim()
    .min(8)
    .max(16)
    .minOfSpecialCharacters(1)
    .minOfLowercase(1)
    .minOfUppercase(1)
    .minOfNumeric(1)
    .noWhiteSpaces()
    .required(),
  appAccessGroupId: Joi.string().hex().length(24).required(),
  appReportingManagerId: Joi.string().hex().length(24),
  appDepartmentId: Joi.string().hex().length(24).required(),
  appDesignationId: Joi.string().hex().length(24).required(),
  employee_type: Joi.string().trim().required(),

  //user company
  primary_email: Joi.string().trim().email().lowercase().required(),
  company_email: Joi.string().trim().email().lowercase().allow(null).default(null),
  gender: Joi.string().trim().required(),
  contact_number: Joi.number().required(),
  date_of_birth: Joi.date().required(),
  date_of_joining: Joi.date().required(),
  working_hours: Joi.string().trim().required(),
  salary: Joi.number().required(),
  marital_status: Joi.string().trim().required(),

  //bank details
  bank_name: Joi.string().trim().required(),
  account_number: Joi.number().required(),
  ifsc_code: Joi.string().trim().required(),
  name_as_per_bank: Joi.string().trim().required(),
  //address
  address: Joi.string().trim().required(),
  city: Joi.string().trim().required(),
  state: Joi.string().trim().required(),
  country: Joi.string().trim().required(),
  pincode: Joi.number().required(),
  landmark: Joi.string().trim().required(),
  //contact
  number: Joi.number().required(),
  relation: Joi.string().trim().required()
  //document
  // aadhar_number: Joi.string().trim().required(),
  // pan_number: Joi.string().trim().required()
});

export const fileSchema = Joi.object({
  fieldname: Joi.string().required(),
  originalname: Joi.string().required(),
  encoding: Joi.string().required(),
  mimetype: Joi.string().required(),
  destination: Joi.string().required(),
  filename: Joi.string().required(),
  path: Joi.string().required(),
  size: Joi.number().required()
});

export const uploadedFilesSchema = Joi.object({
  profile_picture: Joi.array().items(fileSchema).required(),
  aadhar_card: Joi.array().items(fileSchema).required(),
  pan_card: Joi.array().items(fileSchema).required(),
  documents: Joi.array().items(fileSchema).required()
});

export const getAppUserSchema = Joi.object({
  appAgentId: Joi.string().hex().length(24).required()
});

export const getAllDetailSchema = Joi.object({
  appAgentId: Joi.string().hex().length(24).required()
});

export const updateAppUserSchema = Joi.object({
  appAgentId: Joi.string().hex().length(24).required(),
  first_name: Joi.string().trim(),
  last_name: Joi.string().trim(),
  email: Joi.string().trim().email().lowercase(),
  appAccessGroupId: Joi.string().hex().length(24),
  appReportingManagerId: Joi.string().hex().length(24).allow(null).default(null),
  appDepartmentId: Joi.string().hex().length(24),
  appDesignationId: Joi.string().hex().length(24),
  employee_type: Joi.string().trim(),

  //user company
  primary_email: Joi.string().trim().email().lowercase(),
  company_email: Joi.string().trim().email().lowercase().allow(null).default(null),
  gender: Joi.string().trim(),
  contact_number: Joi.number(),
  date_of_birth: Joi.date().empty('').default(moment().add(1, 'days').format('YYYY-MM-DD')),
  date_of_joining: Joi.date(),
  working_hours: Joi.string().trim(),
  salary: Joi.number(),
  marital_status: Joi.string().trim(),

  //bank details
  bank_name: Joi.string().trim(),
  account_number: Joi.number(),
  ifsc_code: Joi.string().trim(),
  name_as_per_bank: Joi.string().trim(),
  //address
  address: Joi.string().trim(),
  city: Joi.string().trim(),
  state: Joi.string().trim(),
  country: Joi.string().trim(),
  pincode: Joi.number(),
  landmark: Joi.string().trim(),
  //contact
  number: Joi.number(),
  relation: Joi.string().trim(),
  //document
  aadhar_number: Joi.string().trim(),
  pan_number: Joi.string().trim()
});

export const deleteAppUserSchema = Joi.object({
  appAgentId: Joi.string().hex().length(24).required()
});
//export default { createAppUserSchema, uploadedFilesSchema, fileSchema };
