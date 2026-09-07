
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const email = String(
      body?.email || ""
    )
      .trim()
      .toLowerCase();

    const messageBody = String(
      body?.body || ""
    ).trim();

    if (!email) {
      return NextResponse.json(
        {
          error: "Sender email is required",
        },
        { status: 400 }
      );
    }

    if (!messageBody) {
      return NextResponse.json(
        {
          error: "Message body is required",
        },
        { status: 400 }
      );
    }

    const lead = await db.lead.findUnique({
      where: {
        email,
      },
    });

    if (!lead) {
      return NextResponse.json(
        {
          error: "Unknown sender",
        },
        { status: 404 }
      );
    }

    const optOut =
      /unsubscribe|remove me|stop emailing|do not contact|do not email/i.test(
        messageBody
      );

    const message = await db.message.create({
      data: {
        leadId: lead.id,
        direction: "INBOUND",
        body: messageBody,
        aiGenerated: false,
        approved: false,
      },
    });

    await db.lead.update({
      where: {
        id: lead.id,
      },
      data: {
        status: optOut
          ? "OPTED_OUT"
          : "REPLIED",

        mode: optOut
          ? "DRAFT"
          : lead.mode,
      },
    });

    return NextResponse.json({
      ok: true,
      optOut,
      messageId: message.id,
      leadId: lead.id,
    });
  } catch (error) {
    console.error(
      "Inbound webhook error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to process inbound message",
      },
      {
        status: 500,
      }
    );
  }
}

