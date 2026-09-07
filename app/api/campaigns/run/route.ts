
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST() {
  try {
    // Only ACTIVE campaigns are allowed to run automatically.
    const campaigns =
      await db.campaign.findMany({
        where: {
          status: "ACTIVE",
        },
        orderBy: {
          createdAt: "asc",
        },
      });

    if (campaigns.length === 0) {
      return NextResponse.json({
        success: true,
        message:
          "No active campaigns are ready to run.",
        campaigns: [],
      });
    }

    const appUrl =
      process.env.APP_URL ||
      "http://localhost:3000";

    const results = [];

    for (const campaign of campaigns) {
      try {
        const response =
          await fetch(
            `${appUrl}/api/campaigns/${campaign.id}/send`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
            }
          );

        const data =
          await response
            .json()
            .catch(() => ({}));

        results.push({
          campaignId:
            campaign.id,
          campaignName:
            campaign.name,
          ok: response.ok,
          result: data,
        });
      } catch (error) {
        console.error(
          `Campaign run failed for ${campaign.name}:`,
          error
        );

        results.push({
          campaignId:
            campaign.id,
          campaignName:
            campaign.name,
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : "Campaign run failed",
        });
      }
    }

    return NextResponse.json({
      success: true,
      campaigns: results,
    });
  } catch (error) {
    console.error(
      "Campaign scheduler error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to run campaigns",
      },
      { status: 500 }
    );
  }
}