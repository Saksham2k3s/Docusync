"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  FileText,
  Plus,
  LogOut,
  FolderOpen,
  Share2,
  Pencil,
  Eye,
  User,
  Loader2,
} from "lucide-react";

export default function Dashboard() {
  const [session, setSession] = useState(null);
  const [ownedDocs, setOwnedDocs] = useState([]);
  const [sharedDocs, setSharedDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [activeTab, setActiveTab] = useState("owned");
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      try {
        const sessionRes = await fetch("/api/auth/session");
        const sessionData = await sessionRes.json();

        if (!sessionData?.user) {
          router.push("/auth/signin");
          return;
        }
        setSession(sessionData);

        const docsRes = await fetch("/api/documents");
        const docsData = await docsRes.json();
        setOwnedDocs(docsData.owned || []);
        setSharedDocs(docsData.shared || []);
      } catch (err) {
        console.error("Load error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  const handleCreateDocument = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/documents/create", { method: "POST" });
      const data = await res.json();
      if (data.id) router.push(`/editor/${data.id}`);
    } catch (err) {
      console.error("Create error:", err);
      setCreating(false);
    }
  };

  const handleSignOut = async () => {
    await fetch("/api/auth/signout", { method: "POST" });
    router.push("/auth/signin");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          </div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  const currentDocs = activeTab === "owned" ? ownedDocs : sharedDocs;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-7 h-7 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">DocuSync</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{session?.user?.name}</span>
            {session?.user?.image && (
              <Image
                src={session.user.image}
                alt="avatar"
                width={32}
                height={32}
                className="rounded-full"
              />
            )}
            <button
              onClick={handleSignOut}
              className="flex cursor-pointer items-center gap-2 text-sm text-red-500 hover:text-red-700 font-medium"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Documents</h2>
          <button
            onClick={handleCreateDocument}
            disabled={creating}
            className="bg-blue-600 cursor-pointer text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
          >
            {creating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                New Document
              </>
            )}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab("owned")}
            className={`px-4 py-2 cursor-pointer rounded-md text-sm font-medium transition-colors ${
              activeTab === "owned"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            My Documents
            <span
              className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                activeTab === "owned"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {ownedDocs.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("shared")}
            className={`px-4 py-2 cursor-pointer rounded-md text-sm font-medium transition-colors ${
              activeTab === "shared"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Shared with Me
            <span
              className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                activeTab === "shared"
                  ? "bg-purple-100 text-purple-700"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {sharedDocs.length}
            </span>
          </button>
        </div>

        {/* Documents Grid */}
        {currentDocs.length === 0 ? (
          <div className="text-center py-20">
            <div className="flex justify-center mb-4">
              {activeTab === "owned" ? (
                <FolderOpen className="w-16 h-16 text-gray-400" />
              ) : (
                <Share2 className="w-16 h-16 text-gray-400" />
              )}
            </div>
            <p className="text-lg text-gray-500">
              {activeTab === "owned"
                ? "No documents yet"
                : "No shared documents yet"}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {activeTab === "owned"
                ? 'Click "New Document" to get started'
                : "Documents shared with you will appear here"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentDocs.map((doc) => (
              <Link
                key={doc.id}
                href={`/editor/${doc.id}`}
                className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all hover:border-blue-200 group"
              >
                <div className="mb-3">
                  <FileText className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-800 truncate group-hover:text-blue-600">
                  {doc.title}
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  Updated {new Date(doc.updatedAt).toLocaleDateString()}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  {activeTab === "owned" ? (
                    <span className="inline-flex items-center gap-1 text-xs bg-purple-100 text-purple-700 font-medium px-2 py-0.5 rounded-full">
                      <User className="w-3 h-3" />
                      Owner
                    </span>
                  ) : (
                    <>
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                          doc.role === "EDITOR"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {doc.role === "EDITOR" ? (
                          <>
                            <Pencil className="w-3 h-3" />
                            Editor
                          </>
                        ) : (
                          <>
                            <Eye className="w-3 h-3" />
                            Viewer
                          </>
                        )}
                      </span>
                      <span className="text-xs text-gray-400">
                        by {doc.ownerName}
                      </span>
                    </>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-gray-400 border-t mt-8">
        Built by Saksham |{" "}
        <Link href="https://github.com/Saksham2k3s" className="hover:underline">
          GitHub
        </Link>{" "}
        |{" "}
        <Link href="https://www.linkedin.com/in/sakshamshrivastava" className="hover:underline">
          LinkedIn
        </Link>
      </footer>
    </div>
  );
}
