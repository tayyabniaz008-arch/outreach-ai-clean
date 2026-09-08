import { db } from "@/lib/db";
import { sendGmailMessage } from "@/lib/gmail";

export type CampaignSendResult = {
  success: boolean;
  sent: number;
  skipped: number;
  errors: {
    leadId: string;
    email: string;
    error: string;
  }[];
  sentToday: number;
  dailyLimit: number;
  remaining: number;
  status: string;
};

function getDayRange() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(
    tomorrowStart.getDate() + 1
  );

  return {
    todayStart,
    tomorrowStart,
  };
}

// 🔥 NEW: Placeholder replacement function
function replacePlaceholders(text: string, lead: any): string {
  return text
    .replace(/\[Name\]/g, lead.name || "there")
    .replace(/\[Website\]/g, lead.website || "your website")
    .replace(/\[Email\]/g, lead.email || "")
    .replace(/\[Company\]/g, lead.company || "your company");
}

// 🔥 NEW: Signature ko properly format karne ke liye
function formatSignature(signature: string | null): string {
  if (!signature) return "";
  
  // Ensure signature has proper spacing
  const trimmed = signature.trim();
  if (trimmed && !trimmed.startsWith("\n\n")) {
    return `\n\n${trimmed}`;
  }
  return trimmed;
}

export async function sendCampaignNow(
  campaignId: string
): Promise<CampaignSendResult> {
  const campaign =
    await db.campaign.findUnique({
      where: {
        id: campaignId,
      },
      include: {
        leads: {
          include: {
            lead: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        gmailAccount: {
          select: {
            id: true,
            email: true,
            refreshToken: true,
            signature: true,
          },
        },
      },
    });

  if (!campaign) {
    throw new Error("Campaign not found");
  }

  if (campaign.status === "PAUSED") {
    throw new Error(
      "This campaign is paused. Activate it before sending."
    );
  }

  if (!campaign.gmailAccount) {
    throw new Error(
      "No Gmail account is assigned to this campaign. Assign a Gmail account first."
    );
  }

  const {
    todayStart,
    tomorrowStart,
  } = getDayRange();

  const sentToday =
    await db.campaignLead.count({
      where: {
        campaignId: campaign.id,
        sentAt: {
          gte: todayStart,
          lt: tomorrowStart,
        },
      },
    });

  const remainingToday = Math.max(
    campaign.dailyLimit - sentToday,
    0
  );

  if (remainingToday === 0) {
    return {
      success: false,
      sent: 0,
      skipped: 0,
      errors: [],
      sentToday,
      dailyLimit:
        campaign.dailyLimit,
      remaining: 0,
      status: campaign.status,
    };
  }

  await db.campaign.update({
    where: {
      id: campaign.id,
    },
    data: {
      status: "ACTIVE",
      lastRunAt: new Date(),
    },
  });

  let sent = 0;
  let skipped = 0;

  const errors: {
    leadId: string;
    email: string;
    error: string;
  }[] = [];

  // 🔥 Signature ko format karein
  const signature = formatSignature(campaign.gmailAccount.signature);

  for (const assignment of campaign.leads) {
    if (sent >= remainingToday) {
      break;
    }

    const lead = assignment.lead;

    try {
      if (lead.deletedAt !== null) {
        skipped++;
        continue;
      }

      if (lead.status === "OPTED_OUT") {
        skipped++;
        continue;
      }

      if (lead.status === "BOUNCED") {
        skipped++;
        continue;
      }

      if (assignment.sentAt !== null) {
        skipped++;
        continue;
      }

      const alreadyContacted =
        await db.message.findFirst({
          where: {
            leadId: lead.id,
            direction: "OUTBOUND",
          },
          select: {
            id: true,
          },
        });

      if (alreadyContacted) {
        skipped++;
        continue;
      }

      // 🔥 NEW: Placeholders ko replace karein
      const personalizedTemplate = replacePlaceholders(campaign.template, lead);
      
      // 🔥 Signature ko add karein (with proper formatting)
      const emailBody = `${personalizedTemplate.trim()}${signature}`;

      const gmailResult =
        await sendGmailMessage({
          refreshToken:
            campaign.gmailAccount
              .refreshToken,
          to: lead.email,
          subject: campaign.name,
          body: emailBody,
        });

      await db.message.create({
        data: {
          leadId: lead.id,
          direction: "OUTBOUND",
          body: emailBody,
          aiGenerated: false,
          approved: true,
          providerMessageId:
            gmailResult?.id ?? null,
          threadId:
            gmailResult?.threadId ?? null,
        },
      });

      await db.campaignLead.update({
        where: {
          id: assignment.id,
        },
        data: {
          sentAt: new Date(),
          status: "SENT",
          error: null,
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

      sent++;

      if (sent < remainingToday) {
        await new Promise(
          (resolve) =>
            setTimeout(resolve, 1000)
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to send email";

      errors.push({
        leadId: lead.id,
        email: lead.email,
        error: errorMessage,
      });

      await db.campaignLead
        .update({
          where: {
            id: assignment.id,
          },
          data: {
            status: "ERROR",
            error: errorMessage,
          },
        })
        .catch(() => {});
    }
  }

  const totalCampaignSent =
    campaign.sentCount + sent;

  const totalCampaignSkipped =
    campaign.skippedCount + skipped;

  const newStatus =
    errors.length > 0 && sent === 0
      ? "FAILED"
      : "ACTIVE";

  const updatedCampaign =
    await db.campaign.update({
      where: {
        id: campaign.id,
      },
      data: {
        status: newStatus,
        sentCount:
          totalCampaignSent,
        skippedCount:
          totalCampaignSkipped,
        lastRunAt: new Date(),
      },
    });

  const newSentToday =
    sentToday + sent;

  const newRemainingToday =
    Math.max(
      campaign.dailyLimit -
        newSentToday,
      0
    );

  return {
    success: true,
    sent,
    skipped,
    errors,
    sentToday: newSentToday,
    dailyLimit:
      campaign.dailyLimit,
    remaining:
      newRemainingToday,
    status:
      updatedCampaign.status,
  };
}