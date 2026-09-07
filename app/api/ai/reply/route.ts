import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { draftReply } from "@/lib/ai";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const leadId = String(
      body?.leadId || ""
    ).trim();

    if (!leadId) {
      return NextResponse.json(
        {
          error: "leadId is required",
        },
        { status: 400 }
      );
    }

    const lead = await db.lead.findUnique({
      where: {
        id: leadId,
      },
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
        {
          error: "Lead not found",
        },
        { status: 404 }
      );
    }

    /*
     * Find the newest incoming message.
     */
    const latestInbound = [...lead.messages]
      .reverse()
      .find(
        (message) =>
          String(message.direction)
            .toUpperCase() === "INBOUND"
      );

    if (!latestInbound?.body?.trim()) {
      return NextResponse.json(
        {
          error:
            "No incoming reply found for this contact.",
        },
        { status: 400 }
      );
    }

    /*
     * Give AI the latest 20 messages so it can understand
     * the actual conversation before replying.
     */
    const history = lead.messages
      .slice(-20)
      .map((message) => ({
        direction: String(
          message.direction
        ).toUpperCase(),
        body: String(
          message.body || ""
        ).trim(),
      }))
      .filter(
        (message) => message.body.length > 0
      );

    /*
     * Generate the reply based on the latest inbound
     * message and full recent conversation.
     */
    const reply = (
      await draftReply({
        website: lead.website,
        niche: lead.niche,
        history,
      })
    ).trim();

    /*
     * AI could return an empty response.
     */
    if (!reply) {
      return NextResponse.json(
        {
          error:
            "AI could not generate a reply for this message.",
        },
        { status: 400 }
      );
    }

    /*
     * If recipient wants no more emails,
     * immediately mark the lead as OPTED_OUT.
     */
    if (
      reply.trim().toUpperCase() ===
      "OPT_OUT"
    ) {
      await db.lead.update({
        where: {
          id: lead.id,
        },
        data: {
          status: "OPTED_OUT",
          mode: "DRAFT",
        },
      });

      return NextResponse.json({
        reply: "OPT_OUT",
        latestInbound: latestInbound.body,
        recipient: {
          id: lead.id,
          name: lead.name,
          email: lead.email,
        },
        status: "OPTED_OUT",
      });
    }

    /*
     * Return everything the frontend needs.
     */
    return NextResponse.json({
      success: true,
      reply,
      latestInbound: latestInbound.body,
      recipient: {
        id: lead.id,
        name: lead.name,
        email: lead.email,
      },
      messageCount: history.length,
    });
  } catch (error) {
    console.error(
      "AI reply error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate AI reply",
      },
      {
        status: 500,
      }
    );
  }
}