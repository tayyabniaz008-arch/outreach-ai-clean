
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _req: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id } = await context.params;

    const campaign =
      await db.campaign.findUnique({
        where: { id },
        include: {
          leads: {
            where: {
              lead: {
                deletedAt: null,
              },
            },
            include: {
              lead: true,
            },
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      leads: campaign.leads.map(
        (
          item: typeof campaign.leads[number]
        ) => item.lead
      ),
    });
  } catch (error) {
    console.error(
      "Campaign leads loading error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to load campaign contacts",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id } = await context.params;

    const body = await req.json();

    const leadIds: string[] =
      Array.isArray(body?.leadIds)
        ? body.leadIds
            .filter(
              (
                value: unknown
              ): value is string =>
                typeof value === "string"
            )
            .filter(Boolean)
        : [];

    const campaign =
      await db.campaign.findUnique({
        where: { id },
      });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    if (leadIds.length > 0) {
      const existingLeads =
        await db.lead.findMany({
          where: {
            id: {
              in: leadIds,
            },
            deletedAt: null,
          },
          select: {
            id: true,
          },
        });

      if (
        existingLeads.length !==
        leadIds.length
      ) {
        return NextResponse.json(
          {
            error:
              "One or more contacts were not found or are archived.",
          },
          { status: 400 }
        );
      }
    }

    await db.$transaction(
      async (tx) => {
        await tx.campaignLead.deleteMany({
          where: {
            campaignId: id,
          },
        });

        if (leadIds.length > 0) {
          await tx.campaignLead.createMany({
            data: leadIds.map(
              (leadId: string) => ({
                campaignId: id,
                leadId,
              })
            ),
            skipDuplicates: true,
          });
        }
      }
    );

    const updatedCampaign =
      await db.campaign.findUnique({
        where: { id },
        include: {
          leads: {
            where: {
              lead: {
                deletedAt: null,
              },
            },
            include: {
              lead: true,
            },
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      });

    if (!updatedCampaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      leads: updatedCampaign.leads.map(
        (
          item: typeof updatedCampaign.leads[number]
        ) => item.lead
      ),
    });
  } catch (error) {
    console.error(
      "Campaign contacts save error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to save campaign contacts",
      },
      { status: 500 }
    );
  }
}

