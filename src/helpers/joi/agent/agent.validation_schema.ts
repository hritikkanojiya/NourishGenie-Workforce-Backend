// // Import Packages
import joi from 'joi';
import { joiPasswordExtendCore } from 'joi-password';
const joiPassword = joi.extend(joiPasswordExtendCore);
import joiObjectId from 'joi-objectid';
const objectId = joiObjectId(joi);
// Define joi Validation Schema

const appUserLoginSchema = joi.object({
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

const forceLogoutAppUsersSchema = joi.object({
  appUserIds: joi.array().unique().items(objectId()).min(1).required()
});

// Export schema
export {
  appUserLoginSchema,
  resetPassTokenSchema,
  verifyResetPassTokenSchema,
  updatePassSchema,
  forceLogoutAppUsersSchema,
};
