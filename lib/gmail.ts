import { google } from "googleapis";

function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      "Missing Google OAuth environment variables."
    );
  }

  return new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );
}

export function getGmailAuthUrl() {
  const oauth2Client = getOAuth2Client();

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "openid",
      "email",
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/gmail.readonly",
    ],
  });
}

export async function getGmailTokens(
  code: string
) {
  const oauth2Client = getOAuth2Client();

  const { tokens } =
    await oauth2Client.getToken(code);

  return tokens;
}

export async function getGmailAccountEmail(
  idToken: string
) {
  const oauth2Client = getOAuth2Client();

  const ticket =
    await oauth2Client.verifyIdToken({
      idToken,
      audience:
        process.env.GOOGLE_CLIENT_ID,
    });

  const payload = ticket.getPayload();

  if (!payload?.email) {
    throw new Error(
      "Could not determine Google account email."
    );
  }

  return payload.email;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function bodyToHtml(
  body: string,
  signature?: string | null
) {
  const cleanBody = body.trim();

  if (!signature?.trim()) {
    return cleanBody
      .split(/\r?\n/)
      .map((line) => {
        const escaped = escapeHtml(line);

        return escaped
          ? `<div>${escaped}</div>`
          : "<div><br></div>";
      })
      .join("");
  }

  const signatureText = signature.trim();

  /*
   * The send route adds the exact Gmail signature
   * at the very end of the message.
   *
   * We locate that exact signature and render it
   * separately in a lighter gray tone.
   */
  const signatureIndex = cleanBody
    .toLowerCase()
    .lastIndexOf(
      signatureText.toLowerCase()
    );

  if (signatureIndex === -1) {
    return cleanBody
      .split(/\r?\n/)
      .map((line) => {
        const escaped = escapeHtml(line);

        return escaped
          ? `<div>${escaped}</div>`
          : "<div><br></div>";
      })
      .join("");
  }

  const mainBody = cleanBody
    .slice(0, signatureIndex)
    .trim();

  const actualSignature = cleanBody
    .slice(
      signatureIndex,
      signatureIndex +
        signatureText.length
    )
    .trim();

  const mainHtml = mainBody
    .split(/\r?\n/)
    .map((line) => {
      const escaped = escapeHtml(line);

      return escaped
        ? `<div>${escaped}</div>`
        : "<div><br></div>";
    })
    .join("");

  const signatureHtml = actualSignature
    .split(/\r?\n/)
    .map((line) => {
      const escaped = escapeHtml(line);

      return escaped
        ? `<div>${escaped}</div>`
        : "<div><br></div>";
    })
    .join("");

  return `
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.55;color:#202124;">
      ${mainHtml}
    </div>

    <div style="margin-top:18px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.45;color:#80868b;">
      ${signatureHtml}
    </div>
  `.trim();
}

function createMimeMessage(input: {
  to: string;
  subject: string;
  body: string;
  signature?: string | null;
}) {
  const boundary =
    `----=_NextPart_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2)}`;

  const plainText = input.body.trim();

  const htmlBody = bodyToHtml(
    plainText,
    input.signature
  );

  const message = [
    `To: ${input.to}`,
    `Subject: ${input.subject}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=utf-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    plainText,
    "",
    `--${boundary}`,
    "Content-Type: text/html; charset=utf-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    htmlBody,
    "",
    `--${boundary}--`,
  ].join("\r\n");

  return message;
}

export async function sendGmailMessage(input: {
  accessToken?: string;
  refreshToken: string;
  to: string;
  subject: string;
  body: string;
  signature?: string | null;
}) {
  const oauth2Client = getOAuth2Client();

  oauth2Client.setCredentials({
    access_token: input.accessToken,
    refresh_token: input.refreshToken,
  });

  const gmail = google.gmail({
    version: "v1",
    auth: oauth2Client,
  });

  const message = createMimeMessage({
    to: input.to,
    subject: input.subject,
    body: input.body,
    signature: input.signature,
  });

  const raw = Buffer.from(
    message,
    "utf8"
  ).toString("base64url");

  const response =
    await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw,
      },
    });

  return response.data;
}