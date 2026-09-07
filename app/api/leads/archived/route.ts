import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const leads = await db.lead.findMany({
      where: {
        deletedAt: {
          not: null,
        },
      },
      orderBy: {
        deletedAt: "desc",
      },
    });

    return NextResponse.json({
      leads,
    });
  } catch (error) {
    console.error(
      "Archived leads loading error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to load archived contacts",
      },
      {
        status: 500,
      }
    );
  }
}