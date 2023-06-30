// Import Packages
import joi from 'joi';
import joiObjectId from 'joi-objectid'
const objectId = joiObjectId(joi);

// Define Joi Validation Schema
const createAppSmartFunctionSchema = joi.object({
  name: joi.string().trim().required(),
  description: joi.string().trim().required(),
  parameters: joi
    .array()
    .items(
      joi.object().keys({
        parameterName: joi.string().trim().required(),
        required: joi.boolean().default(false).required()
      })
    )
    .allow(null)
    .default(null),
  isDeleted: joi.boolean().default(false),
});

const getAppSmartFunctionSchema = joi.object({
  appSmartFunctionId: objectId().allow(null).default(null),
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

const updateAppSmartFunctionSchema = joi.object({
  appSmartFunctionId: objectId().required(),
  name: joi.string().trim().default(null).allow(null),
  description: joi.string().trim().default(null).allow(null),
  parameters: joi
    .array()
    .items(
      joi.object().keys({
        parameterName: joi.string().trim().default(null).allow(null),
        required: joi.boolean().default(false).allow(null),
      })
    )
    .allow(null)
    .default(null),
  isDeleted: joi.boolean().default(false),
});

const deleteAppSmartFunctionSchema = joi.object({
  appSmartFunctionIds: joi
    .array()
    .unique()
    .items(objectId())
    .min(1)
    .required(),
});

export {
  createAppSmartFunctionSchema,
  getAppSmartFunctionSchema,
  updateAppSmartFunctionSchema,
  deleteAppSmartFunctionSchema,
};
