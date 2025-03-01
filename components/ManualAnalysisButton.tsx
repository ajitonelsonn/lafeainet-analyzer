"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useSession } from "next-auth/react";

export default function ManualAnalysisButton() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    analyzed: number;
  } | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user has permission to use this button
  const canRunAnalysis =
    session?.user?.role === "admin" || session?.user?.role === "analyst";

  const handleAnalyze = async () => {
    if (!canRunAnalysis) {
      setError("You don't have permission to run analysis");
      return;
    }

    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      // First, get the auth token securely from server
      const tokenResponse = await fetch("/api/auth-token");

      if (!tokenResponse.ok) {
        throw new Error(
          tokenResponse.status === 401
            ? "Authentication required"
            : tokenResponse.status === 403
            ? "You don't have permission to run analysis"
            : "Failed to get authorization token"
        );
      }

      const { token } = await tokenResponse.json();

      if (!token) {
        throw new Error("Invalid authorization token");
      }

      // Then use the token to make the analyze call
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      setResult(data);
      if (data.success) {
        setShowPopup(true);
        // Auto-hide popup after 15 seconds
        setTimeout(() => setShowPopup(false), 15000);
      }
    } catch (error) {
      console.error("Error triggering analysis:", error);
      setError(
        error instanceof Error ? error.message : "Unknown error occurred"
      );
      setResult({
        success: false,
        analyzed: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!canRunAnalysis) {
    return null; // Don't render the button if user doesn't have permission
  }

  return (
    <>
      <button
        onClick={handleAnalyze}
        disabled={isLoading || !canRunAnalysis}
        className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Running Analysis...
          </>
        ) : (
          "Run Manual Analysis"
        )}
      </button>

      {error && <div className="mt-2 text-sm text-red-600">{error}</div>}

      {/* Success/Error Popup */}
      {showPopup && result && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-xl shadow-xl p-8 max-w-md mx-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="text-center">
              {result.success ? (
                <>
                  <CheckCircle2 className="mx-auto h-16 w-16 text-green-500 mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Analysis Successful!
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Successfully analyzed{" "}
                    <span className="font-semibold text-blue-600">
                      {result.analyzed}
                    </span>{" "}
                    network reports.
                  </p>
                </>
              ) : (
                <>
                  <XCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Analysis Failed
                  </h3>
                  <p className="text-gray-600 mb-6">
                    There was an error running the analysis. Please try again
                    later.
                  </p>
                </>
              )}
              <button
                onClick={() => setShowPopup(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-6 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
