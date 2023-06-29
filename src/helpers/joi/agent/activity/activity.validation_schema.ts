import joi from 'joi';
import joiObjectId from 'joi-objectid';
import moment from 'moment';
const objectId = joiObjectId(joi);

export const getAgentActivitySchema = joi.object({
    email: joi.string().trim().email().lowercase().required(),
    date: joi.object().keys({
        to: joi
            .date()
            .empty('')
            .default(moment().add(1, 'days').format('DD-MM-YYYY')),
        from: joi.date().empty('').default(moment().format('DD-MM-YYYY'))
    })
});

export const updateAgentAttandenceSchema = joi.object({
    appAgentId: objectId().required(),
    email: joi.string().trim().email().lowercase().required(),
    status: joi.string().trim().valid('PRESENT', 'ABSENT').required(),
    date: joi.string().required(),
});


export const markAttandanceSchema = joi.object({
    email: joi.string().trim().email().lowercase().required(),
    fullName: joi.string().required(),
    activity: joi.string().required()
});

export const getTotalAgentActivity = joi.object({
    email: joi.string().trim().email().lowercase().required(),
});

export const agentLastActivitySchema = joi.object({
    email: joi.string().trim().email().lowercase().required(),
    date: joi.string().required(),
});

export const getUserActivitySchema = joi.object({
    employeetype: joi.string().trim().allow(null).default(null),
    search: joi.string().trim().allow(null).default(null)
})