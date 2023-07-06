import joi from 'joi';
import joiObjectId from 'joi-objectid';
const objectId = joiObjectId(joi);

const getUsersAttendanceSchema = joi.object({
    month: joi.string().trim().allow(null).default(null),
    year: joi.string().trim().allow(null).default(null),
    departmentName: joi.string().trim().allow(null).default(null),
    search: joi.string().trim().allow(null).default(null),
    metaData: joi.object().keys({
        sortBy: joi.string().trim().allow(null).default(null),
        sortOn: joi.string().trim().allow(null).default(null),
        limit: joi.number().allow(null).default(null),
        offset: joi.number().allow(null).default(null),
        fields: joi.array().unique().allow(null).default(null)
    })
})

const getUserAttendanceSchema = joi.object({
    appUserId: objectId().required(),
    search: joi.string().trim().allow(null).default(null),
    date: joi.string().trim().allow(null).default(null),
    year: joi.string().trim().allow(null).default(null),
})

const updateUserAttendanceSchema = joi.object({
    appUserAttendanceId: objectId().required(),
    appUserId: objectId().required(),
    email: joi.string().trim().required(),
    availability: joi.string().trim().required(),
    status: joi.string().trim().required(),
    isDeleted: joi.boolean().default(false)
})

export {
    updateUserAttendanceSchema,
    getUsersAttendanceSchema,
    getUserAttendanceSchema
}