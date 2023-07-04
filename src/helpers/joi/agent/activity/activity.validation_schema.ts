import joi from 'joi';
import joiObjectId from 'joi-objectid';
import moment from 'moment';
const objectId = joiObjectId(joi);

const getAgentActivitySchema = joi.object({
    email: joi.string().trim().email().lowercase().required(),
    date: joi.object().keys({
        to: joi
            .date()
            .empty('')
            .default(moment().add(1, 'days').format('DD-MM-YYYY')),
        from: joi.date().empty('').default(moment().format('DD-MM-YYYY'))
    })
});

const updateAgentAttandenceSchema = joi.object({
    appAgentId: objectId().required(),
    email: joi.string().trim().email().lowercase().required(),
    status: joi.string().trim().valid('PRESENT', 'ABSENT').required(),
    date: joi.string().required(),
});


const createActivityLogsSchema = joi.object({
    email: joi.string().trim().email().lowercase().required(),
    fullName: joi.string().required(),
    activity: joi.string().required()
});

const getAgentMonthActivitySchema = joi.object({
    email: joi.string().trim().email().lowercase().required(),
});

const agentLastActivitySchema = joi.object({
    email: joi.string().trim().email().lowercase().required(),
    date: joi.string().required(),
});

const getUserActivitySchema = joi.object({
    employeeType: joi.string().trim().allow(null).default(null),
    search: joi.string().trim().allow(null).default(null)
})

export {
    getAgentActivitySchema,
    updateAgentAttandenceSchema,
    createActivityLogsSchema,
    getAgentMonthActivitySchema,
    agentLastActivitySchema,
    getUserActivitySchema
}