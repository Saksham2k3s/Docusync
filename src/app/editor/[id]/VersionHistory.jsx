// "use client";

// import { useEffect, useState } from "react";
// import {
//   History,
//   X,
//   Loader2,
//   Save,
//   RotateCcw,
//   Eye,
// } from "lucide-react";

// export default function VersionHistory({ documentId, onClose, onRestore }) {
//   const [versions, setVersions] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [previewing, setPreviewing] = useState(null);

//   useEffect(() => {
//     async function fetchVersions() {
//       try {
//         const res = await fetch(`/api/documents/${documentId}/versions`);
//         const data = await res.json();
//         setVersions(data);
//       } catch (err) {
//         console.error("Failed to fetch versions:", err);
//       } finally {
//         setLoading(false);
//       }
//     }
//     fetchVersions();
//   }, [documentId]);

//   return (
//     <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
//       <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
//         {/* Header */}
//         <div className="flex items-center justify-between px-6 py-4 border-b">
//           <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
//   <History className="w-5 h-5 text-blue-600" />
//   Version History
// </h2>
//           <button
//   onClick={onClose}
//   className="text-gray-400 hover:text-gray-600 transition-colors"
// >
//   <X className="w-5 h-5" />
// </button>
//         </div>

//         {/* Content */}
//         <div className="flex flex-1 overflow-hidden">
//           {/* Version list */}
//           <div className="w-64 border-r overflow-y-auto">
//             {loading ? (
//              <div className="p-4 flex items-center gap-2 text-sm text-gray-400">
//   <Loader2 className="w-4 h-4 animate-spin" />
//   Loading...
// </div>
//             ) : versions.length === 0 ? (
//               <div className="p-4 text-sm text-gray-400">
//                 No saved versions yet. Click 📌 Save Version in the editor.
//               </div>
//             ) : (
//               versions.map((v) => (
//                 <button
//                   key={v.id}
//                   onClick={() => setPreviewing(v)}
//                   className={`w-full text-left px-4 py-3 border-b hover:bg-gray-50 transition-colors ${
//                     previewing?.id === v.id ? "bg-blue-50" : ""
//                   }`}
//                 >
//                   <div className="font-medium text-sm text-gray-800 truncate">
//                     {v.label || `Version ${v.version}`}
//                   </div>
//                   <div className="text-xs text-gray-400 mt-0.5">
//                     {new Date(v.createdAt).toLocaleString()}
//                   </div>
//                   <div className="text-xs text-gray-500 mt-0.5 truncate">
//                     {v.title}
//                   </div>
//                 </button>
//               ))
//             )}
//           </div>

//           {/* Preview */}
//           <div className="flex-1 overflow-y-auto p-6">
//             {previewing ? (
//               <div>
//                 <div className="flex items-center justify-between mb-4">
//                   <div>
//                     <h3 className="font-semibold text-gray-800">{previewing.label || `Version ${previewing.version}`}</h3>
//                     <p className="text-xs text-gray-400">
//                       {new Date(previewing.createdAt).toLocaleString()}
//                     </p>
//                   </div>
//                   <button
//                     onClick={() => {
//                       if (confirm("Restore this version? Current content will be replaced.")) {
//                         onRestore(previewing.content);
//                       }
//                     }}
//                     className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
//                   >
//                     Restore This Version
//                   </button>
//                 </div>
//                 <div
//                   className="prose prose-sm max-w-none border rounded-lg p-4 bg-gray-50"
//                   dangerouslySetInnerHTML={{ __html: previewing.content }}
//                 />
//               </div>
//             ) : (
//               <div className="text-gray-400 text-sm text-center mt-20">
//                 Select a version to preview
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }


"use client";

import { useEffect, useState } from "react";
import {
  History,
  X,
  Loader2,
  Save,
  RotateCcw,
  Eye,
} from "lucide-react";

export default function VersionHistory({
  documentId,
  onClose,
  onRestore,
}) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewing, setPreviewing] = useState(null);

  useEffect(() => {
    async function fetchVersions() {
      try {
        const res = await fetch(
          `/api/documents/${documentId}/versions`
        );
        const data = await res.json();
        setVersions(data);
      } catch (err) {
        console.error("Failed to fetch versions:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchVersions();
  }, [documentId]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
            <History className="w-5 h-5 text-blue-600" />
            Version History
          </h2>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Version List */}
          <div className="w-64 border-r overflow-y-auto">
            {loading ? (
              <div className="p-4 flex items-center gap-2 text-sm text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </div>
            ) : versions.length === 0 ? (
              <div className="p-4 text-sm text-gray-400 flex items-start gap-2">
                <Save className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  No saved versions yet.
                  <br />
                  Click <strong>Save Version</strong> in the editor.
                </span>
              </div>
            ) : (
              versions.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setPreviewing(v)}
                  className={`w-full text-left px-4 py-3 border-b hover:bg-gray-50 transition-colors ${
                    previewing?.id === v.id
                      ? "bg-blue-50"
                      : ""
                  }`}
                >
                  <div className="font-medium text-sm text-gray-800 truncate">
                    {v.label || `Version ${v.version}`}
                  </div>

                  <div className="text-xs text-gray-400 mt-0.5">
                    {new Date(v.createdAt).toLocaleString()}
                  </div>

                  <div className="text-xs text-gray-500 mt-0.5 truncate">
                    {v.title}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Preview */}
          <div className="flex-1 overflow-y-auto p-6">
            {previewing ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {previewing.label ||
                        `Version ${previewing.version}`}
                    </h3>

                    <p className="text-xs text-gray-400">
                      {new Date(
                        previewing.createdAt
                      ).toLocaleString()}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      if (
                        confirm(
                          "Restore this version? Current content will be replaced."
                        )
                      ) {
                        onRestore(previewing.content);
                      }
                    }}
                    className="flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Restore This Version
                  </button>
                                  </div>

                <div
                  className="prose prose-sm max-w-none border rounded-lg p-4 bg-gray-50"
                  dangerouslySetInnerHTML={{
                    __html: previewing.content,
                  }}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-400 text-sm mt-20">
                <Eye className="w-10 h-10 mb-3" />
                <p>Select a version to preview</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}