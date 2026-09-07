import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const rows = await req.json();
  if (!Array.isArray(rows)) return NextResponse.json({error:"Expected array"}, {status:400});
  let imported = 0;
  for (const row of rows) {
    if (!row.email) continue;
    await db.lead.upsert({
      where: { email: String(row.email).toLowerCase().trim() },
      update: { name: row.name, website: row.website, niche: row.niche },
      create: { email: String(row.email).toLowerCase().trim(), name: row.name, website: row.website, niche: row.niche }
    });
    imported++;
  }
  return NextResponse.json({ imported });
}
