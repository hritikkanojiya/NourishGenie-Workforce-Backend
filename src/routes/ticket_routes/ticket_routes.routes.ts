import express from 'express';
const appTicketRouterV1 = express.Router();
import * as appAgentAuthController from '../../controllers/ticket/ticket.controllers';
import multer from 'multer';
import path from 'path';

const storagePost = multer.diskStorage({
    destination: function (req: any, file: any, cb: any) {
        cb(null, path.join(__dirname, '../../../../NourishGenie-Workforce-Frontend/public/UserFile'), function (error: any, success: any) {
            if (error) {
                console.log(req, file);
                console.log(error);
                console.log(success);
            }
        })
    },
    filename: function (req: any, file: any, cb: any) {
        cb(null, Date.now() + '_' + file.originalname, function (error: any, success: any) {
            if (error) {
                console.log(req, file);
                console.log(error);
                console.log(success);
            }
        })
    }
})
const upload1 = multer({ storage: storagePost })

// Define Routes
appTicketRouterV1.post('/create_ticket', appAgentAuthController.createNewTicket);
appTicketRouterV1.post('/change_assigner', appAgentAuthController.changeAssigner);
appTicketRouterV1.post('/update_priority', appAgentAuthController.updateTicketPriority);
appTicketRouterV1.post('/update_status', appAgentAuthController.updateTicketStatus);
appTicketRouterV1.post('/update_completion', appAgentAuthController.updateTicketCompletion);
appTicketRouterV1.post('/add_user', appAgentAuthController.addUser);
appTicketRouterV1.post('/chat_user', appAgentAuthController.chatUser);
appTicketRouterV1.post('/transfer_ticket', appAgentAuthController.transferTicket);
appTicketRouterV1.post('/create_priority', appAgentAuthController.createTicketPriority);
appTicketRouterV1.post('/create_status', appAgentAuthController.createTicketStatus);
appTicketRouterV1.post('/create_category', appAgentAuthController.createTicketCategories);
appTicketRouterV1.post('/create_type', appAgentAuthController.createTicketType);
appTicketRouterV1.post('/ticket_detail', appAgentAuthController.getTicketDetail);
appTicketRouterV1.get('/get_priority', appAgentAuthController.getPriority);
appTicketRouterV1.get('/get_category', appAgentAuthController.getCategory);
appTicketRouterV1.get('/get_status', appAgentAuthController.getStatus);
appTicketRouterV1.post('/all_ticket', appAgentAuthController.getAllTicket);
appTicketRouterV1.post('/all_my_ticket', appAgentAuthController.getAllMyTicket);
appTicketRouterV1.post('/all_category_ticket', appAgentAuthController.getAllCategoryTicket);
appTicketRouterV1.post('/all_search_ticket', appAgentAuthController.getAllSearchTicket);
appTicketRouterV1.post('/upload_file', upload1.single('myfile'), appAgentAuthController.uploadFile);
appTicketRouterV1.get('/get_user', appAgentAuthController.getAllUser);
// appTicketRouterV1.post('/download_file', appAgentAuthController.downloadFile);
appTicketRouterV1.post('/get_file_name', appAgentAuthController.getFileName);
appTicketRouterV1.post('/send_remainder', appAgentAuthController.sendRemainder);

export { appTicketRouterV1 };