import mongoose, { Schema, model } from 'mongoose';

const appUserAttendanceSchema = new Schema(
    {
        appUserId: {
            type: mongoose.Types.ObjectId,
            required: true
        },
        fullName: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true
        },
        availability: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ['PRESENT', 'ABSENT'],
            required: true
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

const appUserAttendanceModel = model('app_user_attendance', appUserAttendanceSchema);

export {
    appUserAttendanceModel,
};
