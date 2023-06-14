import joi from 'joi';
import joiObjectId from 'joi-objectid';
const objectId = joiObjectId(joi);

const createAppAccessGroupSchema = joi.object({
  name: joi.string().trim().required(),
  description: joi.string().trim().required(),
  isAdministrator: joi.boolean().default(false),
  isDeleted: joi.boolean().default(false),
});

const getAppAccessGroupSchema = joi.object({
  appAccessGroupId: objectId().allow(null).default(null),
  isAdministrator: joi.boolean().default(null).allow(null),
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

const updateAppAccessGroupSchema = joi.object({
  appAccessGroupId: objectId().required(),
  name: joi.string().trim(),
  description: joi.string().trim(),
  isAdministrator: joi.boolean().default(false),
});

const deleteAppAccessGroupSchema = joi.object({
  appAccessGroupIds: joi
    .array()
    .unique()
    .items(objectId())
    .min(1)
    .required(),
});


export { createAppAccessGroupSchema, getAppAccessGroupSchema, updateAppAccessGroupSchema, deleteAppAccessGroupSchema }