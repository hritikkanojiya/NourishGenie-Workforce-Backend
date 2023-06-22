import mongoose, { Schema, model } from 'mongoose';

const appAttandenceSchema = new Schema(
    {
        appAgentId: {
            type: mongoose.Types.ObjectId,
            required: true
        },
        availabilty: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ['PRESENT', 'ABSENT'],
            required: true
        },
        date: {
            type: Date,
            required: true,
        },
        isDeleted: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

const appAttandanceModel = model('app_attandence', appAttandenceSchema);
// const appAgentActivitylogsModel = model('app_Agent_activity_log', appAgentActivitiesLogsSchema);


export {
    appAttandanceModel,
    // appAgentActivitylogsModel
};
