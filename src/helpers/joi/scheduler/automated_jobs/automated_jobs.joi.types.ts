import { MetaDataResponse, QuerySchemaType } from '../../../shared/shared.type';
import mongoose from 'mongoose';


export interface AppAutomatedJobType {
    _id?: mongoose.Types.ObjectId;
    appAutomatedJobId?: mongoose.Types.ObjectId;
    appCronExpressionId?: mongoose.Types.ObjectId;
    appSmartFunctionId?: mongoose.Types.ObjectId;
    name?: string;
    parameters?: string[];
    description?: string;
    isActive?: boolean;
    isDeleted?: boolean;
    __v?: number;
    updateOne?: any
}

export interface AppAutomatedJobLogsType {
    _id?: mongoose.Types.ObjectId;
    appAutomatedJobLogsId?: mongoose.Types.ObjectId;
    appAutomatedJobId?: mongoose.Types.ObjectId;
    type?: string;
    description?: string;
    scriptPath?: string | null
    methodName?: string | null
    isDeleted?: boolean;
    __v?: number;
}

export interface CreateAppAutomatedJobType {
    appCronExpressionId: mongoose.Types.ObjectId;
    appSmartFunctionId: mongoose.Types.ObjectId;
    parameters: object;
    name: string;
    description: string;
    isActive: boolean;
    isDeleted: boolean;
};

export interface GetAppAutomatedJobType {
    appAutomatedJobId: mongoose.Types.ObjectId;
    appCronExpressionId: mongoose.Types.ObjectId;
    appSmartFunctionId: mongoose.Types.ObjectId;
    search: string;
    isActive: boolean;
    metaData: MetaDataResponse;
    isDeleted: boolean;
};

export interface UpadteAppAutomatedJobType {
    appAutomatedJobId: mongoose.Types.ObjectId
    appCronExpressionId: mongoose.Types.ObjectId;
    appSmartFunctionId: mongoose.Types.ObjectId;
    parameters: object;
    name: string;
    description: string;
    isActive: boolean;
    isDeleted: boolean;
};

export interface DeleteAppAutomatedJobType {
    appAutomatedJobIds: mongoose.Types.ObjectId[];
};

export interface ToggleAppAutomatedJobType {
    appAutomatedJobIds: mongoose.Types.ObjectId[];
    isActive: boolean;
}
export interface ForceExecuteAutomatedJobType {
    appAutomatedJobIds: mongoose.Types.ObjectId[];
};

export interface ReadAppAutomatedJobLogsType {
    appAutomatedJobId: mongoose.Types.ObjectId;
    metaData: MetaDataResponse
};

export interface ReadAppAutomatedJobLogsQueryType extends QuerySchemaType {
    appAutomatedJobId?: mongoose.Types.ObjectId;
    $or?: Array<mongoose.FilterQuery<AppAutomatedJobLogsType>>;
};

export interface GetAppAutomatedJobQueryType extends QuerySchemaType {
    appAutomatedJobId?: mongoose.Types.ObjectId;
    appCronExpressionId?: mongoose.Types.ObjectId;
    appSmartFunctionId?: mongoose.Types.ObjectId;
    isActive?: boolean;
    $or?: Array<mongoose.FilterQuery<AppAutomatedJobType>>;
}
