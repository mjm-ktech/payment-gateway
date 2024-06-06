/**
 * transfer-request service
 */

import { factories } from "@strapi/strapi";
import { errors } from '@strapi/utils';
const { ApplicationError } = errors;
import {
  GetValues,
  GetNonPopulatableKeys,
} from "@strapi/types/dist/types/core/attributes";
import { checkMessages } from "../../../extensions/helpers";
type Request = GetValues<"api::transfer-request.transfer-request", "website" | GetNonPopulatableKeys<"api::transfer-request.transfer-request">>
type Website = GetValues<"api::website.website", GetNonPopulatableKeys<"api::website.website">>
export default factories.createCoreService(
  "api::transfer-request.transfer-request",
  ({ strapi }) => ({
    generateLink: async (
      website: GetValues<
        "api::website.website",
        "bank_accounts" | GetNonPopulatableKeys<"api::website.website">
      >,
      userId: string,
      type: "Momo" | "VietinBank" | "MBBank" | "Sacombank",
      amount: number
    ) => {
      try {
        const server: any = strapi.config.get("server");
        const apiUrl = server.vietqr.apiUrl;
        const clientId = server.vietqr.clientId;
        const apiKey = server.vietqr.apiKey;
        const transferRequest = await strapi.entityService.create(
          "api::transfer-request.transfer-request",
          {
            data: {
              amount: amount,
              website: {
                id: website.id
              },
              user: {
                id: userId
              },
              type: type
            },
          }
        );
        const { bank_accounts } = website;
        // get bank account have bank !== null
        const bankAccount = bank_accounts.filter(
          (bank_account) => bank_account.bank !== null
        )[0];
        // build link VietQR for transfer request
        const response = await fetch(apiUrl, {
          method: "POST", // Setting the HTTP method as POST
          headers: {
            "x-client-id": clientId, // Replace <CLIENT_ID_HERE> with your actual client ID
            "x-api-key": apiKey, // Replace <API_KEY_HERE> with your actual API key
            "Content-Type": "application/json", // Setting content type as JSON
          },
          body: JSON.stringify({
            accountNo: bankAccount.account_number,
            accountName: bankAccount.account_name,
            acqId: bankAccount.bank.bank_no,
            addInfo: transferRequest.content,
            amount: transferRequest.amount,
            template: "compact",
          }), // Data is converted to a JSON string
        });
        if (response.ok) {
          return {
            QR: await response.json(),
            request_id: transferRequest.id
          };
        } else {
          throw new ApplicationError("Internal server error", 500);
        }
      } catch (e) {
        throw new ApplicationError("Internal server error", 500);
      }
    },

    checkStatus: async (request, token, executionTime) => {
      try {
        // Debugging: Log the token to the console

        // If the pay_status is already true, return success immediately
        if (request.pay_status === true) {
          await strapi.entityService.create("api::checking-history.checking-history", {
            data: {
              request: {
                id: request.id
              },
              execution_time: executionTime,
              result: "success"
            }
          });
          return {
            message: "success"
          };

        } else {
          // Extract content and type from the request
          const { content, type } = request;

          // Return the message immediately
          const responseMessage = {
            message: "Processing your request, you will be notified upon completion."
          };

          // Run the status check in the background
          setImmediate(async () => {
            try {
              await new Promise((resolve) =>
                setTimeout(resolve, executionTime * 1000)
              );
              // Check the message status using the token, content, and type
              const status = await checkMessages(token, content, type);

              // If the status check is successful, update the pay_status to true
              if (status) {
                await strapi.entityService.update("api::transfer-request.transfer-request", request.id, {
                  data: {
                    pay_status: true
                  }
                });
                await strapi.entityService.create("api::checking-history.checking-history", {
                  data: {
                    request: {
                      id: request.id
                    },
                    execution_time: executionTime,
                    result: "success"
                  }
                });
              } else {
                await strapi.entityService.update("api::transfer-request.transfer-request", request.id, {
                  data: {
                    pay_status: false
                  }
                });
                await strapi.entityService.create("api::checking-history.checking-history", {
                  data: {
                    request: {
                      id: request.id
                    },
                    execution_time: executionTime,
                    result: "fail"
                  }
                });
              }
            } catch (error) {
              console.error("Error during background status check:", error);
            }
          });

          return responseMessage;
        }
      } catch (error) {
        // Handle any potential errors
        console.error("Error checking status:", error);
        return {
          message: "error",
          error: error.message
        };
      }
    }
  })
);
