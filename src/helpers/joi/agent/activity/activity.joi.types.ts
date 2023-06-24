import mongoose from 'mongoose'

export interface MarkAttandanceType {
    email: string,
    fullName: string,
    activity: string
}

export interface GetTotalAgentActivityType {
    email: string
}

export interface GetAgentActivityType {
    email: string,
    date: {
        to: Date,
        from: Date
    }
}

export interface updateAgentAttandenceType {
    appAgentId: mongoose.Types.ObjectId,
    email: string,
    availability: string,
    status: string,
    date: string,
}