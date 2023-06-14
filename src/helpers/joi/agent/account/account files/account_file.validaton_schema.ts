import Joi from 'joi';

export const deleteAppUserFileSchema = Joi.object({
  appAgentId: Joi.string().hex().length(24).required(),
  aadhar_cardId: Joi.string().hex().length(24).allow(null),
  pan_cardId: Joi.string().hex().length(24).allow(null),
  profile_pictureId: Joi.string().hex().length(24).allow(null),
  documentId: Joi.string().hex().length(24).allow(null)
});

export const getAppUserFileSchema = Joi.object({
  appAgentId: Joi.string().hex().length(24).required()
});

export const getSingleFileSchema = Joi.object({
  attatchmentId: Joi.string().hex().length(24).required()
});

export const updateAppUserFileSchema = Joi.object({
  appAgentId: Joi.string().hex().length(24).required(),
  profile_pictureId: Joi.string().hex().length(24).allow(null),
  aadhar_cardId: Joi.string().hex().length(24).allow(null),
  pan_cardId: Joi.string().hex().length(24).allow(null),
  documentId: Joi.string().hex().length(24).allow(null),
  encoding: Joi.string().allow(null)
});
export const fileSchema = Joi.object({
  fieldname: Joi.string().required(),
  originalname: Joi.string().required(),
  mimetype: Joi.string().required(),
  destination: Joi.string().required(),
  filename: Joi.string().required(),
  path: Joi.string().required(),
  size: Joi.number().required()
}).unknown(true);
export const updatedFilesSchema = Joi.object({
  profile_picture: Joi.array().items(fileSchema),
  aadhar_card: Joi.array().items(fileSchema),
  pan_card: Joi.array().items(fileSchema),
  documents: Joi.array().items(fileSchema)
});
