import mongoose from 'mongoose';
import { QuerySchemaType, MetaDataResponse } from '../../../shared/shared.type';


export interface AppAccessGroupType {
  _id?: mongoose.Types.ObjectId;
  appAccessGroupId?: mongoose.Types.ObjectId;
  isAdministrative?: boolean;
  isDeleted?: boolean;
  __v?: number;
  createdAt?: Date;
  updatedAt?: Date;
  isAdded?: boolean;
  updateOne?: any;
}

export interface CreateAppAccessGroupType {
  name: string;
  description: string;
  isAdministrator: boolean;
  isDeleted?: boolean;
}

export interface GetAppAccessGroupType {
  appAccessGroupId: mongoose.Types.ObjectId | null;
  isAdministrator: boolean | null;
  search: string | null;
  metaData: MetaDataResponse;
}

export interface UpdateAppAccessGroupType {
  appAccessGroupId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  isAdministrator: boolean;
}

export interface DeleteAppAccessGroupType {
  appAccessGroupIds: mongoose.Types.ObjectId[];
}

export interface GetAccessGroupQueryType extends QuerySchemaType {
  isAdministrator?: boolean;
  $or?: Array<mongoose.FilterQuery<AppAccessGroupType>>;
};