// Import Packages
import mongoose from 'mongoose';

const TicketSchema = new mongoose.Schema(
    {
        subject: {
            type: String,
            required: true,
        },
        content: {
            type: String
        },
        html: {
            type: String
        },
        completedPercent: {
            type: Number,
            enum: [0, 25, 50, 75, 100],
            default: 0
        },
        From: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        To: {
            type: [mongoose.Schema.Types.ObjectId],
            required: true
        },
        appTicketPriorityId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        appTicketCategoryId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        appTicketStatusId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        appAttachments: {
            type: [mongoose.Schema.Types.ObjectId]
        },
        initialAddedUserLength: {
            type: Number,
            required: true
        },
        isDeleted: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true,
    }
);
const TicketModel = mongoose.model('app_ticket', TicketSchema);

// Export model
export default TicketModel;