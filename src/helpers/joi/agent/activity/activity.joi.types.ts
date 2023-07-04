import mongoose from 'mongoose'


export interface AppUserActivityType {
    email?: string;
    fullname?: string;
    activities?: [{
        activity: string;
        time: string;
    }]
    date?: string;
    isDeleted?: boolean;
    __v?: number;
    createdAt?: Date;
    updatedAt?: Date;
    updateOne?: any;
}

export interface CreateUserActivityLogsType {
    email: string,
    fullName: string,
    activity: string
}

export interface GetTotalUserActivityType {
    email: string
}

export interface GetUserActivityType {
    email: string,
    date: {
        to: Date,
        from: Date
    }
}

export interface UserLastActivityType {
    email: string,
    date: string,
}

export interface GetUsersActivityType {
    employeeType: string,
    search: string;
}

export interface GetUserActivityQueryType {
    createdAt?: object;
    $or?: Array<mongoose.FilterQuery<AppUserActivityType>>;
}