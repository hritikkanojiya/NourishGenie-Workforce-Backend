// Import Packages
import joi from 'joi';
import joiObjectId from 'joi-objectid'
const objectId = joiObjectId(joi);
import { default as cron } from 'cron-validate';
// import { LanguageMessages } from 'joi';

// Define Joi Validation Schema
const createAppCronExpressionSchema = joi.object({
  name: joi.string().trim().required(),
  description: joi.string().trim().required(),
  expression: joi
    .string()
    .trim()
    .required()
    .custom((value, helper) => {
      return cron(value).isValid()
        ? value
        : helper.message({ custom: `Invalid Cron Expresssion ${value}` });
    }),
  isDeleted: joi.boolean().default(false),
});

const getAppCronExpressionSchema = joi.object({
  appCronExpressionId: objectId().allow(null).default(null),
  expression: joi
    .string()
    .trim()
    .default(null)
    .allow(null)
    .custom((value, helper) => {
      return cron(value).isValid()
        ? value
        : helper.message({ custom: `Invalid Cron Expresssion ${value}` });
    }),
  search: joi.string().trim().allow(null).default(null),
  metaData: joi.object().keys({
    sortBy: joi.string().trim().allow(null).default(null),
    sortOn: joi.string().trim().allow(null).default(null),
    limit: joi.number().allow(null).default(null),
    offset: joi.number().allow(null).default(null),
    fields: joi.array().unique().allow(null).default(null),
  }),
  isDeleted: joi.boolean().default(false),
});

const updateAppCronExpressionSchema = joi.object({
  appCronExpressionId: objectId().required(),
  name: joi.string().trim(),
  description: joi.string().trim(),
  expression: joi
    .string()
    .trim()
    .custom((value, helper) => {
      return cron(value).isValid()
        ? value
        : helper.message({ custom: `Invalid Cron Expresssion ${value}` });
    }),
});

const deleteAppCronExpressionSchema = joi.object({
  appCronExpressionIds: joi
    .array()
    .unique()
    .items(objectId())
    .min(1)
    .required(),
});

export {
  createAppCronExpressionSchema,
  getAppCronExpressionSchema,
  updateAppCronExpressionSchema,
  deleteAppCronExpressionSchema,
};
