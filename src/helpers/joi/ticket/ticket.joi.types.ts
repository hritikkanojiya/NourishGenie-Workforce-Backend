import mongoose from 'mongoose'

interface CreateTicketSchemaType {
    From: string,
    To: string[],
    subject: string,
    content: string,
    appTicketPriorityId: mongoose.Types.ObjectId,
    appTicketCategoryId: mongoose.Types.ObjectId,
    file_id: mongoose.Types.ObjectId
}
interface ChangeAssignerSchemaType {
    ticket_id: string,
    removalUser: string,
    assignedNext: string
}

interface UpdatePrioritySchemaType {
    ticket_id: mongoose.Types.ObjectId,
    priorityId: mongoose.Types.ObjectId,
}

interface UpdateStatusSchemaType {
    ticket_id: mongoose.Types.ObjectId,
    statusId: mongoose.Types.ObjectId,
}

interface UpdateTicketCompletionSchemaType {
    ticket_id: string,
    completionPercent: number
}

interface AddUserSchemaType {
    ticket_id: mongoose.Types.ObjectId,
    addedUsersIds: mongoose.Types.ObjectId[]
}

interface chatUserSchemaType {
    ticket_id: mongoose.Types.ObjectId,
    content: string,
    chatBy: mongoose.Types.ObjectId,
    filename?: string
}

interface TransferTicketSchemaType {
    ticket_id: mongoose.Types.ObjectId,
    transferBy: mongoose.Types.ObjectId,
    transferTo: mongoose.Types.ObjectId,
}

interface CreateTicketPrioritySchemaType {
    name: string,
    color: string,
    description: string
}

interface CreateTicketStatusSchemaType {
    name: string,
    color: string,
    description: string
}

interface CreateTicketCategoriesSchemaType {
    name: string,
    description: string
}

interface CreateTicketTypeSchemaType {
    name: string,
    description: string
}

interface GetTicketDetailsSchemaType {
    ticket_id: string,
    userId: string
}

interface UploadFileSchemaType {
    From: mongoose.Types.ObjectId
}

interface GetAllTicketSchemaType {
    From: mongoose.Types.ObjectId,
    page: number,
    limit: number,
    sortOn: string,
    sortBy: string
}

interface GetAllCategoryTicketSchemaType {
    From: mongoose.Types.ObjectId,
    ticketPriorityId: mongoose.Types.ObjectId,
    ticketStatusId: mongoose.Types.ObjectId,
    page: number,
    limit: number
}

interface GetAllSearchTicketSchemaType {
    From: mongoose.Types.ObjectId,
    searchValue: string,
    page: number,
    limit: number
}

export {
    CreateTicketSchemaType,
    ChangeAssignerSchemaType,
    UpdatePrioritySchemaType,
    UpdateStatusSchemaType,
    UpdateTicketCompletionSchemaType,
    AddUserSchemaType,
    chatUserSchemaType,
    TransferTicketSchemaType,
    CreateTicketPrioritySchemaType,
    CreateTicketStatusSchemaType,
    CreateTicketCategoriesSchemaType,
    CreateTicketTypeSchemaType,
    GetTicketDetailsSchemaType,
    UploadFileSchemaType,
    GetAllCategoryTicketSchemaType,
    GetAllSearchTicketSchemaType,
    GetAllTicketSchemaType
};
