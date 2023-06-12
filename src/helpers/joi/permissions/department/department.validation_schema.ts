import Joi from 'joi';

const createAppDepartmentSchema = Joi.object({
  name: Joi.string().trim().required(),
  description: Joi.string().trim().required()
});

const getAppDepartmentSchema = Joi.object({
  search: Joi.string().trim().allow(''),
  metaData: Joi.object().keys({
    sortBy: Joi.string().trim().allow(null).default(null),
    sortOn: Joi.string().trim().allow(null).default(null),
    limit: Joi.number().allow(null).default(null),
    offset: Joi.number().allow(null).default(null),
    fields: Joi.array().unique().allow(null).default(null)
  })
});

const deleteAppDepartmentSchema = Joi.object({
  appDepartmentId: Joi.array().unique().items(Joi.string().hex().length(24)).min(1).required()
});

const updateAppDepartmentSchema = Joi.object({
  appDepartmentId: Joi.string().hex().length(24).required(),
  name: Joi.string().trim().required(),
  description: Joi.string().trim().required()
});

export { createAppDepartmentSchema, getAppDepartmentSchema, deleteAppDepartmentSchema, updateAppDepartmentSchema };
