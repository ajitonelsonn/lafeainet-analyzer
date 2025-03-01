"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import {
  BarChart,
  Signal,
  Users,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  LogIn,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface AnalysisStats {
  totalReports: number;
  analyzedReports: number;
  lastAnalysisTime: string;
  averageSentiment: number;
  averageQuality: number;
  providerStats: {
    providerName: string;
    reportCount: number;
    avgSentiment: number;
    avgQuality: number;
  }[];
}

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<AnalysisStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<string>("reportCount");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);

  const fetchStats = useCallback(async (isManualRefresh = false) => {
    if (refreshing && !isManualRefresh) return;

    setRefreshing(true);

    try {
      const response = await fetch("/api/analysis-stats");

      // Check if response is redirecting to login page
      if (response.redirected) {
        setIsAuthenticated(false);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Check for unauthorized status
      if (response.status === 401) {
        setIsAuthenticated(false);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Try to parse JSON response
      try {
        const data = await response.json();
        if (data.success) {
          setStats(data.stats);
          setError(null);
          setIsAuthenticated(true);
        } else {
          setError(data.error || "Failed to fetch statistics");
        }
      } catch (jsonError) {
        // If we get here with HTML instead of JSON, likely unauthorized
        setIsAuthenticated(false);
      }
    } catch (error) {
      // Check if error might be related to authentication
      console.error("Error:", error);
      const errorString = String(error);
      if (
        errorString.includes("Unexpected token") ||
        errorString.includes("<!DOCTYPE") ||
        errorString.includes("SyntaxError")
      ) {
        setIsAuthenticated(false);
      } else {
        setError("Error fetching statistics");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []); // Remove refreshing from dependencies

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const redirectToLogin = () => {
    router.push("/login");
  };

  // If not authenticated, show login prompt
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-sm p-8 max-w-md w-full text-center space-y-6">
          <div className="mx-auto bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center">
            <LogIn className="h-10 w-10 text-blue-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Authentication Required
          </h1>
          <p className="text-gray-600">
            You need to sign in to access the Network Analysis Dashboard.
          </p>
          <button
            onClick={redirectToLogin}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  const getSentimentColor = (score: number) => {
    if (score > 0.5) return "text-green-500";
    if (score > 0) return "text-blue-500";
    if (score > -0.5) return "text-yellow-500";
    return "text-red-500";
  };

  const getQualityColor = (score: number) => {
    if (score >= 8) return "text-green-500";
    if (score >= 6) return "text-blue-500";
    if (score >= 4) return "text-yellow-500";
    return "text-red-500";
  };

  const getAnalysisRateColor = (rate: number) => {
    if (rate >= 90) return "text-green-500";
    if (rate >= 70) return "text-blue-500";
    if (rate >= 50) return "text-yellow-500";
    return "text-red-500";
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const getSortedProviderStats = () => {
    if (!stats) return [];

    return [...stats.providerStats].sort((a, b) => {
      let comparison = 0;

      if (sortField === "providerName") {
        comparison = a.providerName.localeCompare(b.providerName);
      } else if (sortField === "reportCount") {
        comparison = a.reportCount - b.reportCount;
      } else if (sortField === "avgSentiment") {
        comparison = a.avgSentiment - b.avgSentiment;
      } else if (sortField === "avgQuality") {
        comparison = a.avgQuality - b.avgQuality;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  };

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <h1 className="text-3xl font-bold text-gray-900">
            Network Analysis Dashboard
          </h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => fetchStats(true)} // Pass true to indicate manual refresh
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh Data
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-red-700">
            {error}
          </div>
        ) : stats ? (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 transition-all duration-200 hover:shadow-md">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Users className="h-6 w-6 text-blue-500" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Reports Overview
                  </h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="text-3xl font-bold text-gray-900">
                      {stats.totalReports.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">Total Reports</div>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <div className="text-2xl font-semibold text-blue-500">
                        {stats.analyzedReports.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        Analyzed Reports
                      </div>
                    </div>
                    <div
                      className={`text-sm font-medium ${getAnalysisRateColor(
                        (stats.analyzedReports / stats.totalReports) * 100
                      )}`}
                    >
                      {(
                        (stats.analyzedReports / stats.totalReports) *
                        100
                      ).toFixed(1)}
                      %
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 transition-all duration-200 hover:shadow-md">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <Signal className="h-6 w-6 text-green-500" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Performance Metrics
                  </h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-500">
                        Average Sentiment
                      </span>
                      <span
                        className={`text-sm font-medium ${getSentimentColor(
                          stats.averageSentiment
                        )}`}
                      >
                        {stats.averageSentiment.toFixed(2)}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all duration-500"
                        style={{
                          width: `${((stats.averageSentiment + 1) / 2) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-500">
                        Average Quality
                      </span>
                      <span
                        className={`text-sm font-medium ${getQualityColor(
                          stats.averageQuality
                        )}`}
                      >
                        {stats.averageQuality.toFixed(1)} / 10
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 transition-all duration-500"
                        style={{
                          width: `${(stats.averageQuality / 10) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 transition-all duration-200 hover:shadow-md">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <BarChart className="h-6 w-6 text-purple-500" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Analysis Status
                  </h2>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-2">
                    Last Analysis
                  </div>
                  <div className="text-xl font-semibold text-gray-900">
                    {format(new Date(stats.lastAnalysisTime), "PPp")}
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-sm text-gray-500">
                    <span>Processing rate:</span>
                    <span
                      className={getAnalysisRateColor(
                        (stats.analyzedReports / stats.totalReports) * 100
                      )}
                    >
                      {(
                        (stats.analyzedReports / stats.totalReports) *
                        100
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Provider Stats Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">
                  Provider Statistics
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th
                        className="text-left py-3 px-6 text-sm font-medium text-gray-500 cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("providerName")}
                      >
                        <div className="flex items-center gap-1">
                          Provider
                          {sortField === "providerName" &&
                            (sortDirection === "asc" ? (
                              <ArrowUp className="h-3 w-3" />
                            ) : (
                              <ArrowDown className="h-3 w-3" />
                            ))}
                        </div>
                      </th>
                      <th
                        className="text-left py-3 px-6 text-sm font-medium text-gray-500 cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("reportCount")}
                      >
                        <div className="flex items-center gap-1">
                          Reports
                          {sortField === "reportCount" &&
                            (sortDirection === "asc" ? (
                              <ArrowUp className="h-3 w-3" />
                            ) : (
                              <ArrowDown className="h-3 w-3" />
                            ))}
                        </div>
                      </th>
                      <th
                        className="text-left py-3 px-6 text-sm font-medium text-gray-500 cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("avgSentiment")}
                      >
                        <div className="flex items-center gap-1">
                          Avg. Sentiment
                          {sortField === "avgSentiment" &&
                            (sortDirection === "asc" ? (
                              <ArrowUp className="h-3 w-3" />
                            ) : (
                              <ArrowDown className="h-3 w-3" />
                            ))}
                        </div>
                      </th>
                      <th
                        className="text-left py-3 px-6 text-sm font-medium text-gray-500 cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("avgQuality")}
                      >
                        <div className="flex items-center gap-1">
                          Avg. Quality
                          {sortField === "avgQuality" &&
                            (sortDirection === "asc" ? (
                              <ArrowUp className="h-3 w-3" />
                            ) : (
                              <ArrowDown className="h-3 w-3" />
                            ))}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {getSortedProviderStats().map((provider) => (
                      <tr
                        key={provider.providerName}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-4 px-6 text-sm text-gray-900 font-medium">
                          {provider.providerName}
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-500">
                          {provider.reportCount.toLocaleString()}
                        </td>
                        <td className="py-4 px-6 text-sm">
                          <span
                            className={`font-medium ${getSentimentColor(
                              provider.avgSentiment
                            )}`}
                          >
                            {typeof provider.avgSentiment === "number"
                              ? provider.avgSentiment.toFixed(2)
                              : "-"}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-sm">
                          <span
                            className={`font-medium ${getQualityColor(
                              provider.avgQuality
                            )}`}
                          >
                            {typeof provider.avgQuality === "number"
                              ? provider.avgQuality.toFixed(1)
                              : "-"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
