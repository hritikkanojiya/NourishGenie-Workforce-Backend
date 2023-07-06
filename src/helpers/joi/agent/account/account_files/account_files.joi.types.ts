import mongoose from 'mongoose';

interface CreateFileType {
  directory: string;
  appUserId: mongoose.Types.ObjectId;
  aadhar_number: string;
  pan_number: string
}

interface DeleteFileType {
  // appUserId: mongoose.Types.ObjectId | null;
  aadhar_cardId: mongoose.Types.ObjectId | null;
  pan_cardId: mongoose.Types.ObjectId | null;
  profile_pictureId: mongoose.Types.ObjectId | null;
  otherFilesId: mongoose.Types.ObjectId | null;
}

interface DeleteFileType {
  // appUserId: mongoose.Types.ObjectId | null;
  aadhar_cardId: mongoose.Types.ObjectId | null;
  pan_cardId: mongoose.Types.ObjectId | null;
  profile_pictureId: mongoose.Types.ObjectId | null;
  otherFilesId: mongoose.Types.ObjectId | null;
}

interface GetFileType {
  appUserId: mongoose.Types.ObjectId;
}

interface GetProfilePictureType {
  appUserId: mongoose.Types.ObjectId;
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
  appUserId: mongoose.Types.ObjectId;
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
  appUserId: mongoose.Types.ObjectId;
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
