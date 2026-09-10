import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Total contacts
    const totalContacts = await db.lead.count({
      where: { deletedAt: null },
    });

    // Total emails sent (OUTBOUND messages)
    const emailsSent = await db.message.count({
      where: { direction: "OUTBOUND" },
    });

    // Total replies (INBOUND messages)
    const totalReplies = await db.message.count({
      where: { direction: "INBOUND" },
    });

    // Reply rate calculation
    const replyRate =
      emailsSent > 0
        ? ((totalReplies / emailsSent) * 100).toFixed(1)
        : "0";

    // Interested contacts
    const interestedCount = await db.lead.count({
      where: {
        status: "INTERESTED",
        deletedAt: null,
      },
    });

    // Campaign stats
    const totalCampaigns = await db.campaign.count();
    const activeCampaigns = await db.campaign.count({
      where: { status: "ACTIVE" },
    });

    // Messages by direction (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSent = await db.message.count({
      where: {
        direction: "OUTBOUND",
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    const recentReplies = await db.message.count({
      where: {
        direction: "INBOUND",
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalContacts,
        emailsSent,
        totalReplies,
        replyRate,
        interestedCount,
        totalCampaigns,
        activeCampaigns,
        recentSent,
        recentReplies,
      },
    });
  } catch (error) {
    console.error("Reports API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load reports",
      },
      { status: 500 }
    );
  }
}