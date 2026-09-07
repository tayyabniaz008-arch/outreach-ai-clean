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

    const lead = await db.lead.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!lead) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ lead });
  } catch (error) {
    console.error(
      "Contact history loading error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to load contact history",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id } = await context.params;

    const lead = await db.lead.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        deletedAt: true,
      },
    });

    if (!lead) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      );
    }

    if (lead.deletedAt) {
      return NextResponse.json({
        success: true,
        message: "Contact is already archived.",
        deletedId: id,
      });
    }

    await db.$transaction(async (tx) => {
      await tx.campaignLead.deleteMany({
        where: { leadId: id },
      });

      await tx.lead.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    });

    return NextResponse.json({
      success: true,
      message:
        "Contact archived while preserving message history.",
      deletedId: id,
    });
  } catch (error) {
    console.error(
      "Contact archive error:",
      error
    );

    return NextResponse.json(
      { error: "Failed to archive contact" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  _req: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id } = await context.params;

    const lead = await db.lead.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        deletedAt: true,
      },
    });

    if (!lead) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      );
    }

    const restoredLead =
      await db.lead.update({
        where: { id },
        data: { deletedAt: null },
      });

    return NextResponse.json({
      success: true,
      message:
        lead.deletedAt
          ? "Contact restored successfully."
          : "Contact is already active.",
      lead: restoredLead,
    });
  } catch (error) {
    console.error(
      "Contact restore error:",
      error
    );

    return NextResponse.json(
      { error: "Failed to restore contact" },
      { status: 500 }
    );
  }
}