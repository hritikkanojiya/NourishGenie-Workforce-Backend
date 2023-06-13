import joi from 'joi';
import joiObjectId from 'joi-objectid';
const objectId = joiObjectId(joi);

const createAppDepartmentSchema = joi.object({
  name: joi.string().trim().required(),
  description: joi.string().trim().required()
});

const getAppDepartmentSchema = joi.object({
  appDepartmentId: objectId().allow(null),
  search: joi.string().trim().allow(null),
  metaData: joi.object().keys({
    sortBy: joi.string().trim().allow(null).default(null),
    sortOn: joi.string().trim().allow(null).default(null),
    limit: joi.number().allow(null).default(null),
    offset: joi.number().allow(null).default(null),
    fields: joi.array().unique().allow(null).default(null)
  })
});

const deleteAppDepartmentSchema = joi.object({
  appDepartmentIds: joi.array().unique().items(objectId()).min(1).required()
});

const updateAppDepartmentSchema = joi.object({
  appDepartmentId: objectId().required(),
  name: joi.string().trim().required(),
  description: joi.string().trim().required()
});

const getSingleDepartmentSchema = joi.object({
  appDepartmentId: objectId().required(),
});

export {
  createAppDepartmentSchema,
  getSingleDepartmentSchema,
  getAppDepartmentSchema,
  deleteAppDepartmentSchema,
  updateAppDepartmentSchema
};
