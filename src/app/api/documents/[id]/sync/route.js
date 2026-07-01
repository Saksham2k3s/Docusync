import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// 500KB max — anything bigger is probably malicious
const MAX_PAYLOAD_SIZE = 500 * 1024;

export async function POST(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // reject before even parsing the body — prevents OOM
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > MAX_PAYLOAD_SIZE) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    const body = await request.json();
    const { title, content, version, baseVersion, baseTitle, baseContent } = body;

    // basic sanity checks on what the client sent
    if (!title || typeof title !== "string" || title.length > 500) {
      return NextResponse.json({ error: "Invalid title" }, { status: 400 });
    }
    if (content && typeof content !== "string") {
      return NextResponse.json({ error: "Invalid content" }, { status: 400 });
    }

    const { id } = await params;

    // viewers are excluded here — only owner or editor can sync
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
        { error: "Document not found or insufficient permissions" },
        { status: 404 }
      );
    }

    // field-level conflict resolution
    //
    // the client sends its "base" — what the doc looked like when it
    // last successfully synced. we compare that against what the client
    // is sending now to figure out which fields the client actually touched.
    //
    // if server version moved on (someone else synced while this client
    // was offline), we only apply the fields this client actually changed.
    // fields it didn't touch stay as whatever the server has now.
    //
    // same field edited by two people? last write wins for that field only.
    // that's the documented tradeoff — better than wiping the whole doc.

    let finalTitle = title;
    let finalContent = content || "";
    let merged = false;

    const serverMovedOn =
      typeof baseVersion === "number" && document.version > baseVersion;

    if (serverMovedOn) {
      // did this client actually change the title, or is it just echoing back stale data?
      const clientChangedTitle =
        typeof baseTitle === "string" && baseTitle !== title;
      const clientChangedContent =
        typeof baseContent === "string" && baseContent !== content;

      finalTitle = clientChangedTitle ? title : document.title;
      finalContent = clientChangedContent ? content || "" : document.content;
      merged = true;
    }

    // version always goes up — never back
    const newVersion = Math.max(document.version, version || 0) + 1;

    const updated = await prisma.document.update({
      where: { id },
      data: {
        title: finalTitle,
        content: finalContent,
        version: newVersion,
        updatedAt: new Date(),
      },
    });

    // send back the merged result so client can update its local copy
    return NextResponse.json({
      success: true,
      version: updated.version,
      title: updated.title,
      content: updated.content,
      merged,
    });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}