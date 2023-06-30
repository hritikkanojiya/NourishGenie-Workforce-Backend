import { MetaDataResponse, QuerySchemaType } from '../../../shared/shared.type';
import mongoose from 'mongoose';

export interface AppSmartFunctionType {
    _id?: mongoose.Types.ObjectId;
    name?: string;
    description?: string;
    parameters?: {
        paramterName: string;
        required: boolean
    }[] | null;
    isDeleted?: boolean;
    __v?: number;
    updateOne?: any
}

export interface CreateAppSmartFunctionType {
    name: string;
    description: string;
    parameters: {
        paramterName: string;
        required: boolean
    }[] | null;
    isDeleted: boolean;
};

export interface GetAppSmartFunctionType {
    appSmartFunctionId: mongoose.Types.ObjectId;
    search: string;
    metaData: MetaDataResponse;
    isDeleted: boolean;
};

export interface UpadteAppSmartFunctionType {
    appSmartFunctionId: mongoose.Types.ObjectId;
    name: string;
    description: string;
    parameters: {
        paramterName: string;
        required: boolean
    }[] | null;
    isDeleted: boolean;
};

export interface DeleteAppSmartFunctionType {
    appSmartFunctionIds: mongoose.Types.ObjectId[];
};

export interface GetAppSmartFunctionQueryType extends QuerySchemaType {
    $or?: Array<mongoose.FilterQuery<AppSmartFunctionType>>;
}
