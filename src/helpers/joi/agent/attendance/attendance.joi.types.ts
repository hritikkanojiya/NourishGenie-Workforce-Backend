import { QuerySchemaType } from '../../../shared/shared.type';
import mongoose from 'mongoose';
export interface UserAttendanceType {
    _id?: mongoose.Types.ObjectId;
    appUserId?: mongoose.Types.ObjectId;
    email?: string;
    status?: string;
    availability?: string;
    date?: Date;
    isDeleted?: boolean;
    __v?: number;
}

export interface UpdateUserAttendanceType {
    appUserAttendanceId: mongoose.Types.ObjectId;
    appUserId: mongoose.Types.ObjectId;
    email: string;
    status: string;
    availability: string;
    isDeleted: boolean;
}

export interface GetUsersMonthAttendanceType {
    search: string;
    month: string;
    year: string;
}

export interface GetUsersMonthAttendanceQueryType extends QuerySchemaType {
    createdAt?: object;
    $or?: Array<mongoose.FilterQuery<UserAttendanceType>>;
}

export interface GetUserAttendanceType {
    appUserId: mongoose.Types.ObjectId;
    search: string;
    month: string;
    year: string;
}

export interface GetUserAttendanceQueryType extends QuerySchemaType {
    appUserId?: mongoose.Types.ObjectId;
    createdAt?: object;
    $or?: Array<mongoose.FilterQuery<UserAttendanceType>>;
}