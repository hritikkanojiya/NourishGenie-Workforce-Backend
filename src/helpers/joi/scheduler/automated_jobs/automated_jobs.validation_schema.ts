// Import Packages
import joi from 'joi';
import joiObjectId from 'joi-objectid'
const objectId = joiObjectId(joi);

// Define Joi Validation Schema
const createAppAutomatedJobSchema = joi.object({
  appCronExpressionId: objectId().required(),
  appSmartFunctionId: objectId().required(),
  parameters: joi.object().required(),
  name: joi.string().trim().required(),
  description: joi.string().trim().required(),
  isActive: joi.boolean().default(true),
  isDeleted: joi.boolean().default(false),
});

const getAppAutomatedJobSchema = joi.object({
  appAutomatedJobId: objectId().allow(null).default(null),
  appCronExpressionId: objectId().allow(null).default(null),
  appSmartFunctionId: objectId().allow(null).default(null),
  search: joi.string().trim().allow(null).default(null),
  isActive: joi.boolean().allow(null).default(null),
  metaData: joi.object().keys({
    sortBy: joi.string().trim().allow(null).default(null),
    sortOn: joi.string().trim().allow(null).default(null),
    limit: joi.number().allow(null).default(null),
    offset: joi.number().allow(null).default(null),
    fields: joi.array().unique().allow(null).default(null),
  }),
  isDeleted: joi.boolean().default(false),
});

const updateAppAutomatedJobSchema = joi.object({
  appAutomatedJobId: objectId().required(),
  appCronExpressionId: objectId(),
  appSmartFunctionId: objectId().default(null),
  parameters: joi.object().required(),
  name: joi.string().trim(),
  description: joi.string().trim(),
  isActive: joi.boolean().default(null),
});

const deleteAppAutomatedJobSchema = joi.object({
  appAutomatedJobIds: joi.array().unique().items(objectId()).min(1).required(),
});

const toggleAppAutomatedJobSchema = joi.object({
  appAutomatedJobIds: joi.array().unique().items(objectId()).min(1).required(),
  isActive: joi.boolean().required(),
});

const forceExecuteAutomatedJobSchema = joi.object({
  appAutomatedJobIds: joi.array().unique().items(objectId()).min(1).required(),
});

const readAppAutomatedJobLogsSchema = joi.object({
  appAutomatedJobId: objectId().default(null).allow(null),
  metaData: joi.object().keys({
    sortBy: joi.string().trim().allow(null).default(null),
    sortOn: joi.string().trim().allow(null).default(null),
    limit: joi.number().allow(null).default(null),
    offset: joi.number().allow(null).default(null),
    fields: joi.array().unique().allow(null).default(null),
  }),
});

export {
  createAppAutomatedJobSchema,
  getAppAutomatedJobSchema,
  updateAppAutomatedJobSchema,
  deleteAppAutomatedJobSchema,
  toggleAppAutomatedJobSchema,
  forceExecuteAutomatedJobSchema,
  readAppAutomatedJobLogsSchema,
};
