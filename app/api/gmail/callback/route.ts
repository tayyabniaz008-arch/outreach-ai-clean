import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  getGmailTokens,
  getGmailAccountEmail,
} from "@/lib/gmail";

export async function GET(
  request: Request
) {
  try {
    const url = new URL(
      request.url
    );

    const code =
      url.searchParams.get(
        "code"
      );

    const error =
      url.searchParams.get(
        "error"
      );

    // =========================
    // Google authorization error
    // =========================

    if (error) {
      return NextResponse.json(
        {
          error: `Google authorization failed: ${error}`,
        },
        { status: 400 }
      );
    }

    // =========================
    // Authorization code missing
    // =========================

    if (!code) {
      return NextResponse.json(
        {
          error:
            "Authorization code is missing.",
        },
        { status: 400 }
      );
    }

    // =========================
    // Exchange code for tokens
    // =========================

    const tokens =
      await getGmailTokens(
        code
      );

    // =========================
    // Refresh token required
    // =========================

    if (!tokens.refresh_token) {
      return NextResponse.json(
        {
          error:
            "Google did not return a refresh token. Remove OutreachAI access from Google and authorize again.",
        },
        { status: 400 }
      );
    }

    // =========================
    // ID token required
    // =========================

    if (!tokens.id_token) {
      return NextResponse.json(
        {
          error:
            "Google did not return an ID token.",
        },
        { status: 400 }
      );
    }

    // =========================
    // Get Gmail account email
    // =========================

    const email =
      await getGmailAccountEmail(
        tokens.id_token
      );

    // =========================
    // Save / update Gmail account
    // =========================

    const account =
      await db.gmailAccount.upsert({
        where: {
          email,
        },
        create: {
          email,
          refreshToken:
            tokens.refresh_token,
        },
        update: {
          refreshToken:
            tokens.refresh_token,
        },
      });

    console.log(
      "Gmail account connected:",
      account.email
    );

    // =========================
    // Redirect back to app
    // =========================

    return NextResponse.redirect(
      new URL(
        "/?gmail=connected",
        request.url
      )
    );
  } catch (error) {
    console.error(
      "Gmail OAuth callback error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to connect Gmail account",
      },
      { status: 500 }
    );
  }
}