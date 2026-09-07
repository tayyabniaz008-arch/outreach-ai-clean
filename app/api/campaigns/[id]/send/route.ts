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
          skipped: result.skipped,
          sentToday: result.sentToday,
          dailyLimit: result.dailyLimit,
          remaining: result.remaining,
          status: result.status,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      sent: result.sent,
      skipped: result.skipped,
      errors: result.errors,
      sentToday: result.sentToday,
      dailyLimit: result.dailyLimit,
      remaining: result.remaining,
      status: result.status,
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
          message.includes("No Gmail account")
          ? 400
          : 500;

    return NextResponse.json(
      {
        error: message,
      },
      { status }
    );
  }
}