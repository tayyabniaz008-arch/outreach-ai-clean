import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const DEFAULT_SIGNATURE =
  "\n\nTayyab Niaz\nFreelance Blogger Expert";

// =========================
// Get all Gmail accounts
// =========================

export async function GET() {
  try {
    const accounts =
      await db.gmailAccount.findMany({
        orderBy: {
          createdAt: "asc",
        },
        select: {
          id: true,
          email: true,
          signature: true,
          createdAt: true,
          updatedAt: true,
        },
      });

    return NextResponse.json({
      accounts: accounts.map(
        (account) => ({
          id: account.id,
          email: account.email,
          signature:
            account.signature ||
            DEFAULT_SIGNATURE,
          createdAt:
            account.createdAt,
          updatedAt:
            account.updatedAt,
        })
      ),
    });
  } catch (error) {
    console.error(
      "Gmail accounts GET error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load Gmail accounts",
      },
      { status: 500 }
    );
  }
}

// =========================
// Update Gmail signature
// =========================

export async function PATCH(
  request: Request
) {
  try {
    const body =
      await request.json();

    const accountId =
      typeof body?.accountId ===
      "string"
        ? body.accountId
        : "";

    const signature =
      typeof body?.signature ===
      "string"
        ? body.signature
        : DEFAULT_SIGNATURE;

    if (!accountId) {
      return NextResponse.json(
        {
          error:
            "Gmail account ID is required.",
        },
        { status: 400 }
      );
    }

    const account =
      await db.gmailAccount.findUnique({
        where: {
          id: accountId,
        },
      });

    if (!account) {
      return NextResponse.json(
        {
          error:
            "Gmail account not found.",
        },
        { status: 404 }
      );
    }

    const updatedAccount =
      await db.gmailAccount.update({
        where: {
          id: accountId,
        },
        data: {
          signature,
        },
        select: {
          id: true,
          email: true,
          signature: true,
        },
      });

    return NextResponse.json({
      success: true,
      account: {
        id: updatedAccount.id,
        email:
          updatedAccount.email,
        signature:
          updatedAccount.signature ||
          DEFAULT_SIGNATURE,
      },
    });
  } catch (error) {
    console.error(
      "Gmail account PATCH error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update Gmail account",
      },
      { status: 500 }
    );
  }
}

// =========================
// Disconnect Gmail account
// =========================

export async function DELETE(
  request: Request
) {
  try {
    const url = new URL(
      request.url
    );

    const accountId =
      url.searchParams.get(
        "id"
      )?.trim() || "";

    if (!accountId) {
      return NextResponse.json(
        {
          error:
            "Gmail account ID is required.",
        },
        { status: 400 }
      );
    }

    const account =
      await db.gmailAccount.findUnique({
        where: {
          id: accountId,
        },
      });

    if (!account) {
      return NextResponse.json(
        {
          error:
            "Gmail account not found.",
        },
        { status: 404 }
      );
    }

    await db.gmailAccount.delete({
      where: {
        id: accountId,
      },
    });

    return NextResponse.json({
      success: true,
      message: `${account.email} disconnected successfully.`,
      accountId,
      email: account.email,
    });
  } catch (error) {
    console.error(
      "Gmail account DELETE error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to disconnect Gmail account",
      },
      { status: 500 }
    );
  }
}