import { MetaDataResponse, QuerySchemaType } from '../../../shared/shared.type';
import mongoose from 'mongoose';


export interface AppCronExpressionType {
    _id?: mongoose.Types.ObjectId;
    name?: string;
    description?: string;
    expression?: string;
    isDeleted?: boolean;
    __v?: number;
    updateOne?: any
}

export interface CreateAppCronExpressionType {
    name: string;
    description: string;
    expression: string;
    isDeleted: boolean;
};

export interface GetAppCronExpressionType {
    appCronExpressionId: mongoose.Types.ObjectId;
    expression: string;
    search: string;
    metaData: MetaDataResponse;
    isDeleted: boolean;
};

export interface UpadteAppCronExpressionType {
    appCronExpressionId: mongoose.Types.ObjectId;
    name: string;
    description: string;
    expression: string;
    isDeleted: boolean;
};

export interface DeleteAppCronExpressionType {
    appCronExpressionIds: mongoose.Types.ObjectId[];
};

export interface GetAppCronExpressionQueryType extends QuerySchemaType {
    expression?: string;
    $or?: Array<mongoose.FilterQuery<AppCronExpressionType>>;
}
