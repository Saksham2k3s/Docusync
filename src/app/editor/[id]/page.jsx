import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import EditorClient from "./EditorClient";

export default async function EditorPage({ params }) {
  const session = await auth();
  if (!session) redirect("/auth/signin");

  const { id } = await params;

  const document = await prisma.document.findFirst({
    where: {
      id,
      OR: [
        { ownerId: session.user.id },
        {
          collaborators: {
            some: { userId: session.user.id },
          },
        },
      ],
    },
    include: {
      collaborators: {
        include: {
          user: { select: { name: true, email: true, image: true } },
        },
      },
    },
  });

  if (!document) redirect("/dashboard");

  // Determine user role
  const isOwner = document.ownerId === session.user.id;
  const collaborator = document.collaborators.find(
    (c) => c.userId === session.user.id
  );
  const role = isOwner ? "OWNER" : collaborator?.role || "VIEWER";

  return (
    <EditorClient
      document={JSON.parse(JSON.stringify(document))}
      user={session.user}
      role={role}
    />
  );
}