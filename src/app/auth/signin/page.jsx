import { signIn } from "@/lib/auth";
import { FileText, ArrowRight } from "lucide-react";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-10 pb-8 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-lg">
              <FileText className="h-8 w-8 text-white" />
            </div>

            <h1 className="text-3xl font-bold text-gray-900">
              DocuSync
            </h1>

            <p className="mt-3 text-gray-500 leading-relaxed">
              A modern collaborative document editor built for
              seamless writing, sharing, and teamwork.
            </p>
          </div>

          {/* Divider */}
          <div className="px-8">
            <div className="h-px bg-gray-100" />
          </div>

          {/* Login */}
          <div className="p-8">
            <form
              action={async () => {
                "use server";
                await signIn("google", {
                  redirectTo: "/dashboard",
                });
              }}
            >
              <button
                type="submit"
                className="group w-full flex items-center justify-center gap-3 rounded-xl border border-gray-300 bg-white px-5 py-3.5 font-medium text-gray-700 shadow-sm transition-all duration-200 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 hover:shadow-md"
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>

                <span>Continue with Google</span>

                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500 leading-relaxed">
              Sign in securely using your Google account to create,
              edit, and collaborate on documents in real time.
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-gray-500">
          Built with ❤️ using Next.js, TipTap & Yjs
        </p>
      </div>
    </div>
  );
}