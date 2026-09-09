import { db } from "@/lib/db";
import { sendGmailMessage } from "@/lib/gmail";

// ⏱️ Follow-up settings
const FOLLOWUP_DELAY_DAYS = 3;
const MAX_FOLLOWUPS = 2;

// 📧 Subject lines based on campaign
function getSubjectLine(attempt: number, lead: any, campaign: any): string {
  const website = lead.website || "your website";

  // 🔥 Check if campaign has custom follow-up subjects
  if (attempt === 1 && campaign.followupSubject1) {
    return campaign.followupSubject1
      .replace(/\[Website\]/g, website)
      .replace(/\[Name\]/g, lead.name || "there");
  }
  if (attempt === 2 && campaign.followupSubject2) {
    return campaign.followupSubject2
      .replace(/\[Website\]/g, website)
      .replace(/\[Name\]/g, lead.name || "there");
  }

  // Default fallback
  switch (attempt) {
    case 1:
      return `Following up: Guest Post for ${website}`;
    case 2:
      return `Last chance: Guest Post Opportunity`;
    default:
      return `Guest Post Opportunity: ${website}`;
  }
}

// 📝 Templates based on campaign
function getFollowupTemplate(attempt: number, lead: any, campaign: any): string {
  const name = lead.name || "there";
  const website = lead.website || "your website";

  // 🔥 Check if campaign has custom follow-up templates
  if (attempt === 1 && campaign.followupTemplate1) {
    return campaign.followupTemplate1
      .replace(/\[Name\]/g, name)
      .replace(/\[Website\]/g, website);
  }
  if (attempt === 2 && campaign.followupTemplate2) {
    return campaign.followupTemplate2
      .replace(/\[Name\]/g, name)
      .replace(/\[Website\]/g, website);
  }

  // Default fallback templates
  if (attempt === 1) {
    return `Hi ${name},

I hope you're doing well. I just wanted to follow up on my previous email regarding the guest post collaboration opportunity for ${website}.

I know you're busy, but I'd love to hear your thoughts when you get a chance. I think my content ideas would be a great fit for your audience.

Let me know if you have any questions or if you'd like to see some sample articles.

Best regards,
Tayyab Niaz
Freelance Blogger Expert`;
  }

  return `Hi ${name},

This will be my last follow-up. I don't want to bother you further, but I wanted to give you one final chance to consider the guest post opportunity for ${website}.

If you're not interested, just let me know and I won't contact you again about this. But if you are interested or have any questions, I'd love to hear back from you.

Either way, I appreciate your time.

Best regards,
Tayyab Niaz
Freelance Blogger Expert`;
}

export async function sendFollowUps() {
  // Calculate date for follow-up
  const followupDate = new Date();
  followupDate.setDate(followupDate.getDate() - FOLLOWUP_DELAY_DAYS);

  // Find leads that need follow-up
  const leads = await (db as any).lead.findMany({
    where: {
      status: "CONTACTED",
      deletedAt: null,
      mode: "OUTBOUND",
      messages: {
        some: {
          direction: "OUTBOUND",
          createdAt: {
            lte: followupDate,
          },
        },
        none: {
          direction: "INBOUND",
        },
      },
    },
    include: {
      messages: {
        where: {
          direction: "OUTBOUND",
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      },
    },
  });

  const results: {
    leadId: string;
    email: string;
    attempt: number;
    status: string;
    error?: string;
  }[] = [];

  for (const lead of leads) {
    // Count how many outbound messages already sent
    const outboundCount = (lead.messages || []).filter(
      (msg: any) => msg.direction === "OUTBOUND"
    ).length;

    // If already sent 3 messages (1 initial + 2 follow-ups), skip
    if (outboundCount >= 3) {
      continue;
    }

    // Calculate which follow-up attempt this is
    const attempt = outboundCount; // 1 = first follow-up, 2 = second follow-up

    // Find campaign for this lead
    const campaignLead = await (db as any).campaignLead.findFirst({
      where: {
        leadId: lead.id,
        sentAt: { not: null },
      },
      include: {
        campaign: {
          include: {
            gmailAccount: true,
          },
        },
      },
    });

    if (!campaignLead?.campaign?.gmailAccount) {
      continue;
    }

    try {
      const campaign = campaignLead.campaign;
      const gmailAccount = campaign.gmailAccount;

      if (!gmailAccount) {
        continue;
      }

      // 🔥 Generate follow-up content using campaign-specific settings
      const subject = getSubjectLine(attempt, lead, campaign);
      const body = getFollowupTemplate(attempt, lead, campaign);
      const signature = gmailAccount.signature || "\n\nTayyab Niaz\nFreelance Blogger Expert";

      const fullBody = `${body}\n\n${signature}`;

      // Send email
      const gmailResult = await sendGmailMessage({
        refreshToken: gmailAccount.refreshToken,
        to: lead.email,
        subject: subject,
        body: fullBody,
      });

      // Save message in database
      await (db as any).message.create({
        data: {
          leadId: lead.id,
          direction: "OUTBOUND",
          body: fullBody,
          aiGenerated: false,
          approved: true,
          providerMessageId: gmailResult?.id ?? null,
          threadId: gmailResult?.threadId ?? null,
        },
      });

      // Update campaign lead
      await (db as any).campaignLead.update({
        where: {
          id: campaignLead.id,
        },
        data: {
          sentAt: new Date(),
          status: "SENT",
        },
      });

      results.push({
        leadId: lead.id,
        email: lead.email,
        attempt: attempt,
        status: "sent",
      });

      // ⏱️ 1 minute delay between follow-ups
      await new Promise((resolve) => setTimeout(resolve, 60000));

    } catch (error) {
      results.push({
        leadId: lead.id,
        email: lead.email,
        attempt: attempt,
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return {
    total: leads.length,
    sent: results.filter((r) => r.status === "sent").length,
    failed: results.filter((r) => r.status === "failed").length,
    results,
  };
}