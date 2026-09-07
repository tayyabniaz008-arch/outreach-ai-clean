import { NextResponse } from "next/server";
import { google } from "googleapis";
import { db } from "@/lib/db";

function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret =
    process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI;

  if (
    !clientId ||
    !clientSecret ||
    !redirectUri
  ) {
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

function decodeBase64Url(data?: string) {
  if (!data) {
    return "";
  }

  const normalized = data
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  return Buffer.from(
    normalized,
    "base64"
  ).toString("utf8");
}

function stripHtml(html: string) {
  return html
    .replace(
      /<style[\s\S]*?<\/style>/gi,
      " "
    )
    .replace(
      /<script[\s\S]*?<\/script>/gi,
      " "
    )
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function extractPlainText(
  payload: any
): string {
  if (
    payload?.mimeType === "text/plain" &&
    payload?.body?.data
  ) {
    return decodeBase64Url(
      payload.body.data
    ).trim();
  }

  if (
    payload?.mimeType === "text/html" &&
    payload?.body?.data
  ) {
    return stripHtml(
      decodeBase64Url(
        payload.body.data
      )
    );
  }

  if (Array.isArray(payload?.parts)) {
    for (const part of payload.parts) {
      const text =
        extractPlainText(part);

      if (text) {
        return text;
      }
    }
  }

  return "";
}

function getHeader(
  headers: any[] | undefined,
  name: string
) {
  const header = headers?.find(
    (item) =>
      String(item?.name || "")
        .toLowerCase() ===
      name.toLowerCase()
  );

  return String(
    header?.value || ""
  );
}

function extractEmail(value: string) {
  const match =
    value.match(/<([^>]+)>/);

  return (
    match?.[1] || value
  )
    .trim()
    .toLowerCase();
}

function cleanReplyBody(text: string) {
  let clean = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();

  const inlineQuoteMatch =
    clean.match(
      /\s+On\s[\s\S]*?wrote:\s*/i
    );

  if (
    inlineQuoteMatch?.index !== undefined
  ) {
    clean = clean
      .slice(
        0,
        inlineQuoteMatch.index
      )
      .trim();
  }

  const separatorPatterns = [
    /\nOn\s[\s\S]*?wrote:\s*/i,
    /\n-{2,}\s*Original Message\s*-{2,}/i,
    /\nFrom:\s[\s\S]*/i,
  ];

  for (const pattern of separatorPatterns) {
    const match = clean.match(pattern);

    if (
      match?.index !== undefined
    ) {
      clean = clean
        .slice(0, match.index)
        .trim();
    }
  }

  clean = clean
    .split("\n")
    .filter(
      (line) =>
        !line
          .trim()
          .startsWith(">")
    )
    .join("\n");

  const signatureIndex =
    clean.search(
      /\n--\s*\n/
    );

  if (signatureIndex >= 0) {
    clean = clean
      .slice(
        0,
        signatureIndex
      )
      .trim();
  }

  return clean
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function isInsufficientScopeError(
  error: unknown
) {
  const message =
    error instanceof Error
      ? error.message
      : String(error);

  return (
    /insufficient authentication scopes/i.test(
      message
    ) ||
    /insufficient.*scope/i.test(
      message
    ) ||
    /403/i.test(message)
  );
}

export async function POST() {
  try {
    const gmailAccounts =
      await db.gmailAccount.findMany({
        orderBy: {
          createdAt: "asc",
        },
      });

    if (gmailAccounts.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No Gmail accounts are connected.",
        },
        { status: 400 }
      );
    }

    let imported = 0;
    let skipped = 0;
    let checked = 0;

    const accountResults: {
      accountId: string;
      email: string;
      checked: number;
      imported: number;
      skipped: number;
      error?: string;
      needsReauthorization?: boolean;
    }[] = [];

    for (const gmailAccount of gmailAccounts) {
      let accountImported = 0;
      let accountSkipped = 0;
      let accountChecked = 0;

      try {
        const oauth2Client =
          getOAuth2Client();

        oauth2Client.setCredentials({
          refresh_token:
            gmailAccount.refreshToken,
        });

        const gmail = google.gmail({
          version: "v1",
          auth: oauth2Client,
        });

        const listResponse =
          await gmail.users.messages.list({
            userId: "me",
            maxResults: 50,
            q: "in:inbox -from:me newer_than:30d",
          });

        const messages =
          listResponse.data.messages ||
          [];

        accountChecked =
          messages.length;

        checked +=
          accountChecked;

        for (const item of messages) {
          if (!item.id) {
            accountSkipped++;
            skipped++;
            continue;
          }

          const existing =
            await db.message.findFirst({
              where: {
                providerMessageId:
                  item.id,
              },
            });

          if (existing) {
            accountSkipped++;
            skipped++;
            continue;
          }

          const fullMessage =
            await gmail.users.messages.get(
              {
                userId: "me",
                id: item.id,
                format: "full",
              }
            );

          const gmailMessage =
            fullMessage.data;

          const fromHeader =
            getHeader(
              gmailMessage.payload
                ?.headers,
              "From"
            );

          const senderEmail =
            extractEmail(
              fromHeader
            );

          if (!senderEmail) {
            accountSkipped++;
            skipped++;
            continue;
          }

          const lead =
            await db.lead.findUnique({
              where: {
                email: senderEmail,
              },
            });

          if (!lead) {
            accountSkipped++;
            skipped++;
            continue;
          }

          const rawBody =
            extractPlainText(
              gmailMessage.payload
            ) ||
            gmailMessage.snippet ||
            "";

          const body =
            cleanReplyBody(
              rawBody
            );

          if (!body) {
            accountSkipped++;
            skipped++;
            continue;
          }

          const optOut =
            /unsubscribe|remove me|stop emailing|do not contact|do not email/i.test(
              body
            );

          await db.message.create({
            data: {
              leadId: lead.id,
              direction: "INBOUND",
              body,
              aiGenerated: false,
              approved: false,
              providerMessageId:
                item.id,
              threadId:
                gmailMessage.threadId ||
                item.threadId ||
                null,
              createdAt:
                gmailMessage.internalDate
                  ? new Date(
                      Number(
                        gmailMessage.internalDate
                      )
                    )
                  : new Date(),
            },
          });

          await db.lead.update({
            where: {
              id: lead.id,
            },
            data: {
              status: optOut
                ? "OPTED_OUT"
                : "REPLIED",
              mode: optOut
                ? "DRAFT"
                : lead.mode,
            },
          });

          accountImported++;
          imported++;
        }

        accountResults.push({
          accountId:
            gmailAccount.id,
          email:
            gmailAccount.email,
          checked:
            accountChecked,
          imported:
            accountImported,
          skipped:
            accountSkipped,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to sync Gmail account";

        console.error(
          `Gmail sync failed for ${gmailAccount.email}:`,
          error
        );

        accountResults.push({
          accountId:
            gmailAccount.id,
          email:
            gmailAccount.email,
          checked:
            accountChecked,
          imported:
            accountImported,
          skipped:
            accountSkipped,
          error: errorMessage,
          needsReauthorization:
            isInsufficientScopeError(
              error
            ),
        });
      }
    }

    const accountsNeedingReauth =
      accountResults.filter(
        (account) =>
          account.needsReauthorization
      );

    return NextResponse.json({
      success: true,
      imported,
      skipped,
      checked,
      accounts:
        accountResults.length,
      accountResults,
      accountsNeedingReauthorization:
        accountsNeedingReauth.map(
          (account) => ({
            id: account.accountId,
            email: account.email,
          })
        ),
    });
  } catch (error) {
    console.error(
      "Gmail reply sync error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to sync Gmail replies",
      },
      {
        status: 500,
      }
    );
  }
}