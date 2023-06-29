import mongoose from 'mongoose'


export interface AppAgentActivity {
    email?: string;
    fullname?: string;
    activities?: {
        activity: string;
        time: string;
    }
    date?: string;
    isDeleted?: boolean;
    __v?: number;
    createdAt?: Date;
    updatedAt?: Date;
    updateOne?: any;
}

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

export interface UpdateAgentAttandenceType {
    appAgentId: mongoose.Types.ObjectId,
    email: string,
    availability: string,
    status: string,
    date: string,
}

export interface AgentLastActivityType {
    email: string,
    date: string,
}

export interface AgentActivityType {
    email: string;
    date: string;
    fullname: string;
    activities: {
        activity?: string;
        time?: string;
    }[];
    createdAt: Date;
    updatedAt: Date;

}

export interface GetUserActivityType {
    employeeType: string,
    search: string;
}

export interface GetUserActivityQueryType {
    date?: string;
    $or?: Array<mongoose.FilterQuery<AgentActivityType>>;
}