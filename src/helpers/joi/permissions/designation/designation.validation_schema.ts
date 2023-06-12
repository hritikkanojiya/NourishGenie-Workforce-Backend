import Joi from 'joi';

const createAppDesignationSchema = Joi.object({
  name: Joi.string().trim().required(),
  description: Joi.string().trim().required()
});
const getAppDesignationSchema = Joi.object({
  search: Joi.string().trim().allow(''),
  metaData: Joi.object().keys({
    sortBy: Joi.string().trim().allow(null).default(null),
    sortOn: Joi.string().trim().allow(null).default(null),
    limit: Joi.number().allow(null).default(null),
    offset: Joi.number().allow(null).default(null),
    fields: Joi.array().unique().allow(null).default(null)
  })
});

const deleteAppDesignationSchema = Joi.object({
  appDesignationId: Joi.array().unique().items(Joi.string().hex().length(24)).min(1).required()
});

const updateAppDesignationSchema = Joi.object({
  appDesignationId: Joi.string().hex().length(24).required(),
  name: Joi.string().trim().required(),
  description: Joi.string().trim().required()
});

const getSingleDesignationSchema = Joi.object({
  appDesignationId: Joi.string().length(24).required()
});

export {
  getSingleDesignationSchema,
  createAppDesignationSchema,
  getAppDesignationSchema,
  deleteAppDesignationSchema,
  updateAppDesignationSchema
};
