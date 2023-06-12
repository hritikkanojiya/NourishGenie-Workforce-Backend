import Joi from 'joi';

const createAppReportingManagerSchema = Joi.object({
  ReportingManagerId: Joi.string().trim().required()
});

const getAppReportingManagerSchema = Joi.object({
  metaData: Joi.object().keys({
    sortBy: Joi.string().trim().allow(null).default(null),
    sortOn: Joi.string().trim().allow(null).default(null),
    limit: Joi.number().allow(null).default(null),
    offset: Joi.number().allow(null).default(null),
    fields: Joi.array().unique().allow(null).default(null)
  })
});

const deleteAppReportingManagerSchema = Joi.object({
  ReportingManagerId: Joi.array().unique().items(Joi.string().hex().length(24)).min(1).required()
});

const updateAppReportingManagerSchema = Joi.object({
  ReportingManagerId: Joi.string().hex().length(24).required()
});

export {
  createAppReportingManagerSchema,
  getAppReportingManagerSchema,
  deleteAppReportingManagerSchema,
  updateAppReportingManagerSchema
};
