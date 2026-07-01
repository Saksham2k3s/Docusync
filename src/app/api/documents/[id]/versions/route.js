import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const versions = await prisma.documentVersion.findMany({
      where: { documentId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(versions);
  } catch (error) {
    console.error("Fetch versions error:", error);
    return NextResponse.json({ error: "Failed to fetch versions" }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id }= await params

    const body = await request.json();
    const { title, content, label } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content required" },
        { status: 400 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { error: "Document ID missing" },
        { status: 400 }
      );
    }

    const document = await prisma.document.findFirst({
      where: {
        id,
        OR: [
          { ownerId: session.user.id },
          {
            collaborators: {
              some: {
                userId: session.user.id,
                role: { in: ["EDITOR"] },
              },
            },
          },
        ],
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Not found or no permission" },
        { status: 404 }
      );
    }

    const version = await prisma.documentVersion.create({
      data: {
        documentId: id,
        title,
        content,
        version: document.version,
        createdBy: session.user.id,
        label: label || null,
      },
    });

    return NextResponse.json(version);
  } catch (error) {
    console.error("Save version error:", error);
    return NextResponse.json(
      { error: "Failed to save version" },
      { status: 500 }
    );
  }
}