import joi from 'joi';

export const getStatesSchema = joi.object({
    country_id: joi.string().trim().required()
})

export const getCitiesSchema = joi.object({
    state_id: joi.string().trim().required()
})