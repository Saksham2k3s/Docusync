"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import {
  ArrowLeft,
  Save,
  History,
  Sparkles,
  Share2,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Highlighter,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo2,
  Redo2,
} from "lucide-react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import {
  saveDocumentLocally,
  getLocalDocument,
  addToSyncQueue,
} from "@/lib/db";
import { startSyncEngine, runSyncEngine } from "@/lib/syncEngine";
import VersionHistory from "./VersionHistory";
import AIAssistant from "./AIAssistant";
import ShareModal from "./ShareModal";

export default function EditorClient({ document, user, role }) {
  const [title, setTitle] = useState(document.title);
  const [isSaving, setIsSaving] = useState(false);
  const [isOnline, setIsOnline] = useState(
    typeof window !== "undefined" ? navigator.onLine : true,
  );
  const [lastSaved, setLastSaved] = useState(null);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [localLoaded, setLocalLoaded] = useState(false);
  const [showShare, setShowShare] = useState(false);

  const saveTimeout = useRef(null);
  const titleRef = useRef(title);
  const editorRef = useRef(null);
  const isViewer = role === "VIEWER";

  // Sync titleRef without re-render
  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  // Client-only mount gate (avoids SSR/hydration mismatch).
  // This is a legitimate exception to the "no setState in effect body" rule —
  // there's no external system here, just a one-time client-mount flag.
  // useEffect(() => {
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  //   setMounted(true);
  // }, []);

  // 1. handleSave — declared FIRST
  const handleSave = useCallback(
    async (content) => {
      if (isViewer) return;
      setIsSaving(true);
      try {
        const contentToSave = typeof content === "string" ? content : "";
        await saveDocumentLocally({
          id: document.id,
          title: titleRef.current,
          content: contentToSave,
          version: document.version,
        });
        await addToSyncQueue({
          documentId: document.id,
          title: titleRef.current,
          content: contentToSave,
          version: document.version,
        });
        if (navigator.onLine) await runSyncEngine();
        setLastSaved(new Date());
      } catch (err) {
        console.error("Save error:", err);
      } finally {
        setIsSaving(false);
      }
    },
    [document.id, document.version, isViewer],
  );

  // 2. scheduleSave — declared AFTER handleSave
  const scheduleSave = useCallback(
    (content) => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => {
        handleSave(content);
      }, 1000);
    },
    [handleSave],
  );

  // 3. Editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Start writing your document..." }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight,
    ],
    content: document.content || "",
    editable: !isViewer,
    onUpdate: ({ editor }) => {
      if (isViewer) return;
      const text = editor.getText();
      setWordCount(text.split(/\s+/).filter(Boolean).length);
      scheduleSave(editor.getHTML());
    },
  });

  // Keep editorRef in sync
  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  // 4. Load from IndexedDB — no synchronous setState in effect body
  useEffect(() => {
    if (!editor || localLoaded) return;
    let cancelled = false;

    getLocalDocument(document.id).then((localDoc) => {
      if (cancelled) return;
      if (localDoc) {
        const localTime = new Date(localDoc.updatedAt).getTime();
        const serverTime = new Date(document.updatedAt).getTime();
        if (localTime > serverTime) {
          // Use queueMicrotask to avoid synchronous setState in effect
          queueMicrotask(() => {
            if (!cancelled) {
              editor.commands.setContent(localDoc.content || "");
              setTitle(localDoc.title || document.title);
            }
          });
        }
      }
      if (!cancelled) setLocalLoaded(true);
    });

    return () => {
      cancelled = true;
    };
  }, [editor, document.id, document.updatedAt, document.title, localLoaded]);

  // 5. Online/offline — no synchronous setState, just listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    startSyncEngine();
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleSaveVersion = async () => {
    const label = prompt("Enter a label for this version (e.g. 'Draft 1'):");
    if (!label) return;
    try {
      const res = await fetch(`/api/documents/${document.id}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: titleRef.current,
          content: editorRef.current?.getHTML() || "",
          label,
        }),
      });
      if (res.ok) alert("✅ Version saved!");
      else alert("❌ Failed to save version.");
    } catch (err) {
      console.error("Version save error:", err);
    }
  };

  // if (!mounted) {
  //   return (
  //     <div className="min-h-screen bg-gray-50 flex items-center justify-center">
  //       <div className="text-center">
  //         <div className="text-4xl mb-4">📄</div>
  //         <p className="text-gray-500">Loading editor...</p>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Navbar */}
        <nav className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <a
              href="/dashboard"
              className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </a>
            <span className="text-gray-300">|</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => handleSave(editorRef.current?.getHTML() || "")}
              disabled={isViewer}
              className="font-semibold text-gray-800 bg-transparent border-none outline-none text-lg w-64 truncate"
              placeholder="Untitled Document"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div
              className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${
                isOnline
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-500" : "bg-red-500"}`}
              />
              {isOnline ? "Online" : "Offline"}
            </div>

            <span className="text-xs text-gray-400">
              {isSaving
                ? "Saving..."
                : lastSaved
                  ? `Saved ${lastSaved.toLocaleTimeString()}`
                  : ""}
            </span>

            <span
              className={`text-xs px-2 py-1 rounded-full font-medium ${
                role === "OWNER"
                  ? "bg-purple-100 text-purple-700"
                  : role === "EDITOR"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-600"
              }`}
            >
              {role}
            </span>

            {!isViewer && (
              <>
                <button
                  onClick={handleSaveVersion}
                  className="flex items-center cursor-pointer gap-2 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <>
                    <Save className="w-4 h-4" />
                    Save Version
                  </>
                </button>
                <button
                  onClick={() => setShowVersionHistory(true)}
                  className="text-xs cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <>
                    <History className="w-4 h-4" />
                    History
                  </>
                </button>
                <button
                  onClick={() => setShowAI(!showAI)}
                  className="text-xs cursor-pointer bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <>
                    <Sparkles className="w-4 h-4" />
                    AI Assist
                  </>
                </button>
              </>
            )}

            {role === "OWNER" && (
              <button
                onClick={() => setShowShare(true)}
                className="text-xs cursor-pointer bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1.5 rounded-lg transition-colors"
              >
                <>
                  <Share2 className="w-4 h-4" />
                  Share
                </>
              </button>
            )}
          </div>
        </nav>

        {/* Toolbar */}
        {!isViewer && editor && (
          <div className="bg-white border-b border-gray-100 px-4 py-2 flex items-center gap-1 flex-wrap">
            <Btn
              onClick={() => editor.chain().focus().toggleBold().run()}
              active={editor.isActive("bold")}
            >
              <Bold className="w-4 h-4" />
            </Btn>
            <Btn
              onClick={() => editor.chain().focus().toggleItalic().run()}
              active={editor.isActive("italic")}
            >
              <Italic className="w-4 h-4" />
            </Btn>
            <Btn
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              active={editor.isActive("underline")}
            >
              <UnderlineIcon className="w-4 h-4" />
            </Btn>
            <Btn
              onClick={() => editor.chain().focus().toggleStrike().run()}
              active={editor.isActive("strike")}
            >
              <Strikethrough className="w-4 h-4" />
            </Btn>
            <Sep />
            <Btn
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 1 }).run()
              }
              active={editor.isActive("heading", { level: 1 })}
            >
              H1
            </Btn>
            <Btn
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
              active={editor.isActive("heading", { level: 2 })}
            >
              H2
            </Btn>
            <Btn
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 3 }).run()
              }
              active={editor.isActive("heading", { level: 3 })}
            >
              H3
            </Btn>
            <Sep />
            <Btn
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              active={editor.isActive("bulletList")}
            >
              <>
                <List className="w-4 h-4" />
                List
              </>
            </Btn>
            <Btn
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              active={editor.isActive("orderedList")}
            >
              <>
                <ListOrdered className="w-4 h-4" />
                List
              </>
            </Btn>
            <Btn
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              active={editor.isActive("blockquote")}
            >
              <Quote className="w-4 h-4" />
            </Btn>
            <Btn
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              active={editor.isActive("highlight")}
            >
              <Highlighter className="w-4 h-4" />
            </Btn>
            <Sep />
            <Btn
              onClick={() => editor.chain().focus().setTextAlign("left").run()}
              active={editor.isActive({ textAlign: "left" })}
            >
              <AlignLeft className="w-4 h-4" />
            </Btn>
            <Btn
              onClick={() =>
                editor.chain().focus().setTextAlign("center").run()
              }
              active={editor.isActive({ textAlign: "center" })}
            >
              <AlignCenter className="w-4 h-4" />
            </Btn>
            <Btn
              onClick={() => editor.chain().focus().setTextAlign("right").run()}
              active={editor.isActive({ textAlign: "right" })}
            >
              <AlignRight className="w-4 h-4" />
            </Btn>
            <Sep />
            <Btn onClick={() => editor.chain().focus().undo().run()}>
              <>
                <Undo2 className="w-4 h-4" />
                Undo
              </>
            </Btn>
            <Btn onClick={() => editor.chain().focus().redo().run()}>
              <>
                <Redo2 className="w-4 h-4" />
                Redo
              </>
            </Btn>
          </div>
        )}

        {/* Main area */}
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto px-8 py-12">
              <EditorContent
                editor={editor}
                className="prose prose-lg max-w-none min-h-[600px] focus:outline-none"
              />
            </div>
          </div>

          {showAI && (
            <div className="w-80 border-l border-gray-200 bg-white overflow-y-auto">
              <AIAssistant
                content={editor?.getText() || ""}
                onInsert={(text) =>
                  editor?.chain().focus().insertContent(text).run()
                }
                onClose={() => setShowAI(false)}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-gray-100 px-6 py-2 flex items-center justify-between text-xs text-gray-400">
          <span>{wordCount} words</span>
          <span>
            Built by Saksham |{" "}
            <a href="https://github.com" className="hover:underline">
              GitHub
            </a>{" "}
            |{" "}
            <a href="https://linkedin.com" className="hover:underline">
              LinkedIn
            </a>
          </span>
        </div>

        {showVersionHistory && (
          <VersionHistory
            documentId={document.id}
            onClose={() => setShowVersionHistory(false)}
            onRestore={(content) => {
              editor?.commands.setContent(content);
              setShowVersionHistory(false);
            }}
          />
        )}
      </div>

      {showShare && (
        <ShareModal
          documentId={document.id}
          onClose={() => setShowShare(false)}
        />
      )}
    </>
  );
}

function Btn({ onClick, active, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex cursor-pointer items-center gap-1 px-2 py-1 rounded text-sm transition-colors ${
        active ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100"
      }`}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <div className="w-px h-5 bg-gray-200 mx-1" />;
}
