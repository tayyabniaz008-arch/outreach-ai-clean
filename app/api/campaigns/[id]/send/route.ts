import { NextResponse } from "next/server";
import { sendCampaignNow } from "@/lib/campaign-sender";

export async function POST(
  _req: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id } = await context.params;

    const result = await sendCampaignNow(id);

    // Agar daily limit reach ho gayi
    if (
      result.success === false &&
      result.remaining === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Daily sending limit has already been reached for this campaign.",
          sent: 0,
          skipped: result.skipped || 0,
          sentToday: result.sentToday || 0,
          dailyLimit: result.dailyLimit || 0,
          remaining: result.remaining || 0,
          status: result.status || "PAUSED",
        },
        { status: 400 }
      );
    }

    // Agar partial success ho (kuch sent, kuch failed)
    if (result.errors && result.errors.length > 0) {
      return NextResponse.json({
        success: true,
        sent: result.sent || 0,
        skipped: result.skipped || 0,
        errors: result.errors,
        sentToday: result.sentToday || 0,
        dailyLimit: result.dailyLimit || 0,
        remaining: result.remaining || 0,
        status: result.status || "ACTIVE",
        partial: true,
      });
    }

    // Full success
    return NextResponse.json({
      success: true,
      sent: result.sent || 0,
      skipped: result.skipped || 0,
      errors: [],
      sentToday: result.sentToday || 0,
      dailyLimit: result.dailyLimit || 0,
      remaining: result.remaining || 0,
      status: result.status || "ACTIVE",
    });
  } catch (error) {
    console.error(
      "Campaign send error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Failed to send campaign emails";

    const status =
      message === "Campaign not found"
        ? 404
        : message.includes("paused") ||
          message.includes("No Gmail account") ||
          message.includes("No Gmail account assigned")
          ? 400
          : 500;

    return NextResponse.json(
      {
        error: message,
        sent: 0,
        skipped: 0,
        errors: [],
      },
      { status }
    );
  }
}