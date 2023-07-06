import { MetaDataResponse, QuerySchemaType } from '../../../shared/shared.type';
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
    search: string;
    metaData: MetaDataResponse
}

export interface UserLastActivityType {
    email: string,
    date: string,
}

export interface GetUserWorkingStatusType {
    employeeType: string,
    search: string;
}

export interface GetUserWorkingStatusQueryType {
    createdAt?: object;
    $or?: Array<mongoose.FilterQuery<AppUserActivityType>>;
}

export interface GetUserActivityQueryType extends QuerySchemaType {
    createdAt?: object
    email?: string;
    $or?: Array<mongoose.FilterQuery<AppUserActivityType>>;
}