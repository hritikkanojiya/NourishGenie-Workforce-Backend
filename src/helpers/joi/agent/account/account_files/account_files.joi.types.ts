import mongoose from 'mongoose';

interface CreateFileType {
  directory: string;
  appAgentId: mongoose.Types.ObjectId;
  aadhar_number: string;
  pan_number: string
}

interface DeleteAppUserFileType {
  // appAgentId: mongoose.Types.ObjectId | null;
  aadhar_cardId: mongoose.Types.ObjectId | null;
  pan_cardId: mongoose.Types.ObjectId | null;
  profile_pictureId: mongoose.Types.ObjectId | null;
  documentId: mongoose.Types.ObjectId | null;
}

interface GetAppUserFileType {
  appAgentId: mongoose.Types.ObjectId;
}

interface GetSingleFileType {
  attachmentId: mongoose.Types.ObjectId;
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
  documents: File[];
}

interface UpdateFilesType {
  appAgentId: mongoose.Types.ObjectId;
  directory: string;
  profile_pictureId: mongoose.Types.ObjectId | null;
  aadhar_cardId: mongoose.Types.ObjectId | null;
  pan_cardId: mongoose.Types.ObjectId | null;
  documentId: mongoose.Types.ObjectId | null;
}
interface UpdatedFilesType {
  profile_picture: File[];
  aadhar_card: File[];
  pan_card: File[];
  documents: File[];
}
export { DeleteAppUserFileType, GetAppUserFileType, GetSingleFileType, UpdateFilesType, UpdatedFilesType, CreateFileType };
