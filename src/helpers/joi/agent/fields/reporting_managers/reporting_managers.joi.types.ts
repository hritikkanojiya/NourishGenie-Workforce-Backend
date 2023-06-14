import mongoose from 'mongoose';
import { MetaDataResponse, QuerySchemaType } from '../../../../shared/shared.type';

export interface AppReportingManagerType {
  _id?: mongoose.Types.ObjectId;
  appManagerId?: mongoose.Types.ObjectId;
  appAgentId?: mongoose.Types.ObjectId;
  isDeleted?: boolean;
  __v?: number;
  createdAt?: Date;
  updatedAt?: Date;
  isAdded?: boolean;
  updateOne?: any;
}

export interface CreateAppReportingManagerType {
  appAgentId: mongoose.Types.ObjectId;
  isDeleted: boolean;
}

export interface GetAppReportingManagerType {
  appManagerId: mongoose.Types.ObjectId | null;
  appAgentId: mongoose.Types.ObjectId | null;
  search: string | null;
  metaData: MetaDataResponse;
}

export interface UpdateAppReportingManagerType {
  appManagerId: mongoose.Types.ObjectId;
  appAgentId: mongoose.Types.ObjectId;
  isDeleted: boolean;
}

export interface DeleteAppReportingManagerType {
  appManagerIds: mongoose.Types.ObjectId;
}

export interface GetAppReportingManagerQueryType extends QuerySchemaType {
  appAgentId?: mongoose.Types.ObjectId;
  $or?: Array<mongoose.FilterQuery<AppReportingManagerType>>;
}
