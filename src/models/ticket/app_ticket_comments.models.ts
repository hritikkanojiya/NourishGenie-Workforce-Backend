import mongoose from 'mongoose';

const commentticketSchema = new mongoose.Schema(
    {
        appTicketId: {
            type: String,
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
        html: {
            type: String,
        },
        appAgentId: {
            type: String,
            required: true,
        },
        appAttachments: [{
            type: String,
        }],
        isDeleted: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true,
    }
);
const commentTicketModel = mongoose.model('ticketcomments', commentticketSchema);

// Export model
export default commentTicketModel;