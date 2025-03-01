// app/page.tsx
"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { BarChart, Signal, Users } from "lucide-react";

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
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AnalysisStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/analysis-stats");
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      } else {
        setError(data.error || "Failed to fetch statistics");
      }
    } catch (error) {
      setError("Error fetching statistics");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

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

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Network Analysis Dashboard
          </h1>
          <p className="text-sm text-gray-500">
            Auto-refreshes every 5 minutes
          </p>
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
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
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
                      {stats.totalReports}
                    </div>
                    <div className="text-sm text-gray-500">Total Reports</div>
                  </div>
                  <div>
                    <div className="text-2xl font-semibold text-blue-500">
                      {stats.analyzedReports}
                    </div>
                    <div className="text-sm text-gray-500">
                      Analyzed Reports
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
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
                        {stats.averageQuality.toFixed(1)}
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

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
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
                  <div className="mt-4 text-sm text-gray-500">
                    Analysis Rate:{" "}
                    {(
                      (stats.analyzedReports / stats.totalReports) *
                      100
                    ).toFixed(1)}
                    %
                  </div>
                </div>
              </div>
            </div>

            {/* Provider Stats Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">
                  Provider Statistics
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">
                        Provider
                      </th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">
                        Reports
                      </th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">
                        Avg. Sentiment
                      </th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">
                        Avg. Quality
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {stats.providerStats.map((provider) => (
                      <tr
                        key={provider.providerName}
                        className="hover:bg-gray-50"
                      >
                        <td className="py-4 px-6 text-sm text-gray-900 font-medium">
                          {provider.providerName}
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-500">
                          {provider.reportCount}
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
