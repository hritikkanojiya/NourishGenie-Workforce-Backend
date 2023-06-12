interface DeleteAppUserFileType {
  appUserId: string | null;
  aadhar_cardId: string | null;
  pan_cardId: string | null;
  profile_pictureId: string | null;
  documentId: string | null;
}

interface GetAppUserFileType {
  appUserId: string;
}

interface GetSingleFileType {
  attatchmentId: string;
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

interface UpdatedFilesId {
  appUserId: string;
  profile_pictureId: string | null;
  aadhar_cardId: string | null;
  pan_cardId: string | null;
  documentId: string | null;
}
interface UpdatedFiles {
  profile_picture: File[] | null;
  aadhar_card: File[] | null;
  pan_card: File[] | null;
  documents: File[] | null;
}
export { DeleteAppUserFileType, GetAppUserFileType, GetSingleFileType, UpdatedFilesId, UpdatedFiles };
