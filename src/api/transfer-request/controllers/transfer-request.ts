/**
 * transfer-request controller
 */
import { factories } from "@strapi/strapi";
import { debug } from "../../.././extensions/utils/index";
import { oAuth2Client, isTokenValid } from "../../../extensions/helpers/index";
type Token = {
  scope: string;
  token_type: string;
  expiry_date: number;
  access_token: string;
  refresh_token: string
}
export default factories.createCoreController(
  "api::transfer-request.transfer-request",
  ({ strapi }) => ({
    async generate(ctx) {
      try {
        const userId = ctx.state.user.id;
        const body: {
          website_id: number;
          type: string;
          amount: number;
        } = ctx.request.body;
        if (!body.website_id) {
          return ctx.badRequest("not_website_id", "website_id is required");
        }
        if (!body.type) {
          return ctx.badRequest("not_type", "type is required");
        }
        let website: any;
        if (body.type !== "Momo") {
          website = await strapi.entityService.findOne(
            "api::website.website",
            body.website_id,
            {
              populate: {
                bank_accounts: {
                  populate: {
                    bank: {
                      filters: {
                        name: body.type,
                      },
                    },
                  },
                },
              },
            }
          );
        } else {
          website = await strapi.entityService.findOne(
            "api::website.website",
            body.website_id,
            {
              populate: {
                momo_account: true,
              },
            }
          );
        }

        if (!website) {
          return ctx.send("Website not found", 404);
        }
        const { bank_accounts } = website;

        if(!bank_accounts || bank_accounts.length === 0) {
          return ctx.send("bank account not found", 404);
        }
        // check bank exist in bank_accounts
        const bank  = bank_accounts.filter(item => item.bank && item.bank.name === body.type);
        // filter bank_account have bank === type
        if(!bank || bank.length === 0) {
          return ctx.send("bank account not found", 404);
        }
        const transferRequest = await strapi
          .service("api::transfer-request.transfer-request")
          .generateLink(website, userId, body.type, body.amount);
        return transferRequest;
      } catch (err) {
        console.log(err);
        return ctx.send("Internal server error", 500);
      }
    },
    async checkStatus(ctx) {
      try {
        const body = ctx.request.body;
        const { request_id, execution_time } = body;
        strapi.log.info(`Checking request with id: ${request_id} and execution time: ${execution_time}`);
        const transferRequest = await strapi.entityService.findOne(
          "api::transfer-request.transfer-request",
          request_id,
          {
            populate: {
              website: true,
            },
          }
        );
        if (!transferRequest) {
          return ctx.send("Transfer request not found", 400);
        }
        if (!transferRequest.content) {
          return ctx.send("Transfer request is not valid", 400);
        }
        if (!transferRequest.type || transferRequest.type !== "VietinBank" && transferRequest.type !== "MBBank" && transferRequest.type !== "Sacombank") {
          return ctx.send("Transfer request is not valid", 400);
        }
        const website = await strapi.entityService.findOne(
          "api::website.website",
          transferRequest.website.id,
          {
            populate: {
              bank_accounts: {
                filters: {
                  bank: {
                    name: transferRequest.type
                  }
                }
              },
            },
          }
        );
        if (!website) {
          return ctx.send("website not found", 400);
        }
        const token = website.bank_accounts[0].token as Token;
        if (!token) {
          return ctx.badRequest("Please_wait_for_admin_grant_permission", "Please wait for admin grant permission")
        }
        const isExpired = Date.now() >= token.expiry_date;
        const isValid = await isTokenValid(token.access_token);
        let newCredential: any = website.bank_accounts[0].token;
        if (isExpired || !isValid) {
          console.log('Token expired, refreshing...');
          try {
            oAuth2Client.setCredentials({
              refresh_token: token.refresh_token,
            });

            const { credentials } = await oAuth2Client.refreshAccessToken();
            oAuth2Client.setCredentials(credentials);
            newCredential = credentials;
            await strapi.db.query("api::bank-account.bank-account").updateMany({
              where: {
                transfer_email: website.bank_accounts[0].transfer_email,
              },
              data: {
                token: credentials
              },
            });
          } catch (err) {
            return ctx.badRequest("Please_wait_for_admin_grant_permission", "Please wait for admin grant permission because refresh token is expired");
          }
        }
        // call service api get content email from google
        const message = await strapi
          .service("api::transfer-request.transfer-request")
          .checkStatus(transferRequest, newCredential, execution_time);

        return {
          message
        }
      } catch (e) {
        return ctx.badRequest("Please_wait_for_admin_grant_permission", "Please wait for admin grant permission because refresh token is expired");
      }
    }
  })
);
