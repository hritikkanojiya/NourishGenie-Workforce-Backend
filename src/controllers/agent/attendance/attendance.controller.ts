import { logBackendError } from '../../../helpers/common/backend.functions';
import moment from 'moment';
import { appAttendanceModel } from '../../../models/agent/attendance/attendance.model';
import appAgentDetailsModel from '../../../models/agent/fields/app_agent_details.model';

export const createAppUsersAttendance = async (): Promise<void> => {
    try {
        const appUsersCompanyDetails = await appAgentDetailsModel.find();
        const currentDate = moment().format('YYYY-MM-DD');
        appUsersCompanyDetails.map(async (userCompanyDetails) => {
            const doesUserAttendanceExist = await appAttendanceModel.findOne({
                appAgentId: userCompanyDetails.appAgentId,
                date: currentDate,
                isDeleted: false
            });
            if (!doesUserAttendanceExist) {
                const appUserAttendance = new appAttendanceModel({
                    appAgentId: userCompanyDetails.appAgentId,
                    email: userCompanyDetails?.company_email,
                    status: 'UNAVAILABLE',
                    date: currentDate,
                    isDeleted: false
                })
                await appUserAttendance.save();
            }
        })

    } catch (error: any) {
        logBackendError(__filename, error?.message, null, null, error?.stack);
        if (error?.isJoi === true) error.status = 422;
        return error;
    }
}