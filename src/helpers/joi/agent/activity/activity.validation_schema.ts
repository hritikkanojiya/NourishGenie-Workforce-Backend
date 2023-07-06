import joi from 'joi';
import joiObjectId from 'joi-objectid';
import moment from 'moment';
const objectId = joiObjectId(joi);

const getUserActivitySchema = joi.object({
    email: joi.string().trim().email().lowercase().allow(null).default(null),
    date: joi.object().keys({
        to: joi
            .date()
            .empty('')
            .default(moment().add(1, 'days').format('DD-MM-YYYY')),
        from: joi.date().empty('').default(moment().format('DD-MM-YYYY'))
    }).allow(null).default(null),
    search: joi.string().trim().allow(null).default(null),
    metaData: joi.object().keys({
        sortBy: joi.string().trim().allow(null).default(null),
        sortOn: joi.string().trim().allow(null).default(null),
        limit: joi.number().allow(null).default(null),
        offset: joi.number().allow(null).default(null),
        fields: joi.array().unique().allow(null).default(null)
    })
});

const updateUserAttandenceSchema = joi.object({
    appUserId: objectId().required(),
    email: joi.string().trim().email().lowercase().required(),
    status: joi.string().trim().valid('PRESENT', 'ABSENT').required(),
    date: joi.string().required(),
});


const createActivityLogsSchema = joi.object({
    email: joi.string().trim().email().lowercase().required(),
    fullName: joi.string().required(),
    activity: joi.string().required()
});

const getUserMonthActivitySchema = joi.object({
    email: joi.string().trim().email().lowercase().required(),
});

const UserLastActivitySchema = joi.object({
    email: joi.string().trim().email().lowercase().required(),
    date: joi.string().required(),
});

const getUserWorkingStatusSchema = joi.object({
    employeeType: joi.string().trim().allow(null).default(null),
    search: joi.string().trim().allow(null).default(null)
})

export {
    getUserActivitySchema,
    updateUserAttandenceSchema,
    createActivityLogsSchema,
    getUserMonthActivitySchema,
    UserLastActivitySchema,
    getUserWorkingStatusSchema
}