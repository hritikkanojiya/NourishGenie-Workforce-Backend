import joi from 'joi';
//import moment from 'moment';
import { joiPasswordExtendCore } from 'joi-password';
import joiObjectId from 'joi-objectid';
const objectId = joiObjectId(joi);

const joiPassword = joi.extend(joiPasswordExtendCore);
export const createAppUserSchema = joi.object({
  // directory: joi.string().trim(),
  first_name: joi.string().trim().required(),
  last_name: joi.string().trim().required(),
  email: joi.string().trim().email().lowercase().required(),
  password: joiPassword
    .string()
    .trim()
    .min(8)
    .max(16)
    .minOfSpecialCharacters(1)
    .minOfLowercase(1)
    .minOfUppercase(1)
    .minOfNumeric(1)
    .noWhiteSpaces()
    .required(),
  appAccessGroupId: joi.string().hex().length(24).required(),
  appReportingManagerId: joi.string().hex().length(24).allow(null).default(null),
  appDepartmentId: joi.string().hex().length(24).required(),
  appDesignationId: joi.string().hex().length(24).required(),
  employee_type: joi.string().trim().required(),

  //user company
  primary_email: joi.string().trim().email().lowercase().required(),
  company_email: joi.string().trim().email().lowercase().allow(null).default(null),
  gender: joi.string().trim().required(),
  contact_number: joi.number().required(),
  date_of_birth: joi.date().required(),
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
  city: objectId().required(),
  state: objectId().required(),
  country: objectId().required(),
  pincode: joi.number().required(),
  landmark: joi.string().trim().required(),
  //contact
  number: joi.number().required(),
  relation: joi.string().trim().required()
  //document
  // aadhar_number: joi.string().trim().required(),
  // pan_number: joi.string().trim().required()
});

export const getAppUserSchema = joi.object({
  appAgentId: objectId().allow(null).default(null),
  appAccessGroupId: objectId().allow(null).default(null),
  isAdministrator: joi.boolean().default(false),
  search: joi.string().trim().allow(null).default(null),
  metaData: joi.object().keys({
    sortBy: joi.string().trim().allow(null).default(null),
    sortOn: joi.string().trim().allow(null).default(null),
    limit: joi.number().allow(null).default(null),
    offset: joi.number().allow(null).default(null),
    fields: joi.array().unique().allow(null).default(null)
  }),
  isDeleted: joi.boolean().default(false)
});

export const getAllDetailSchema = joi.object({
  appAgentId: joi.string().hex().length(24).required()
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
  contact_number: joi.number(),
  date_of_birth: joi.date(),
  date_of_joining: joi.date(),
  working_hours: joi.string().trim(),
  salary: joi.number(),
  marital_status: joi.string().trim(),

  //bank details
  bank_name: joi.string().trim(),
  account_number: joi.number(),
  ifsc_code: joi.string().trim(),
  name_as_per_bank: joi.string().trim(),
  //address
  address: joi.string().trim(),
  city: objectId().required(),
  state: objectId().required(),
  country: objectId().required(),
  pincode: joi.number(),
  landmark: joi.string().trim(),
  //contact
  number: joi.number(),
  relation: joi.string().trim()
});

export const filterUserSchema = joi.object({
  appDesignationId: objectId().allow(null).default(null),
  appDepartmentId: objectId().allow(null).default(null),
  search: joi.string().trim().allow(null).default(null),
  metaData: joi.object().keys({
    sortBy: joi.string().trim().allow(null).default(null),
    sortOn: joi.string().trim().allow(null).default(null),
    limit: joi.number().allow(null).default(null),
    offset: joi.number().allow(null).default(null),
    fields: joi.array().unique().allow(null).default(null)
  })
});

export const deleteAppUserSchema = joi.object({
  appAgentId: objectId().required()
});
//export default { createAppUserSchema, uploadedFilesSchema, fileSchema };
