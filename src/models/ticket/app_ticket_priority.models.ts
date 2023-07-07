import mongoose from 'mongoose';

const priorityticketSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        color: {
            type: String,
            required: true,
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
const priorityTicketModel = mongoose.model('ticketpriority', priorityticketSchema);

// Export model
export default priorityTicketModel;