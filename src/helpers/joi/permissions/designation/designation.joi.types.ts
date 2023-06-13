import mongoose from 'mongoose';
import { MetaDataResponse, QuerySchemaType } from '../../../shared/shared.type';

export interface AppDesignationType {
  _id?: mongoose.Types.ObjectId;
  appDesignationId?: mongoose.Types.ObjectId;
  name?: string;
  description?: string;
  isDeleted?: boolean;
  __v?: number;
  createdAt?: Date;
  updatedAt?: Date;
  isAdded?: boolean;
  updateOne?: any;
}

export interface CreateAppDesignationType {
  name: string;
  description: string;
}
export interface GetAppDesignationType {
  appDesignationId: mongoose.Types.ObjectId | null;
  search: string | null;
  metaData: MetaDataResponse;
}

export interface DeleteAppDesignationType {
  appDesignationIds: mongoose.Types.ObjectId[];
}

export interface UpdateAppDesignationType {
  appDesignationId: mongoose.Types.ObjectId;
  name: string;
  description: string;
}

export interface GetSingleDesignation {
  appDesignationId: mongoose.Types.ObjectId;
}

export interface GetAppDesignationQueryType extends QuerySchemaType {
  $or?: Array<mongoose.FilterQuery<AppDesignationType>>;
};