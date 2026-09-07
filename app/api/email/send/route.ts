import { NextResponse } from "next/server";
import { google } from "googleapis";
import { db } from "@/lib/db";
import { sendGmailMessage } from "@/lib/gmail";

const DEFAULT_SIGNATURE = `
Tayyab Niaz
Freelance Blogger Expert`;

function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Missing Google OAuth environment variables.");
  }

  return new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );
}

function extractDisplayName(
  fromHeader: string,
  email: string
) {
  const match = fromHeader.match(
    /^"?([^"<]+?)"?\s*<[^>]+>$/i
  );

  if (match?.[1]) {
    const name = match[1]
      .replace(/^"|"$/g, "")
      .trim();

    if (
      name &&
      name.toLowerCase() !== email.toLowerCase()
    ) {
      return name;
    }
  }

  return "";
}

function fallbackNameFromEmail(email: string) {
  const localPart = email
    .split("@")[0]
    .replace(/[._-]+/g, " ")
    .replace(/\d+/g, " ")
    .trim();

  if (!localPart) {
    return "";
  }

  return localPart
    .split(/\s+/)
    .filter(Boolean)
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1).toLowerCase()
    )
    .join(" ");
}

function getFirstName(
  fullName: string,
  email: string
) {
  const cleanedName = fullName.trim();

  if (cleanedName) {
    const parts = cleanedName
      .split(/\s+/)
      .filter(Boolean);

    /*
     * Example:
     * "M rizwan" -> "Rizwan"
     * "M. Rizwan" -> "Rizwan"
     */
    if (
      parts.length >= 2 &&
      /^[A-Za-z]\.?$/.test(parts[0])
    ) {
      return (
        parts[1].charAt(0).toUpperCase() +
        parts[1].slice(1).toLowerCase()
      );
    }

    return (
      parts[0].charAt(0).toUpperCase() +
      parts[0].slice(1).toLowerCase()
    );
  }

  const fallback = fallbackNameFromEmail(email);

  if (!fallback) {
    return "";
  }

  return fallback.split(/\s+/)[0];
}

async function getGmailRecipientName(
  email: string,
  refreshToken: string
) {
  try {
    const oauth2Client = getOAuth2Client();

    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    const gmail = google.gmail({
      version: "v1",
      auth: oauth2Client,
    });

    const response =
      await gmail.users.messages.list({
        userId: "me",
        maxResults: 10,
        q: `from:${email} newer_than:90d`,
      });

    const messages =
      response.data.messages || [];

    for (const message of messages) {
      if (!message.id) {
        continue;
      }

      const fullMessage =
        await gmail.users.messages.get({
          userId: "me",
          id: message.id,
          format: "metadata",
          metadataHeaders: ["From"],
        });

      const headers =
        fullMessage.data.payload?.headers || [];

      const fromHeader = String(
        headers.find(
          (header) =>
            String(header.name || "").toLowerCase() ===
            "from"
        )?.value || ""
      );

      const displayName =
        extractDisplayName(
          fromHeader,
          email
        );

      if (displayName) {
        return displayName;
      }
    }
  } catch (error) {
    console.warn(
      "Could not retrieve Gmail display name:",
      error
    );
  }

  return "";
}

/*
 * Normalizes the greeting only.
 *
 * Examples:
 * Hi,                  -> Hi Rizwan,
 * Hi there,            -> Hi Rizwan,
 * Hello,               -> Hi Rizwan,
 * Hello John,          -> Hi Rizwan,
 * Dear John,           -> Hi Rizwan,
 *
 * Signature is NOT changed here.
 */
function addGreeting(
  reply: string,
  recipientFullName: string,
  email: string
) {
  const trimmed = reply.trim();

  if (!trimmed) {
    return trimmed;
  }

  const firstName = getFirstName(
    recipientFullName,
    email
  );

  if (!firstName) {
    return trimmed;
  }

  const greetingPattern =
    /^(hi|hello|hey|dear)\b[^\n]*(?:,|!|:)?\s*/i;

  const match = trimmed.match(greetingPattern);

  if (match) {
    const afterGreeting = trimmed
      .slice(match[0].length)
      .trim();

    if (afterGreeting) {
      return `Hi ${firstName},\n\n${afterGreeting}`;
    }

    return `Hi ${firstName},`;
  }

  return `Hi ${firstName},\n\n${trimmed}`;
}

function addSignature(
  body: string,
  signature?: string | null
) {
  const trimmed = body.trim();

  const signatureText =
    signature?.trim() ||
    DEFAULT_SIGNATURE.trim();

  if (!trimmed) {
    return signatureText;
  }

  /*
   * Keep the sender signature exactly as configured.
   * We do NOT remove "Best regards, Tayyab Niaz".
   */
  if (
    trimmed
      .toLowerCase()
      .includes(signatureText.toLowerCase())
  ) {
    return trimmed;
  }

  return `${trimmed}\n\n${signatureText}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const leadId = String(
      body?.leadId || ""
    ).trim();

    const reply = String(
      body?.reply || ""
    ).trim();

    const requestedGmailAccountId =
      String(
        body?.gmailAccountId || ""
      ).trim();

    if (!leadId) {
      return NextResponse.json(
        {
          error: "leadId is required",
        },
        { status: 400 }
      );
    }

    if (!reply) {
      return NextResponse.json(
        {
          error: "Reply text is required",
        },
        { status: 400 }
      );
    }

    if (!requestedGmailAccountId) {
      return NextResponse.json(
        {
          error:
            "Please select a Gmail account before sending.",
        },
        { status: 400 }
      );
    }

    const lead =
      await db.lead.findUnique({
        where: {
          id: leadId,
        },
      });

    if (!lead) {
      return NextResponse.json(
        {
          error: "Lead not found",
        },
        { status: 404 }
      );
    }

    const gmailAccount =
      await db.gmailAccount.findUnique({
        where: {
          id: requestedGmailAccountId,
        },
      });

    if (!gmailAccount) {
      return NextResponse.json(
        {
          error:
            "Selected Gmail account was not found.",
        },
        { status: 404 }
      );
    }

    /*
     * First use the name already saved on the lead.
     */
    let recipientFullName =
      lead.name?.trim() || "";

    /*
     * If no name is saved, try Gmail history.
     */
    if (!recipientFullName) {
      recipientFullName =
        await getGmailRecipientName(
          lead.email,
          gmailAccount.refreshToken
        );
    }

    /*
     * If Gmail history doesn't give us a name,
     * derive a name from the email address.
     */
    if (!recipientFullName) {
      recipientFullName =
        fallbackNameFromEmail(
          lead.email
        );
    }

    /*
     * Normalize greeting:
     *
     * "M rizwan" -> "Hi Rizwan,"
     */
    const withGreeting =
      addGreeting(
        reply,
        recipientFullName,
        lead.email
      );

    /*
     * Add the configured Gmail signature.
     * Signature is preserved.
     */
    const finalBody =
      addSignature(
        withGreeting,
        gmailAccount.signature
      );

    const subject =
      "Re: Guest Post & Content Collaboration";

    const result = await sendGmailMessage({
  refreshToken: gmailAccount.refreshToken,
  to: lead.email,
  subject,
  body: finalBody,
  signature: gmailAccount.signature,
});

    await db.message.create({
      data: {
        leadId: lead.id,
        direction: "OUTBOUND",
        body: finalBody,
        aiGenerated: true,
        approved: true,
        providerMessageId:
          result?.id ?? null,
        threadId:
          result?.threadId ?? null,
      },
    });

    await db.lead.update({
      where: {
        id: lead.id,
      },
      data: {
        status: "CONTACTED",
      },
    });

    return NextResponse.json({
      success: true,
      message:
        "Email sent successfully.",
      messageId:
        result?.id ?? null,
      gmailAccount: {
        id: gmailAccount.id,
        email:
          gmailAccount.email,
      },
      recipientName:
        getFirstName(
          recipientFullName,
          lead.email
        ),
    });
  } catch (error) {
    console.error(
      "Gmail send error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to send email",
      },
      {
        status: 500,
      }
    );
  }
}