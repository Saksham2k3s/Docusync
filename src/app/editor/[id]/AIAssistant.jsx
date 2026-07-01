// "use client";

// import { useState } from "react";

// const ACTIONS = [
//   { id: "summarize", label: "📝 Summarize", prompt: "Summarize this document concisely:" },
//   { id: "improve", label: "✨ Improve Writing", prompt: "Improve the writing quality of this text:" },
//   { id: "bullets", label: "• Make Bullet Points", prompt: "Convert this text into clear bullet points:" },
//   { id: "shorter", label: "✂️ Make Shorter", prompt: "Make this text shorter and more concise:" },
//   { id: "formal", label: "👔 Make Formal", prompt: "Rewrite this text in a more formal tone:" },
//   { id: "continue", label: "➡️ Continue Writing", prompt: "Continue writing from where this text leaves off:" },
// ];

// export default function AIAssistant({ content, onInsert, onClose }) {
//   const [loading, setLoading] = useState(false);
//   const [result, setResult] = useState("");
//   const [activeAction, setActiveAction] = useState(null);
//   const [customPrompt, setCustomPrompt] = useState("");

//   const runAction = async (action) => {
//     if (!content && action.id !== "continue") {
//       alert("Please write some content first!");
//       return;
//     }
//     setLoading(true);
//     setActiveAction(action.id);
//     setResult("");
//     try {
//       const res = await fetch("/api/ai/assist", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           prompt: action.prompt,
//           content: content,
//         }),
//       });
//       const data = await res.json();
//       setResult(data.result || "No response from AI");
//     } catch (err) {
//       setResult("Error connecting to AI. Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const runCustomPrompt = async () => {
//     if (!customPrompt.trim()) return;
//     await runAction({
//       id: "custom",
//       label: "Custom",
//       prompt: customPrompt,
//     });
//   };

//   return (
//     <div className="flex flex-col h-full">
//       {/* Header */}
//       <div className="flex items-center justify-between px-4 py-3 border-b">
//         <h3 className="font-semibold text-gray-800">✨ AI Assistant</h3>
//         <button
//           onClick={onClose}
//           className="text-gray-400 hover:text-gray-600"
//         >
//           ✕
//         </button>
//       </div>

//       {/* Action buttons */}
//       <div className="p-4 border-b">
//         <p className="text-xs text-gray-500 mb-3">Choose an action:</p>
//         <div className="flex flex-col gap-2">
//           {ACTIONS.map((action) => (
//             <button
//               key={action.id}
//               onClick={() => runAction(action)}
//               disabled={loading}
//               className={`text-left text-sm px-3 py-2 rounded-lg transition-colors ${
//                 activeAction === action.id && loading
//                   ? "bg-purple-100 text-purple-700"
//                   : "bg-gray-50 hover:bg-gray-100 text-gray-700"
//               }`}
//             >
//               {action.label}
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* Custom prompt */}
//       <div className="p-4 border-b">
//         <p className="text-xs text-gray-500 mb-2">Or ask anything:</p>
//         <textarea
//           value={customPrompt}
//           onChange={(e) => setCustomPrompt(e.target.value)}
//           placeholder="e.g. Translate to Hindi..."
//           className="w-full text-sm border border-gray-200 rounded-lg p-2 resize-none focus:outline-none focus:ring-2 focus:ring-purple-300"
//           rows={3}
//         />
//         <button
//           onClick={runCustomPrompt}
//           disabled={loading || !customPrompt.trim()}
//           className="mt-2 w-full bg-purple-600 text-white text-sm py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
//         >
//           {loading ? "Thinking..." : "Ask AI"}
//         </button>
//       </div>

//       {/* Result */}
//       {result && (
//         <div className="flex-1 overflow-y-auto p-4">
//           <div className="flex items-center justify-between mb-2">
//             <p className="text-xs font-medium text-gray-600">AI Response:</p>
//             <button
//               onClick={() => onInsert(result)}
//               className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 transition-colors"
//             >
//               Insert into doc
//             </button>
//           </div>
//           <div className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">
//             {result}
//           </div>
//         </div>
//       )}

//       {loading && (
//         <div className="flex-1 flex items-center justify-center">
//           <div className="text-center">
//             <div className="animate-spin text-2xl mb-2">⚙️</div>
//             <p className="text-sm text-gray-400">AI is thinking...</p>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }


"use client";

import { useState } from "react";
import {
  Bot,
  FileText,
  Sparkles,
  List,
  Scissors,
  Briefcase,
  PenLine,
  X,
  Send,
  Loader2,
  Plus,
} from "lucide-react";

const ACTIONS = [
  {
    id: "summarize",
    label: "Summarize",
    icon: FileText,
    prompt: "Summarize this document concisely:",
  },
  {
    id: "improve",
    label: "Improve Writing",
    icon: Sparkles,
    prompt: "Improve the writing quality of this text:",
  },
  {
    id: "bullets",
    label: "Make Bullet Points",
    icon: List,
    prompt: "Convert this text into clear bullet points:",
  },
  {
    id: "shorter",
    label: "Make Shorter",
    icon: Scissors,
    prompt: "Make this text shorter and more concise:",
  },
  {
    id: "formal",
    label: "Make Formal",
    icon: Briefcase,
    prompt: "Rewrite this text in a more formal tone:",
  },
  {
    id: "continue",
    label: "Continue Writing",
    icon: PenLine,
    prompt: "Continue writing from where this text leaves off:",
  },
];

export default function AIAssistant({ content, onInsert, onClose }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [activeAction, setActiveAction] = useState(null);
  const [customPrompt, setCustomPrompt] = useState("");

  const runAction = async (action) => {
    if (!content && action.id !== "continue") {
      alert("Please write some content first!");
      return;
    }

    setLoading(true);
    setActiveAction(action.id);
    setResult("");

    try {
      const res = await fetch("http://localhost:3000/api/ai/assist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: action.prompt,
          content,
        }),
      });

      const data = await res.json();
      setResult(data.result || "No response from AI");
    } catch (err) {
      setResult("Error connecting to AI. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const runCustomPrompt = async () => {
    if (!customPrompt.trim()) return;

    await runAction({
      id: "custom",
      label: "Custom",
      prompt: customPrompt,
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h3 className="flex items-center gap-2 font-semibold text-gray-800">
          <Bot className="w-5 h-5 text-purple-600" />
          AI Assistant
        </h3>

        <button
          onClick={onClose}
          className="text-gray-400 cursor-pointer hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Actions */}
      <div className="p-4 border-b">
        <p className="text-xs text-gray-500 mb-3">Choose an action:</p>

        <div className="flex flex-col gap-2">
          {ACTIONS.map((action) => {
            const Icon = action.icon;

            return (
              <button
                key={action.id}
                onClick={() => runAction(action)}
                disabled={loading}
                className={`flex items-center cursor-pointer gap-2 text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                  activeAction === action.id && loading
                    ? "bg-purple-100 text-purple-700"
                    : "bg-gray-50 hover:bg-gray-100 text-gray-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                {action.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Prompt */}
      <div className="p-4 border-b">
        <p className="text-xs text-gray-500 mb-2">Or ask anything:</p>

        <textarea
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder="e.g. Translate to Hindi..."
          rows={3}
          className="w-full text-sm border border-gray-200 rounded-lg p-2 resize-none focus:outline-none focus:ring-2 focus:ring-purple-300"
        />

        <button
          onClick={runCustomPrompt}
          disabled={loading || !customPrompt.trim()}
          className="mt-2 w-full cursor-pointer flex items-center justify-center gap-2 bg-purple-600 text-white text-sm py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Thinking...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Ask AI
            </>
          )}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-600">
              AI Response:
            </p>

            <button
              onClick={() => onInsert(result)}
              className="flex items-center cursor-pointer gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Insert
            </button>
          </div>

          <div className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">
            {result}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && !result && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center flex flex-col items-center">
            <Loader2 className="w-8 h-8 text-purple-600 animate-spin mb-2" />
            <p className="text-sm text-gray-400">
              AI is thinking...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}