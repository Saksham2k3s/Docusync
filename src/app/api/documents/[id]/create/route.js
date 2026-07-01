import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const doc = await prisma.document.create({
      data: {
        title: "Untitled Document",
        content: "",
        ownerId: session.user.id,
      },
    });

    return NextResponse.json({ id: doc.id });
  } catch (error) {
    console.error("Create doc error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}