import joi from 'joi';
import joiObjectId from 'joi-objectid';
const objectId = joiObjectId(joi);

export const CreateFileSchema = joi.object({
  directory: joi.string().trim().required(),
  appAgentId: objectId().required(),
  aadhar_number: joi.string().trim().allow(null).default(null),
  pan_number: joi.string().trim().allow(null).default(null),
})

export const fileSchema = joi.object({
  fieldname: joi.string().required(),
  originalname: joi.string().required(),
  encoding: joi.string().required(),
  mimetype: joi.string().required(),
  destination: joi.string().required(),
  filename: joi.string().required(),
  path: joi.string().required(),
  size: joi.number().required()
});

export const uploadedFilesSchema = joi.object({
  profile_picture: joi.array().items(fileSchema).allow(null).default(null),
  aadhar_card: joi.array().items(fileSchema).allow(null).default(null),
  pan_card: joi.array().items(fileSchema).allow(null).default(null),
  otherFiles: joi.array().items(fileSchema).allow(null).default(null),
});

export const deleteAppUserFileSchema = joi.object({
  // appAgentId: objectId().required(),
  aadhar_cardId: objectId().allow(null),
  pan_cardId: objectId().allow(null),
  profile_pictureId: objectId().allow(null),
  otherFilesId: objectId().allow(null)
});

export const getAppUserFileSchema = joi.object({
  appAgentId: objectId().required()
});

export const getSingleFileSchema = joi.object({
  attachmentId: objectId().required()
});

export const updateAppUserFileSchema = joi.object({
  directory: joi.string().trim().required(),
  appAgentId: objectId().required(),
  profile_pictureId: objectId().allow(null),
  aadhar_cardId: objectId().allow(null),
  pan_cardId: objectId().allow(null),
  otherFilesId: objectId().allow(null),
  // encoding: joi.string().allow(null)
});

export const updatedFilesSchema = joi.object({
  profile_picture: joi.array().items(fileSchema),
  aadhar_card: joi.array().items(fileSchema),
  pan_card: joi.array().items(fileSchema),
  otherFiles: joi.array().items(fileSchema)
});
