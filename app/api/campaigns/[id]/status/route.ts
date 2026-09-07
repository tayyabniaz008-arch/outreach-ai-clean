import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const ALLOWED_STATUSES = [
  "DRAFT",
  "ACTIVE",
  "PAUSED",
] as const;

type CampaignStatus =
  (typeof ALLOWED_STATUSES)[number];

export async function PATCH(
  req: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id } = await context.params;

    const body = await req.json();

    const status = String(
      body?.status || ""
    )
      .trim()
      .toUpperCase();

    if (
      !ALLOWED_STATUSES.includes(
        status as CampaignStatus
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid campaign status. Use DRAFT, ACTIVE, or PAUSED.",
        },
        { status: 400 }
      );
    }

    const campaign =
      await db.campaign.findUnique({
        where: { id },
      });

    if (!campaign) {
      return NextResponse.json(
        {
          error: "Campaign not found",
        },
        { status: 404 }
      );
    }

    /*
     * FAILED campaigns must first be reset to DRAFT.
     * This prevents directly activating a failed campaign.
     */
    if (
      campaign.status === "FAILED" &&
      status === "ACTIVE"
    ) {
      return NextResponse.json(
        {
          error:
            "Failed campaigns must be set to DRAFT before activating.",
        },
        { status: 400 }
      );
    }

    const updatedCampaign =
      await db.campaign.update({
        where: {
          id,
        },
        data: {
          status,
        },
      });

    return NextResponse.json({
      success: true,

      campaign: {
        id: updatedCampaign.id,
        name: updatedCampaign.name,
        status: updatedCampaign.status,

        sentCount:
          updatedCampaign.sentCount,

        skippedCount:
          updatedCampaign.skippedCount,

        dailyLimit:
          updatedCampaign.dailyLimit,

        lastRunAt:
          updatedCampaign.lastRunAt,
      },
    });
  } catch (error) {
    console.error(
      "Campaign status update error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update campaign status",
      },
      { status: 500 }
    );
  }
}