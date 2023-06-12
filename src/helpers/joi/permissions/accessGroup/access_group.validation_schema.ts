import Joi from 'joi';

const createAppAccessGroupSchema = Joi.object({
  name: Joi.string().trim().required(),
  description: Joi.string().trim().required(),
  isAdministrator: Joi.boolean().default(false),
  isDeleted: Joi.boolean().default(false),
});

const getAppAccessGroupSchema = Joi.object({
  appAccessGroupId: Joi.string().hex().length(24).allow(null).default(null),
  isAdministrator: Joi.boolean().default(null).allow(null),
  search: Joi.string().trim().allow(null).default(null),
  metaData: Joi.object().keys({
    sortBy: Joi.string().trim().allow(null).default(null),
    sortOn: Joi.string().trim().allow(null).default(null),
    limit: Joi.number().allow(null).default(null),
    offset: Joi.number().allow(null).default(null),
    fields: Joi.array().unique().allow(null).default(null),
  }),
  isDeleted: Joi.boolean().default(false),
});

const updateAppAccessGroupSchema = Joi.object({
  appAccessGroupId: Joi.string().hex().length(24).required(),
  name: Joi.string().trim(),
  description: Joi.string().trim(),
  isAdministrator: Joi.boolean().default(false),
});

const deleteAppAccessGroupSchema = Joi.object({
  appAccessGroupIds: Joi
    .array()
    .unique()
    .items(Joi.string().hex().length(24))
    .min(1)
    .required(),
});


export { createAppAccessGroupSchema, getAppAccessGroupSchema, updateAppAccessGroupSchema, deleteAppAccessGroupSchema }