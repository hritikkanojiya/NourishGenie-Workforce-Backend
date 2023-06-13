import mongoose from 'mongoose';
import { MetaDataResponse, QuerySchemaType } from '../../../shared/shared.type';

export interface AppDepartmentType {
  _id?: mongoose.Types.ObjectId;
  appDepartmentId?: mongoose.Types.ObjectId;
  name?: string;
  description?: string;
  isDeleted?: boolean;
  __v?: number;
  createdAt?: Date;
  updatedAt?: Date;
  isAdded?: boolean;
  updateOne?: any;
}

export interface CreateAppDepartmentType {
  name: string;
  description: string;
}

export interface GetAppDepartmentType {
  appDepartmentId: mongoose.Types.ObjectId | null;
  search: string | null;
  metaData: MetaDataResponse;
}

export interface DeleteAppDepartmentType {
  appDepartmentIds: mongoose.Types.ObjectId[];
}

export interface UpdateAppDepartmentType {
  appDepartmentId: mongoose.Types.ObjectId;
  name: string;
  description: string;
}

export interface GetSingleDepartment {
  appDepartmentId: mongoose.Types.ObjectId;
}
export interface GetAppDepartmentQueryType extends QuerySchemaType {
  $or?: Array<mongoose.FilterQuery<AppDepartmentType>>;

}
