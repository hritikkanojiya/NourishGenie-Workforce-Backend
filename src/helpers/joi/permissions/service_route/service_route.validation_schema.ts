// Import Packages
import joi from 'joi';
import joiObjectId from 'joi-objectid';

const objectId = joiObjectId(joi);

// Define Joi Validation Schema
const createAppRouteSchema = joi.object({
    method: joi.string().trim().uppercase().required().valid('GET', 'POST', 'PUT', 'DELETE', 'PATCH'),
    path: joi.string().trim().required(),
    type: joi.string().trim().uppercase().required().valid('MANUAL', 'AUTOMATED'),
    secure: joi.boolean().allow(true, false).required(),
    appAccessGroupIds: joi.when('secure', {
        is: true,
        then: joi.array().unique().items(objectId()).min(1).required(),
        otherwise: joi.array().default([]).length(0)
    }),
    isDeleted: joi.boolean().default(false)
});

const getAppRoutesSchema = joi.object({
    appRouteId: objectId().allow(null).allow(null).default(null),
    method: joi.string().trim().uppercase().allow(null).valid('GET', 'POST', 'PUT', 'DELETE', 'PATCH').default(null),
    type: joi.string().trim().uppercase().allow(null).valid('MANUAL', 'AUTOMATED').default(null),
    search: joi.string().trim().allow(null).default(null),
    secure: joi.boolean().allow(null).default(null),
    appAccessGroupIds: joi.array().unique().items(objectId()).default(null),
    checkAppAccessGroupIds: joi.array().unique().items(objectId()).default(null),
    metaData: joi.object().keys({
        sortBy: joi.string().trim().allow(null).default(null),
        sortOn: joi.string().trim().allow(null).default(null),
        limit: joi.number().allow(null).default(null),
        offset: joi.number().allow(null).default(null),
        fields: joi.array().unique().allow(null).default(null)
    }),
    isDeleted: joi.boolean().default(false)
});

const updateAppRouteSchema = joi.object({
    appRouteId: objectId().required(),
    method: joi.string().trim().uppercase().valid('GET', 'POST', 'PUT', 'DELETE', 'PATCH'),
    type: joi.string().trim().uppercase().required().valid('MANUAL', 'AUTOMATED'),
    path: joi.string().trim(),
    secure: joi.boolean().allow(true, false),
    appAccessGroupIds: joi.when('secure', {
        is: true,
        then: joi.array().unique().items(objectId()).min(1).required(),
        otherwise: joi.array().default([]).length(0)
    })
});

const toggleGroupSchema = joi.object({
    appRouteId: objectId().required(),
    appAccessGroupIds: joi.array().unique().items(objectId()).required(),
    toggleAction: joi.string().valid('ADD', 'REMOVE')
});

const deleteAppRouteSchema = joi.object({
    appRouteIds: joi.array().unique().items(objectId()).min(1).required()
});

// Export schema
export {
    createAppRouteSchema,
    getAppRoutesSchema,
    toggleGroupSchema,
    updateAppRouteSchema,
    deleteAppRouteSchema
};
