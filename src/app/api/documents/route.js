import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Documents owned by user
    const owned = await prisma.document.findMany({
      where: { ownerId: session.user.id },
      orderBy: { updatedAt: "desc" },
    });

    // Documents shared with user
    const collaborations = await prisma.documentCollaborator.findMany({
      where: { userId: session.user.id },
      include: {
        document: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const shared = collaborations.map((c) => ({
      ...c.document,
      role: c.role,
      ownerName: c.document.ownerId,
    }));

    // Get owner names for shared docs
    const ownerIds = [...new Set(shared.map((d) => d.ownerId))];
    const owners = await prisma.user.findMany({
      where: { id: { in: ownerIds } },
      select: { id: true, name: true },
    });

    const ownerMap = {};
    owners.forEach((o) => { ownerMap[o.id] = o.name; });

    const sharedWithOwnerNames = shared.map((d) => ({
      ...d,
      ownerName: ownerMap[d.ownerId] || "Unknown",
    }));

    return NextResponse.json({
      owned,
      shared: sharedWithOwnerNames,
    });
  } catch (error) {
    console.error("Fetch docs error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}