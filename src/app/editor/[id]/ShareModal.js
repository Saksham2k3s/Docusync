"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  Share2,
  X,
  CircleAlert,
  CircleCheck,
  Loader2,
  SendHorizontal,
  Trash2,
  Pencil,
  Eye,
} from "lucide-react";

export default function ShareModal({ documentId, onClose }) {
  const [collaborators, setCollaborators] = useState([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("EDITOR");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch existing collaborators
  useEffect(() => {
    fetch(`/api/documents/${documentId}/collaborators`)
      .then((r) => r.json())
      .then((data) => {
        setCollaborators(Array.isArray(data) ? data : []);
        setFetching(false);
      })
      .catch(() => setFetching(false));
  }, [documentId]);

  const handleShare = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/documents/${documentId}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(`✅ Successfully shared with ${email}`);
        setEmail("");
        // Refresh collaborators list
        const updated = await fetch(
          `/api/documents/${documentId}/collaborators`,
        );
        const updatedData = await updated.json();
        setCollaborators(Array.isArray(updatedData) ? updatedData : []);
      } else {
        setError(data.error || "Failed to share");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (userId) => {
    if (!confirm("Remove this collaborator?")) return;
    try {
      const res = await fetch(`/api/documents/${documentId}/collaborators`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (res.ok) {
        setCollaborators((prev) => prev.filter((c) => c.userId !== userId));
      }
    } catch (err) {
      console.error("Remove error:", err);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const collab = collaborators.find((c) => c.userId === userId);
      if (!collab) return;

      const res = await fetch(`/api/documents/${documentId}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: collab.user.email, role: newRole }),
      });

      if (res.ok) {
        setCollaborators((prev) =>
          prev.map((c) => (c.userId === userId ? { ...c, role: newRole } : c)),
        );
      }
    } catch (err) {
      console.error("Role change error:", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
            <Share2 className="w-5 h-5 text-blue-600" />
            Share Document
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 cursor-pointer hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Share input */}
          <div className="mb-6">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Invite by email
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleShare()}
                placeholder="john@gmail.com"
                className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                <option value="EDITOR">Editor</option>
                <option value="VIEWER">Viewer</option>
              </select>
            </div>
            <button
              onClick={handleShare}
              disabled={loading || !email.trim()}
              className="w-full flex items-center cursor-pointer justify-center gap-2 bg-blue-600 text-white text-sm py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sharing...
                </>
              ) : (
                <>
                  <SendHorizontal className="w-4 h-4" />
                  Share
                </>
              )}
            </button>

            {error && (
              <p className="flex items-center gap-1 text-red-500 text-xs mt-2">
                <CircleAlert className="w-4 h-4" />
                {error}
              </p>
            )}
            {success && (
              <p className="flex items-center gap-1 text-green-600 text-xs mt-2">
                <CircleCheck className="w-4 h-4" />
                {success.replace("✅ ", "")}
              </p>
            )}
          </div>

          {/* Role explanation */}
          <div className="bg-gray-50 rounded-lg p-3 mb-6 text-xs text-gray-500 space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                <Pencil className="w-3 h-3" />
                Editor
              </span>
              <span>Can read and edit the document</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                <Eye className="w-3 h-3" />
                Viewer
              </span>
              <span>Can only read the document</span>
            </div>
          </div>

          {/* Collaborators list */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              People with access
            </h3>
            {fetching ? (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </div>
            ) : collaborators.length === 0 ? (
              <p className="text-sm text-gray-400">
                No collaborators yet. Share with someone above!
              </p>
            ) : (
              <div className="space-y-3">
                {collaborators.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      {c.user.image ? (
                        <Image
                          src={c.user.image}
                          alt={c.user.name}
                          className="w-8 h-8 rounded-full"
                          height={200}
                          width={200}
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                          {c.user.name?.[0] || "?"}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {c.user.name || "Unknown"}
                        </p>
                        <p className="text-xs text-gray-400">{c.user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={c.role}
                        onChange={(e) =>
                          handleRoleChange(c.userId, e.target.value)
                        }
                        className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none"
                      >
                        <option value="EDITOR">Editor</option>
                        <option value="VIEWER">Viewer</option>
                      </select>
                      <button
                        onClick={() => handleRemove(c.userId)}
                        className="flex cursor-pointer cursor-pointer items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
