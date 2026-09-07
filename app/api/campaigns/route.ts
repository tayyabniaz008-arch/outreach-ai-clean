import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const campaigns = await db.campaign.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        gmailAccount: {
          select: {
            id: true,
            email: true,
          },
        },
        _count: {
          select: {
            leads: true,
          },
        },
      },
    });

    return NextResponse.json({
      campaigns,
    });
  } catch (error) {
    console.error(
      "Campaign loading error:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to load campaigns",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const name = String(
      body?.name || ""
    ).trim();

    const template = String(
      body?.template || ""
    ).trim();

    const dailyLimit = Number(
      body?.dailyLimit ?? 30
    );

    const gmailAccountId = String(
      body?.gmailAccountId || ""
    ).trim();

    if (!name) {
      return NextResponse.json(
        {
          error:
            "Campaign name is required",
        },
        {
          status: 400,
        }
      );
    }

    if (!template) {
      return NextResponse.json(
        {
          error:
            "Campaign template is required",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isInteger(
        dailyLimit
      ) ||
      dailyLimit < 1
    ) {
      return NextResponse.json(
        {
          error:
            "Daily limit must be at least 1",
        },
        {
          status: 400,
        }
      );
    }

    if (!gmailAccountId) {
      return NextResponse.json(
        {
          error:
            "Please select a Gmail account",
        },
        {
          status: 400,
        }
      );
    }

    const gmailAccount =
      await db.gmailAccount.findUnique({
        where: {
          id: gmailAccountId,
        },
      });

    if (!gmailAccount) {
      return NextResponse.json(
        {
          error:
            "Selected Gmail account was not found",
        },
        {
          status: 400,
        }
      );
    }

    const campaign =
      await db.campaign.create({
        data: {
          name,
          template,
          dailyLimit,
          gmailAccountId,
        },
        include: {
          gmailAccount: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      });

    return NextResponse.json(
      {
        campaign,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Campaign creation error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to create campaign",
      },
      {
        status: 500,
      }
    );
  }
}