// Import Packages
import joi from 'joi';
import joiObjectId from 'joi-objectid';

const objectId = joiObjectId(joi);

// Define Joi Validation Schema
const createAppMenuSchema = joi.object({
    name: joi.string().trim().required(),
    description: joi.string().trim().required(),
    hasSubMenus: joi.boolean().valid(true, false).required(),
    appAccessGroupIds: joi
        .array()
        .unique()
        .items(objectId())
        .min(1)
        .required(),
    isDeleted: joi.boolean(),
    url: joi.when('hasSubMenus', {
        is: true,
        then: joi.boolean().valid(null).default(null),
        otherwise: joi.string().trim().required(),
    }),
});

const getAppMenuSchema = joi.object({
    appMenuId: objectId().allow(null).default(null),
    appAccessGroupIds: joi.array().unique().items(objectId()).default(null),
    hasSubMenus: joi.boolean().valid(true, false).allow(null).default(null),
    search: joi.string().trim().allow(null).default(null),
    url: joi.when('hasSubMenus', {
        is: true,
        then: joi.boolean().allow(false, null).default(null),
        otherwise: joi.string().trim().allow(null).default(null),
    }),
    checkAppAccessGroupIds: joi
        .array()
        .unique()
        .items(objectId())
        .default(null),
    metaData: joi.object().keys({
        sortBy: joi.string().trim().allow(null).default(null),
        sortOn: joi.string().trim().allow(null).default(null),
        limit: joi.number().allow(null).default(null),
        offset: joi.number().allow(null).default(null),
        fields: joi.array().unique().allow(null).default(null),
    }),
    isDeleted: joi.boolean().default(false),
});

const updateAppMenuSchema = joi.object({
    appMenuId: objectId().required(),
    name: joi.string().trim(),
    description: joi.string().trim(),
    hasSubMenus: joi.boolean().valid(true, false).allow(null).default(null),
    appAccessGroupIds: joi
        .array()
        .unique()
        .items(objectId())
        .min(1)
        .required(),
    url: joi.when('hasSubMenus', {
        is: true,
        then: joi.boolean().allow(false, null).default(null),
        otherwise: joi.string().trim().allow(null).default(null),
    }),
});

const toggleAppAccessGroupSchema = joi.object({
    appMenuId: objectId().required(),
    appAccessGroupIds: joi.array().unique().items(objectId()).required(),
    toggleAction: joi.string().valid('ADD', 'REMOVE'),
});

const deleteAppMenuSchema = joi.object({
    appMenuIds: joi.array().unique().items(objectId()).min(1).required(),
});

const appSubMenuSchema = joi.object({
    name: joi.string().trim().required(),
    description: joi.string().trim().required(),
    url: joi.string().trim().required(),
    isDeleted: joi.boolean(),
});

const createAppSubMenuSchema = joi.object({
    appMenuId: objectId().required(),
    appSubMenus: joi.array().items(appSubMenuSchema),
    isDeleted: joi.boolean(),
});

const getAppSubMenuSchema = joi.object({
    appMenuId: objectId().allow(null).default(null),
    appSubMenuId: objectId().allow(null).default(null),
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

const updateAppSubMenuSchema = joi.object({
    appSubMenuId: objectId().required(),
    appMenuId: objectId(),
    name: joi.string().trim(),
    description: joi.string().trim(),
    url: joi.string().trim(),
});

const deleteAppSubMenuSchema = joi.object({
    appSubMenuIds: joi.array().unique().items(objectId()).min(1).required(),
});

const previewAppMenuSchema = joi.object({
    appAccessGroupIds: joi
        .array()
        .unique()
        .items(objectId())
        .required()
        .allow(null)
        .default(null),
});

const seralizeAppMenuSchema = joi.object({
    sequenceOrder: joi.array().items(
        joi.object().keys({
            appMenuId: objectId().required(),
            sequenceNumber: joi.number().integer().required(),
            appSubMenus: joi
                .array()
                .items(
                    joi.object().keys({
                        appSubMenuId: objectId().required(),
                        sequenceNumber: joi.number().integer().required(),
                    })
                )
                .default([]),
        })
    ),
});

// Export schema
export {
    createAppMenuSchema,
    getAppMenuSchema,
    updateAppMenuSchema,
    deleteAppMenuSchema,
    toggleAppAccessGroupSchema,
    createAppSubMenuSchema,
    getAppSubMenuSchema,
    deleteAppSubMenuSchema,
    updateAppSubMenuSchema,
    previewAppMenuSchema,
    seralizeAppMenuSchema,
};
