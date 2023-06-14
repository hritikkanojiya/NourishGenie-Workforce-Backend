import SibApiV3Sdk from 'sib-api-v3-sdk';
import { appConstantsModel } from '../../../models/constants/constants.model';
import { logBackendError } from '../../common/backend.functions';
import httpErrors from 'http-errors';

const __createSIBInstance = async (): Promise<any> => {
  const sibClient = SibApiV3Sdk.ApiClient.instance;
  const sendInBlueAuthInstance = sibClient.authentications['api-key'];
  const SIB_API_KEY = await appConstantsModel
    .findOne({
      name: 'SIB_API_KEY',
      isDeleted: false
    })
    .select('value');

  if (!SIB_API_KEY) throw httpErrors.UnprocessableEntity(`Unable to process Constant [SIB_API_KEY]`);

  sendInBlueAuthInstance.apiKey = SIB_API_KEY.value;
  return sibClient;
};

const sibGetAccount = async (): Promise<any> => {
  try {
    __createSIBInstance().catch(error => {
      throw error;
    });
    const apiInstance = new SibApiV3Sdk.AccountApi();
    apiInstance
      .getAccount()
      .catch((error: any) => {
        throw error;
      })
      .then((data: any) => {
        console.log('Data : ', data);
      });
  } catch (error) {
    console.log(error);
  }
};

const getSIBInstance = async (): Promise<any> => {
  return await __createSIBInstance();
};

const forgotPasswordMail = async (resetPassUrl: string, recieverEmail: string, recieverName: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    async (): Promise<void> => {
      __createSIBInstance().catch(error => {
        return error;
      });
      const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
      const SIB_FORGOT_PASSWORD_TEMPLATE_ID = await appConstantsModel
        .findOne({
          name: 'SIB_FORGOT_PASSWORD_TEMPLATE_ID',
          isDeleted: false
        })
        .select('value');

      if (!SIB_FORGOT_PASSWORD_TEMPLATE_ID)
        throw httpErrors.UnprocessableEntity(`Unable to process Constant [SIB_FORGOT_PASSWORD_TEMPLATE_ID]`);

      const RESET_PASS_TOKEN_EXP_IN_MINS = await appConstantsModel
        .findOne({
          name: 'RESET_PASS_TOKEN_EXP_IN_MINS',
          isDeleted: false
        })
        .select('value');

      if (!RESET_PASS_TOKEN_EXP_IN_MINS)
        throw httpErrors.UnprocessableEntity(`Unable to process Constant [RESET_PASS_TOKEN_EXP_IN_MINS]`);

      sendSmtpEmail.templateId = parseInt(SIB_FORGOT_PASSWORD_TEMPLATE_ID.value);
      sendSmtpEmail.to = [{ email: recieverEmail, name: recieverName }];
      sendSmtpEmail.replyTo = {
        email: 'no-reply@nourishgenie.com',
        name: 'NourishGenie'
      };
      sendSmtpEmail.params = {
        resetPassUrl: resetPassUrl,
        userName: recieverName,
        expiresInMins: RESET_PASS_TOKEN_EXP_IN_MINS.value,
        supportEmail: process.env.SUPPORT_EMAIL
      };

      apiInstance.sendTransacEmail(sendSmtpEmail).then(
        (data: any) => {
          resolve(data);
        },
        (error: any) => {
          reject(error);
        }
      );
    };
  });
};

const sendSIBTestCampaign = async (appContacts: any, sendInBlueCampaignId: any): Promise<void> => {
  return new Promise((resolve, reject) => {
    async (): Promise<void> => {
      try {
        const testContacts = appContacts.map((contact: any) => {
          return contact.email;
        });

        await getSIBInstance();
        const apiInstance = new SibApiV3Sdk.EmailCampaignsApi();
        const sendTestEmail = new SibApiV3Sdk.SendTestEmail();
        sendTestEmail.emailTo = testContacts;
        resolve(await apiInstance.sendTestEmail(sendInBlueCampaignId, sendTestEmail));
      } catch (error: any) {
        try {
          error.message =
            error?.response?.request?.host === 'api.sendinblue.com'
              ? JSON.parse(error?.response?.error?.text)?.message
              : error.message;
        } catch (error: any) {
          console.log(`SendInBlue Error : ${error.message}`);
        } finally {
          logBackendError(__filename, error?.message, null, null, null, error?.stack);
          if (error?.isJoi === true) error.status = 422;
          reject(error);
        }
      }
    };
  });
};

export { sibGetAccount, forgotPasswordMail, getSIBInstance, sendSIBTestCampaign };
