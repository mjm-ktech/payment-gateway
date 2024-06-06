/**
 * bank-account controller
 */

import { factories } from '@strapi/strapi'
import { oAuth2Client } from '../.././../extensions/helpers';
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
export default factories.createCoreController('api::bank-account.bank-account', ({ strapi }) => ({
  async grantPermissions(ctx) {
    const { email } = ctx.request.body;
    strapi.log.info(email);
    return oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      state: email,
    });
  },
  async oauth2callback(ctx) {
    const { code, state } = ctx.request.query;
    const account = await strapi.entityService.findMany("api::bank-account.bank-account", {
      filters: {
        transfer_email: state
      }
    });
    if (account.length === 0) {
      return ctx.badRequest("email_not_found", "email not found");
    }
    oAuth2Client.getToken(code, async (err, token) => {
      if (err) return ctx.badRequest("code_is_not_valid", "code is not valid");
      oAuth2Client.setCredentials(token);
      await strapi.db.query("api::bank-account.bank-account").updateMany({
        where: {
          transfer_email: state,
        },
        data: {
          token: token
        },
      });
    });

    return {
      message: "success"
    }
  }
}));
