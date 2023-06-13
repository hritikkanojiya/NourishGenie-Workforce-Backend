import mongoose from 'mongoose';
import { QuerySchemaType, MetaDataResponse } from '../../../shared/shared.type';

export interface CreateAppServiceRouteType {
    path: string;
    type: string;
    method: string;
    secure: boolean;
    appAccessGroupIds: mongoose.Types.ObjectId[];
    isDeleted: boolean;
}


export interface AppServiceRouteType {
    _id?: mongoose.Types.ObjectId;
    appRouteId?: mongoose.Types.ObjectId;
    method?: string;
    type?: string;
    path?: string;
    secure?: boolean;
    appAccessGroupIds?: mongoose.Types.ObjectId[];
    isDeleted?: boolean;
    __v?: number;
    createdAt?: Date;
    updatedAt?: Date;
    isAdded?: boolean;
    updateOne?: any;
}

export interface GetAppServiceRouteType {
    appRouteId: mongoose.Types.ObjectId;
    method: string;
    type: string;
    search: string;
    secure: boolean;
    appAccessGroupIds: mongoose.Types.ObjectId[];
    checkAppAccessGroupIds: mongoose.Types.ObjectId[];
    isDeleted: boolean;
    metaData: MetaDataResponse;
}

export interface UpdateAppServiceRouteType {
    appRouteId: mongoose.Types.ObjectId;
    path: string;
    method: string;
    type: string;
    search: string;
    secure: boolean;
    appAccessGroupIds: mongoose.Types.ObjectId[];
    isDeleted: boolean;
}

export interface DeleteAppServiceRouteType {
    appRouteIds: mongoose.Types.ObjectId[];
}

export interface ToggleGroupType {
    appRouteId: mongoose.Types.ObjectId;
    appAccessGroupIds: mongoose.Types.ObjectId[];
    toggleAction: string;
}

export interface AppServiceRouteQuery extends QuerySchemaType {
    method?: string;
    type?: string;
    secure?: boolean;
    $or?: Array<mongoose.FilterQuery<AppServiceRouteType>>;
}

