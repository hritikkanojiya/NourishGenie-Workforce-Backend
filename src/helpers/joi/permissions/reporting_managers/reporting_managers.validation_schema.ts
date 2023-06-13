import joi from 'joi';

import joiObjectId from 'joi-objectid';
const objectId = joiObjectId(joi);

const createAppReportingManagerSchema = joi.object({
  appAgentId: objectId().required(),
  isDeleted: joi.boolean().default(false)
});

const getAppReportingManagerSchema = joi.object({
  appManagerId: objectId().allow(null),
  appAgentId: objectId().allow(null),
  search: joi.string().trim().allow(null),
  metaData: joi.object().keys({
    sortBy: joi.string().trim().allow(null).default(null),
    sortOn: joi.string().trim().allow(null).default(null),
    limit: joi.number().allow(null).default(null),
    offset: joi.number().allow(null).default(null),
    fields: joi.array().unique().allow(null).default(null)
  })
});

const deleteAppReportingManagerSchema = joi.object({
  appManagerIds: joi.array().unique().items(objectId()).min(1).required()
});

const updateAppReportingManagerSchema = joi.object({
  appManagerId: objectId().required(),
  appAgentId: objectId().required(),
  isDeleted: joi.boolean().default(false)
});

export {
  createAppReportingManagerSchema,
  getAppReportingManagerSchema,
  deleteAppReportingManagerSchema,
  updateAppReportingManagerSchema
};
