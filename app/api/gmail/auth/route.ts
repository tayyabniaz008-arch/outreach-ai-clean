import { NextResponse } from "next/server";
import { getGmailAuthUrl } from "@/lib/gmail";

export async function GET() {
  try {
    const url = getGmailAuthUrl();

    return NextResponse.redirect(url);
  } catch (error) {
    console.error(
      "Gmail OAuth start error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to start Gmail authorization",
      },
      {
        status: 500,
      }
    );
  }
}