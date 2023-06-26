import mongoose from 'mongoose';

interface CreateFileType {
  directory: string;
  appAgentId: mongoose.Types.ObjectId;
  aadhar_number: string;
  pan_number: string
}

interface DeleteFileType {
  // appAgentId: mongoose.Types.ObjectId | null;
  aadhar_cardId: mongoose.Types.ObjectId | null;
  pan_cardId: mongoose.Types.ObjectId | null;
  profile_pictureId: mongoose.Types.ObjectId | null;
  otherFilesId: mongoose.Types.ObjectId | null;
}

interface DeleteFileType {
  // appAgentId: mongoose.Types.ObjectId | null;
  aadhar_cardId: mongoose.Types.ObjectId | null;
  pan_cardId: mongoose.Types.ObjectId | null;
  profile_pictureId: mongoose.Types.ObjectId | null;
  otherFilesId: mongoose.Types.ObjectId | null;
}

interface GetFileType {
  appAgentId: mongoose.Types.ObjectId;
}

interface GetProfilePictureType {
  appAgentId: mongoose.Types.ObjectId;
}

interface File {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  destination: string;
  filename: string;
  path: string;
  size: number;
}

export interface UploadedFilesTypes {
  profile_picture: File[];
  aadhar_card: File[];
  pan_card: File[];
  otherFiles: File[];
}

interface UpdateFilesType {
  appAgentId: mongoose.Types.ObjectId;
  directory: string;
  profile_pictureId: mongoose.Types.ObjectId | null;
  aadhar_cardId: mongoose.Types.ObjectId | null;
  pan_cardId: mongoose.Types.ObjectId | null;
  otherFilesId: mongoose.Types.ObjectId | null;
}
interface UpdatedFilesType {
  profile_picture: File[];
  aadhar_card: File[];
  pan_card: File[];
  otherFiles: File[];
}


interface UploadSingleFileType {
  appAgentId: mongoose.Types.ObjectId;
  directory: string;
}

interface UploadedSingleFileType {
  profile_picture: File[];
  aadhar_card: File[];
  pan_card: File[];
  otherFiles: File[];
}

export {
  DeleteFileType,
  GetFileType,
  GetProfilePictureType,
  UpdateFilesType,
  UpdatedFilesType,
  CreateFileType,
  UploadSingleFileType,
  UploadedSingleFileType
};
