import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { sendCollaborationInvite } from "@/lib/email";

// /api/documents/[id]/collaborators to get the collaborates list for a document
export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id }= await params;

    const collaborators = await prisma.documentCollaborator.findMany({
      where: { documentId: id },
      include: {
        user: {
          select: { name: true, email: true, image: true },
        },
      },
    });

    return NextResponse.json(collaborators);
  } catch (error) {
    console.error("Fetch collaborators error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// POST /api/documents/[id]/collaborators
// Adds a new collaborator to a document or updates their role if they already exist
export async function POST(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { email, role } = await request.json();

    if (!email || !role) {
      return NextResponse.json(
        { error: "Email and role required" },
        { status: 400 },
      );
    }
    
    // only EDITOR and VIEWER are valid roles
    // OWNER is assigned at document creation, not through sharing
    if (!["EDITOR", "VIEWER"].includes(role)) {
      return NextResponse.json(
        { error: "Role must be EDITOR or VIEWER" },
        { status: 400 },
      );
    }

    // Only OWNER can share
    const document = await prisma.document.findFirst({
      where: { id, ownerId: session.user.id },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Only the owner can share this document" },
        { status: 403 },
      );
    }

    // Find user by email
    const userToInvite = await prisma.user.findUnique({
      where: { email },
    });

    if (!userToInvite) {
      return NextResponse.json(
        { error: "No user found with that email. They must sign up first." },
        { status: 404 },
      );
    }

    if (userToInvite.id === session.user.id) {
      return NextResponse.json(
        { error: "You cannot share a document with yourself" },
        { status: 400 },
      );
    }

    // Add or update collaborator
    const collaborator = await prisma.documentCollaborator.upsert({
      where: {
        documentId_userId: {
          documentId: id,
          userId: userToInvite.id,
        },
      },
      update: { role },
      create: {
        documentId: id,
        userId: userToInvite.id,
        role,
      },
      include: {
        user: {
          select: { name: true, email: true, image: true },
        },
      },
    });

    // send the invite email — we don't block the response on this
    // if email fails, the collaborator is still added, we just log the error
    const emailResult = await sendCollaborationInvite({
      toEmail: userToInvite.email,
      toName: userToInvite.name || "there",
      fromName: session.user.name || "Someone",
      documentTitle: document.title,
      documentId: id,
      role,
    });

    if (!emailResult.success) {
      console.error("Email failed:", emailResult.error);
    }

    return NextResponse.json(collaborator);
  } catch (error) {
    console.error("Share error:", error);
    return NextResponse.json({ error: "Failed to share" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { userId } = await request.json();

    const document = await prisma.document.findFirst({
      where: { id, ownerId: session.user.id },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Only the owner can remove collaborators" },
        { status: 403 },
      );
    }

    await prisma.documentCollaborator.delete({
      where: {
        documentId_userId: {
          documentId: id,
          userId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Remove collaborator error:", error);
    return NextResponse.json({ error: "Failed to remove" }, { status: 500 });
  }
}
