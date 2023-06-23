import mongoose from 'mongoose';

export interface CreateAttandenceType {
    appAgentId: mongoose.Types.ObjectId;
    availability: string;
    status: string;
    date: Date;
    isDeleted: boolean;
}

export interface updateAttandenceType {
    appAttandenceId: mongoose.Types.ObjectId;
    appAgentId: mongoose.Types.ObjectId;
    availability: string;
    date: Date;
    status: string
}