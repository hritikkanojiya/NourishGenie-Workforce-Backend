// // Import Packages
// const Joi = require('Joi');
// const { JoiPasswordExtendCore } = require('Joi-password');
// Joi.objectId = require('Joi-objectid')(Joi);
// const JoiPassword = Joi.extend(JoiPasswordExtendCore);
import Joi from 'joi';
import { joiPasswordExtendCore } from 'joi-password';

// const joiObjectId = Joi.string().hex().length(24)
const JoiPassword = Joi.extend(joiPasswordExtendCore);

// Define Joi Validation Schema
const appAgentRegistrationSchema = Joi.object({
  username: Joi.string().trim().required(),
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
  isNonDeleteAble: Joi.boolean(),
  isDeleted: Joi.boolean().default(false)
});

const appAgentLoginSchema = Joi.object({
  email: Joi.string().trim().email().lowercase().required(),
  password: JoiPassword.string().trim().min(8).max(16).noWhiteSpaces().required()
});

const getAppAgentsSchema = Joi.object({
  appAccessGroupId: Joi.string().hex().length(24).allow(null).default(null),
  search: Joi.string().trim().allow(null).default(null),
  metaData: Joi.object().keys({
    sortBy: Joi.string().trim().allow(null).default(null),
    sortOn: Joi.string().trim().allow(null).default(null),
    limit: Joi.number().allow(null).default(null),
    offset: Joi.number().allow(null).default(null),
    fields: Joi.array().unique().allow(null).default(null)
  }),
  isDeleted: Joi.boolean().default(false)
});

const getAppAgentDetailSchema = Joi.object({
  appAgentId: Joi.string().hex().length(24).required()
});

const getAppActivitiesSchema = Joi.object({
  appActivityId: Joi.string().hex().length(24).allow(null).default(null),
  appAgentId: Joi.string().hex().length(24).allow(null).default(null),
  search: Joi.string().trim().allow(null).default(null),
  metaData: Joi.object().keys({
    sortBy: Joi.string().trim().allow(null).default(null),
    sortOn: Joi.string().trim().allow(null).default(null),
    limit: Joi.number().allow(null).default(null),
    offset: Joi.number().allow(null).default(null),
    fields: Joi.array().unique().allow(null).default(null)
  }),
  isDeleted: Joi.boolean().default(false)
});

const resetPassTokenSchema = Joi.object({
  email: Joi.string().trim().email().required()
});

const verifyResetPassTokenSchema = Joi.object({
  token: Joi.string().trim().required(),
  secret: Joi.string().trim().required()
});

const updatePassSchema = Joi.object({
  token: Joi.string().trim().required(),
  secret: Joi.string().trim().required(),
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
  cfmPassword: Joi.string().trim().required().valid(Joi.ref('password'))
});

const forceLogoutAppAgentsSchema = Joi.object({
  appAgentIds: Joi.array().unique().items(Joi.string().hex().length(24)).min(1).required()
});

// Export schema
export {
  appAgentRegistrationSchema,
  appAgentLoginSchema,
  getAppAgentDetailSchema,
  resetPassTokenSchema,
  verifyResetPassTokenSchema,
  updatePassSchema,
  getAppAgentsSchema,
  forceLogoutAppAgentsSchema,
  getAppActivitiesSchema
};
