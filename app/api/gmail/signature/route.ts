import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const DEFAULT_SIGNATURE = "\n\nTayyab Niaz\nFreelance Blogger Expert";

export async function GET() {
  try {
    const gmailAccount = await db.gmailAccount.findFirst({
      orderBy: { createdAt: "desc" },
      select: { id: true, email: true, signature: true },
    });

    if (!gmailAccount) {
      return NextResponse.json(
        { error: "No Gmail account is connected." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      id: gmailAccount.id,
      email: gmailAccount.email,
      signature: gmailAccount.signature || DEFAULT_SIGNATURE,
    });
  } catch (error) {
    console.error("Gmail signature load error:", error);
    return NextResponse.json(
      { error: "Failed to load Gmail signature" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const signature = String(body?.signature ?? "");

    if (signature.length > 2000) {
      return NextResponse.json(
        { error: "Signature is too long. Maximum is 2000 characters." },
        { status: 400 }
      );
    }

    const gmailAccount = await db.gmailAccount.findFirst({
      orderBy: { createdAt: "desc" },
    });

    if (!gmailAccount) {
      return NextResponse.json(
        { error: "No Gmail account is connected." },
        { status: 400 }
      );
    }

    const updated = await db.gmailAccount.update({
      where: { id: gmailAccount.id },
      data: { signature },
      select: { id: true, email: true, signature: true },
    });

    return NextResponse.json({
      success: true,
      id: updated.id,
      email: updated.email,
      signature: updated.signature,
    });
  } catch (error) {
    console.error("Gmail signature save error:", error);
    return NextResponse.json(
      { error: "Failed to save Gmail signature" },
      { status: 500 }
    );
  }
}
