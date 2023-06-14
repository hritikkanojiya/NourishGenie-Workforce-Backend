import joi from 'joi';
import joiObjectId from 'joi-objectid';
const objectId = joiObjectId(joi);


const createAppConstantSchema = joi.object({
  name: joi.string().trim().uppercase().required(),
  value: joi.any().required(),
  isAutoLoad: joi.boolean().required().default(false),
  isDeleted: joi.bool().default(false),
});

const getAppConstantsSchema = joi.object({
  appConstantId: objectId().allow(null).default(null),
  search: joi.string().trim().allow(null).default(null),
  isAutoLoad: joi.bool().allow(null).default(null),
  metaData: joi.object().keys({
    sortBy: joi.string().trim().allow(null).default(null),
    sortOn: joi.string().trim().allow(null).default(null),
    limit: joi.number().allow(null).default(null),
    offset: joi.number().allow(null).default(null),
    fields: joi.array().unique().allow(null).default(null),
  }),
  isDeleted: joi.boolean().default(false),
});

const updateAppConstantSchema = joi.object({
  appConstantId: objectId().required(),
  name: joi.string().uppercase().trim(),
  value: joi.any(),
  isAutoLoad: joi.boolean(),
});

const deleteAppConstantsSchema = joi.object({
  appConstantIds: joi.array().unique().items(objectId()).min(1).required(),
});

export {
  createAppConstantSchema,
  getAppConstantsSchema,
  updateAppConstantSchema,
  deleteAppConstantsSchema,
};
