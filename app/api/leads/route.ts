import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const leads = await db.lead.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      leads,
    });
  } catch (error) {
    console.error(
      "Lead loading error:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to load leads",
      },
      {
        status: 500,
      }
    );
  }
}