import mongoose, { Schema, model } from 'mongoose';

const appAttendanceSchema = new Schema(
    {
        appAgentId: {
            type: mongoose.Types.ObjectId,
            required: true
        },
        email: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ['PRESENT', 'ABSENT', 'UNAVAILABLE'],
            required: true
        },
        date: {
            type: String,
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

const appAttendanceModel = model('app_attendance', appAttendanceSchema);
// const appAgentActivitylogsModel = model('app_Agent_activity_log', appAgentActivitiesLogsSchema);


export {
    appAttendanceModel,
};
