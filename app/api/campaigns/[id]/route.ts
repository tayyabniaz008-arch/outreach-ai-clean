import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function DELETE(
  _request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          error: "Campaign ID is required.",
        },
        { status: 400 }
      );
    }

    const campaign =
      await db.campaign.findUnique({
        where: {
          id,
        },
      });

    if (!campaign) {
      return NextResponse.json(
        {
          error: "Campaign not found.",
        },
        { status: 404 }
      );
    }

    await db.campaign.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Campaign "${campaign.name}" deleted successfully.`,
      campaignId: id,
    });
  } catch (error) {
    console.error(
      "Campaign delete error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete campaign",
      },
      { status: 500 }
    );
  }
}