import { Request } from 'express';
import mongoose from 'mongoose';

export interface ErrorResponse {
  error: {
    status: number;
    message: string;
  };
}

export interface MetaDataResponse {
  sortBy: string | null;
  sortOn: string | null;
  limit: number | null;
  offset: number | null;
  fields: string[] | null;
}

export interface MetaDataBody {
  sortBy: 'asc' | 'desc';
  sortOn: string;
  limit: number;
  offset: number;
  fields: string[];
}
export interface QuerySchemaType {
  _id?: mongoose.Types.ObjectId;
  isDeleted?: boolean;
}
export interface GetRequestObject {
  metaData: MetaDataResponse;
  message: string;
}

interface PayloadData {
  requestIP: string,
  appAgentId: string,
  appAccessGroupId: string
}

export interface RequestType extends Request {
  payload?: PayloadData
}