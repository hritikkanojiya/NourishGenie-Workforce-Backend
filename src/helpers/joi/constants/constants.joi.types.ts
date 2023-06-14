import mongoose from 'mongoose';
import { MetaDataResponse, QuerySchemaType } from '../../shared/shared.type';

export interface AppConstantsType {
    _id?: mongoose.Types.ObjectId;
    appConstantId?: mongoose.Types.ObjectId;
    name?: string;
    value?: any,
    isAutoLoad?: boolean,
    isDeleted?: boolean;
    __v?: number;
    createdAt?: Date;
    updatedAt?: Date;
    isAdded?: boolean;
    updateOne?: any;
}

export interface CreateAppConstantsType {
    name: string;
    value: any,
    isAutoLoad: boolean,
    isDeleted?: boolean;
}

export interface GetAppConstantsType {
    appConstantId: mongoose.Types.ObjectId | null;
    search: string | null;
    isAutoLoad: boolean | null;
    metaData: MetaDataResponse;
}

export interface DeleteAppConstantsType {
    appConstantIds: mongoose.Types.ObjectId[];
}

export interface UpdateAppConstantsType {
    appConstantId: mongoose.Types.ObjectId;
    name: string;
    value: any,
    isAutoLoad: boolean,
}

export interface GetAppDepartmentQueryType extends QuerySchemaType {
    isAutoLoad?: boolean,
    $or?: Array<mongoose.FilterQuery<AppConstantsType>>;

}
