// gmailHelper.js
import { google } from "googleapis";
const serverConfig = strapi.config.get("server") as {
  web: { client_secret: string; client_id: string; redirect_uris: string };
};
const { client_secret, client_id, redirect_uris } = serverConfig.web;
export const oAuth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uris
);
export function authorize(token): any {
  const serverConfig = strapi.config.get("server") as {
    web: { client_secret: string; client_id: string; redirect_uris: string };
  };
  const { client_secret, client_id, redirect_uris } = serverConfig.web;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris
  );
  return oAuth2Client.setCredentials(token);
}

export function checkMessages(token, content, type) {
  return new Promise((resolve, reject) => {
    const serverConfig = strapi.config.get("server") as {
      web: { client_secret: string; client_id: string; redirect_uris: string };
    };
    const { client_secret, client_id, redirect_uris } = serverConfig.web;
    const oAuth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris
    );
    oAuth2Client.setCredentials(token);
    const gmail = google.gmail({ version: "v1", auth: oAuth2Client });
    let query: string;
    switch (type) {
      case "VietinBank":
        // query = "from:VietinBank.vn";
        // break;
      case "MBBank":
        query = "from:mbebanking@mbbank.com.vn Giao dịch thành công";
        break;
      case "Sacombank":
        query = "from:info@sacombank.com.vn";
        break;
      default:
        break;
    }
    query = `${query} ${content}`;
    gmail.users.messages.list(
      {
        q: query,
        userId: "me",
        maxResults: 1,
      },
      (err, res) => {
        if (err) {
          console.log("The API returned an error: " + err);
          reject(err);
        } else {
          const messages = res.data.messages;
          if (!messages || messages.length === 0) {
            resolve(false);
            return;
          }
          resolve(messages.length > 0);
        }
      }
    );
  });
}
function getMessage(auth, messageId) {
  const gmail = google.gmail({ version: "v1", auth });
  gmail.users.messages.get(
    {
      userId: "me",
      id: messageId,
    },
    (err, res) => {
      if (err) return console.log("The API returned an error: " + err);
      // decode base64 data
      const encodedData = res.data.payload.body.data;
      const decodedData = Buffer.from(encodedData, "base64").toString("ascii");
      console.log(
        `Message from ${res.data.payload.headers[0].value}: ${decodedData}`
      );
    }
  );
}
export async function isTokenValid(token) {
  const url = `https://oauth2.googleapis.com/tokeninfo?access_token=${token}`;
  const response = await fetch(url);
  const data: any = await response.json();
  return response.ok && !data?.error;
}

export default {
  authorize,
  checkMessages,
  getMessage,
};
