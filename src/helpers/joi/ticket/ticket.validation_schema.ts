// Import Packages
import joi from 'joi';
import joiObjectId from 'joi-objectid';
const objectId = joiObjectId(joi);


// Define Joi Validation Schema
const createTicketSchema = joi.object({
    subject: joi
        .string()
        .trim()
        .min(3)
        .max(20)
        .required(),
    content: joi.
        string()
        .allow('')
        .allow(null),
    html: joi
        .string()
        .trim()
        .min(1),
    completedPercent: joi
        .number()
        .valid(0, 25, 50, 75, 100)
        .default(0),
    From: joi
        .string()
        .trim()
        .required(),
    To: joi
        .array()
        .required()
        .unique(),
    appTicketPriorityId: objectId().required(),
    appTicketCategoryId: objectId().required(),
    file_id: objectId(),
});

const userSchema = joi.object({
    userId: joi
        .string()
        .trim()
        .email()
        .lowercase()
        .required()
});

const changeAssignerSchema = joi.object({
    ticket_id: joi
        .string()
        .trim()
        .min(1)
        .required(),
    removalUser: joi
        .string()
        .trim()
        .required(),
    assignedNext: joi
        .string()
        .trim()
        .required(),
});

const updatePrioritySchema = joi.object({
    ticket_id: objectId().required(),
    priorityId: objectId().required()
});

const updateStatusSchema = joi.object({
    ticket_id: objectId().required(),
    statusId: objectId().required()
});

const updateTicketCompletionSchema = joi.object({
    ticket_id: objectId().required(),
    completionPercent: joi.number().required()
});

const addUserSchema = joi.object({
    ticket_id: objectId().required(),
    addedUsersIds: joi.array().unique().items(objectId()).required()
});

const transferTicketSchema = joi.object({
    ticket_id: objectId().required(),
    transferBy: objectId().required(),
    transferTo: objectId().required()
});

const chatUserSchema = joi.object({
    ticket_id: objectId().required(),
    content: joi.string().trim().required(),
    chatBy: joi.string().trim().email().lowercase().required(),
    filename: joi.string().trim().required(),
});

const priorityTableSchema = joi.object({
    name: joi
        .string()
        .trim()
        .min(1)
        .required(),
    description: joi
        .string()
        .trim()
        .min(1)
        .required(),
    color: joi
        .string()
        .trim()
        .lowercase()
        .required()
});

const createTicketStatusSchema = joi.object({
    name: joi
        .string()
        .trim()
        .min(1)
        .required(),
    description: joi
        .string()
        .trim()
        .min(1)
        .required(),
    color: joi
        .string()
        .trim()
        .lowercase()
        .required()
});

const createTicketCategoriesSchema = joi.object({
    name: joi
        .string()
        .trim()
        .min(1)
        .required(),
    description: joi
        .string()
        .trim()
        .min(1)
        .required()
});

const createTicketTypeSchema = joi.object({
    name: joi
        .string()
        .trim()
        .min(1)
        .required()
});

const getTicketDetailsSchema = joi.object({
    ticket_id: objectId().required(),
    userId: objectId().required()
});

const uploadFileSchema = joi.object({
    From: objectId().required()
});

const getAllTicketSchema = joi.object({
    From: objectId().required(),
    page: joi
        .number()
        .required(),
    limit: joi
        .number()
        .required(),
    sortOn: joi
        .string()
        .trim()
        .allow(null),
    sortBy: joi
        .string()
        .trim()
        .allow(null)
});

const getAllCategoryTicketSchema = joi.object({
    From: objectId().required(),
    ticketPriorityId: joi.allow(null),
    ticketStatusId: joi.allow(null),
    page: joi
        .number()
        .required(),
    limit: joi
        .number()
        .required()
});

const getAllMySortTicketSchema = joi.object({
    To: objectId().required(),
    ticketPriorityId: joi.allow(null),
    ticketStatusId: joi.allow(null),
    page: joi
        .number()
        .required(),
    limit: joi
        .number()
        .required()
});

const getAllSearchTicketSchema = joi.object({
    To: objectId().required(),
    searchValue: joi
        .string()
        .trim()
        .min(1)
        .required(),
    page: joi
        .number()
        .required(),
    limit: joi
        .number()
        .required()
});

const getAllSearchMyTicketSchema = joi.object({
    To: objectId().required(),
    searchValue: joi
        .string()
        .trim()
        .min(1)
        .required(),
    page: joi
        .number()
        .required(),
    limit: joi
        .number()
        .required()
});

// Export schema
export {
    updateStatusSchema,
    createTicketSchema,
    userSchema,
    changeAssignerSchema,
    chatUserSchema,
    transferTicketSchema,
    addUserSchema,
    updatePrioritySchema,
    createTicketStatusSchema,
    updateTicketCompletionSchema,
    priorityTableSchema,
    createTicketCategoriesSchema,
    createTicketTypeSchema,
    getTicketDetailsSchema,
    uploadFileSchema,
    getAllCategoryTicketSchema,
    getAllMySortTicketSchema,
    getAllSearchTicketSchema,
    getAllSearchMyTicketSchema,
    getAllTicketSchema

};