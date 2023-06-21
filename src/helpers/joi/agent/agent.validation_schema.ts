// // Import Packages
// const joi = require('joi');
// const { joiPasswordExtendCore } = require('joi-password');
// joi.objectId = require('joi-objectid')(joi);
// const joiPassword = joi.extend(joiPasswordExtendCore);
import joi from 'joi';
import { joiPasswordExtendCore } from 'joi-password';
const joiPassword = joi.extend(joiPasswordExtendCore);
import joiObjectId from 'joi-objectid';
const objectId = joiObjectId(joi);
// Define joi Validation Schema

const appAgentLoginSchema = joi.object({
  email: joi.string().trim().email().lowercase().required(),
  password: joiPassword.string().trim().min(8).max(16).noWhiteSpaces().required()
});

const resetPassTokenSchema = joi.object({
  email: joi.string().trim().email().required()
});

const verifyResetPassTokenSchema = joi.object({
  token: joi.string().trim().required(),
  secret: joi.string().trim().required()
});

const updatePassSchema = joi.object({
  token: joi.string().trim().required(),
  secret: joi.string().trim().required(),
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
  cfmPassword: joi.string().trim().required().valid(joi.ref('password'))
});

const forceLogoutAppAgentsSchema = joi.object({
  appAgentIds: joi.array().unique().items(objectId()).min(1).required()
});

// Export schema
export {
  appAgentLoginSchema,
  resetPassTokenSchema,
  verifyResetPassTokenSchema,
  updatePassSchema,
  forceLogoutAppAgentsSchema,
};
