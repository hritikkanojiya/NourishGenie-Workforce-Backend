// Import Packages
import joi from 'joi';
import joiObjectId from 'joi-objectid';

const objectId = joiObjectId(joi);

// Define Joi Validation Schema
const createAppAttandenceSchema = joi.object({
    appAgentId: objectId().required(),
    availability: joi.string().required(),
    status: joi.string().trim().uppercase().valid('PRESENT', 'ABSENT').required(),
    date: joi.date().required(),
    isDeleted: joi.boolean().default(false)
});

const getAppAttandenceSchema = joi.object({
    appAgentId: objectId().allow(null).default(null),
    status: joi.string().trim().uppercase().allow(null).valid('PRESENT', 'ABSENT').default(null),
    date: joi.date().allow(null).default(null),
    search: joi.string().trim().allow(null).default(null),
    metaData: joi.object().keys({
        sortBy: joi.string().trim().allow(null).default(null),
        sortOn: joi.string().trim().allow(null).default(null),
        limit: joi.number().allow(null).default(null),
        offset: joi.number().allow(null).default(null),
        fields: joi.array().unique().allow(null).default(null)
    }),
    isDeleted: joi.boolean().default(false)
});

const updateAppAttandenceSchema = joi.object({
    appAttandenceId: objectId().required(),
    appAgentId: objectId().required(),
    availabilty: joi.string().required(),
    present: joi.boolean().required(),
});

const deleteAppAttandenceSchema = joi.object({
    appRouteIds: joi.array().unique().items(objectId()).min(1).required()
});

// Export schema
export {
    createAppAttandenceSchema,
    getAppAttandenceSchema,
    updateAppAttandenceSchema,
    deleteAppAttandenceSchema
};
