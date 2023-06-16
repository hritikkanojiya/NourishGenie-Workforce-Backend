import multer, { Multer } from 'multer';
import path from 'path';
import crypto from 'crypto';
import { Request } from 'express';
import dotenv from 'dotenv';
import fs from 'fs';
import bson from 'bson';
import { RequestType } from '../../helpers/shared/shared.type';
import { GlobalConfig } from '../../helpers/common/environment';
// import { appAgentFilesFolderModel } from '../../models/agent/agent_files_folder.model'
// import { objectIdToString } from '../../helpers/common/backend.functions';

dotenv.config();
function generateUniqueFileName(fileExtension: string): string {
  const timestamp = Date.now().toString();
  const randomBytes = crypto.randomBytes(8).toString('hex');
  const hash = crypto
    .createHash('sha1')
    .update(timestamp + randomBytes)
    .digest('hex');
  return `${hash}${fileExtension}`;
}
const FILE_UPLOAD_PATH: any = GlobalConfig.FILE_UPLOAD_PATH;
//make a new directory with the user's objectID inside the HR_Module_Files folder
const users: any = {};
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const makeDirectory = async (req: RequestType) => {
  //create a temporary objectID using bson
  const ObjectId = bson.ObjectId;

  let filesFolderName;

  if (!users['name']) {
    filesFolderName = new ObjectId()
    users['name'] = filesFolderName;
  }
  else {
    filesFolderName = users['name']
  }

  //create a new directory with the user's objectID
  const dir = `${FILE_UPLOAD_PATH}/${filesFolderName}`;
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir),
    {
      recursive: true
    };
  }
  //store the directory path in the request object
  req.body.directory = dir;
  return dir;
};

// Set the storage engine to save the files in the uploads folder
const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    const dir = await makeDirectory(_req);
    const documentsDir = `${dir}/documents`;
    if (!fs.existsSync(documentsDir)) {
      fs.mkdirSync(documentsDir),
      {
        recursive: true
      };
    }
    //make another sub directory named documents inside the user's directory
    cb(null, documentsDir);
  },

  filename: (_req, file, cb) => {
    const uniqueFileName = generateUniqueFileName(path.extname(file.originalname));
    cb(null, uniqueFileName);
  }
});

// Create the multer upload instance
const upload: Multer = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 25 // Set the file size limit to 25MB
  },
  fileFilter: (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedFileTypes = /\.(pdf|docx|txt|jpg|JPG|jpeg|JPEG|png|PNG|xlsx|pptx|ppt|csv)$/;

    if (!file.originalname.match(allowedFileTypes)) {
      // Return an error for unsupported file types
      cb(new Error('Only pdf|docx|txt|jpg|jpeg|png|xlsx|pptx|csv file types are allowed!') as any, false);
    } else {
      // Pass the file if it meets the requirements
      cb(null, true);
    }
  }
});

export default upload;
