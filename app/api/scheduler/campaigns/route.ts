import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendCampaignNow } from "@/lib/campaign-sender";

export async function POST(
  req: Request
) {
  try {
    const cronSecret =
      process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error(
        "CRON_SECRET is not configured."
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Scheduler security is not configured.",
        },
        { status: 500 }
      );
    }

    const authorization =
      req.headers.get("authorization");

    if (
      authorization !==
      `Bearer ${cronSecret}`
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const campaigns =
      await db.campaign.findMany({
        where: {
          status: "ACTIVE",
        },
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      });

    const results: {
      campaignId: string;
      name: string;
      sent: number;
      skipped: number;
      remaining: number;
      status: string;
      errors: number;
      error?: string;
    }[] = [];

    for (const campaign of campaigns) {
      try {
        const result =
          await sendCampaignNow(
            campaign.id
          );

        results.push({
          campaignId:
            campaign.id,
          name: campaign.name,
          sent: result.sent,
          skipped:
            result.skipped,
          remaining:
            result.remaining,
          status:
            result.status,
          errors:
            result.errors.length,
        });
      } catch (error) {
        results.push({
          campaignId:
            campaign.id,
          name: campaign.name,
          sent: 0,
          skipped: 0,
          remaining: 0,
          status: "ERROR",
          errors: 1,
          error:
            error instanceof Error
              ? error.message
              : "Scheduler failed",
        });
      }
    }

    return NextResponse.json({
      success: true,
      campaignsChecked:
        campaigns.length,
      results,
    });
  } catch (error) {
    console.error(
      "Campaign scheduler error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to run campaign scheduler",
      },
      { status: 500 }
    );
  }
}