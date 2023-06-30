// import mongoose from 'mongoose';

// const WatchCollectionSchema = new mongoose.Schema(
//   {
//     type: {
//       type: String,
//       required: true,
//       enum: ['SINGLE', 'BROADCAST'],
//     },
//     socketId: {
//       type: String,
//       default: null,
//     },
//     eventName: {
//       type: String,
//       required: true,
//     },
//     metaData: {
//       type: mongoose.SchemaTypes.Mixed,
//       required: true,
//     },
//   },
//   { timestamps: true }
// );

// const watchCollectionModel = mongoose.model(
//   process.env.MONGODB_COLLECTION_NAME,
//   WatchCollectionSchema
// );

// module.exports = { watchCollectionModel };
