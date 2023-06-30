import joi from 'joi';
import joiObjectId from 'joi-objectid'
const objectId = joiObjectId(joi);

const createAppUserSalarySlipSchema = joi.object({
    appUserId: objectId().required(),
    incentive: joi.number().required(),
})

// Export schema
export {
    createAppUserSalarySlipSchema
};
