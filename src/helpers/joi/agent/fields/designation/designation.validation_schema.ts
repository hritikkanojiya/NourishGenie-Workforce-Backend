import joi from 'joi';
import joiObjectId from 'joi-objectid';
const objectId = joiObjectId(joi);

const createAppDesignationSchema = joi.object({
  name: joi.string().trim().required(),
  description: joi.string().trim().required()
});
const getAppDesignationSchema = joi.object({
  appDesignationId: objectId().allow(null),
  search: joi.string().trim().allow(null, ''),
  metaData: joi.object().keys({
    sortBy: joi.string().trim().allow(null).default(null),
    sortOn: joi.string().trim().allow(null).default(null),
    limit: joi.number().allow(null).default(null),
    offset: joi.number().allow(null).default(null),
    fields: joi.array().unique().allow(null).default(null)
  })
});

const deleteAppDesignationSchema = joi.object({
  appDesignationIds: joi.array().unique().items(objectId()).min(1).required()
});

const updateAppDesignationSchema = joi.object({
  appDesignationId: objectId().required(),
  name: joi.string().trim().required(),
  description: joi.string().trim().required()
});

const getSingleDesignationSchema = joi.object({
  appDesignationId: objectId().required()
});

export {
  getSingleDesignationSchema,
  createAppDesignationSchema,
  getAppDesignationSchema,
  deleteAppDesignationSchema,
  updateAppDesignationSchema
};
