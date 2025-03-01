// app/api/analysis-stats/route.ts
import { NextResponse } from "next/server";
import { getConnection } from "@/lib/db";
import { RowDataPacket } from "mysql2";

interface StatsRow extends RowDataPacket {
  totalReports: number;
  analyzedReports: number;
  avgSentiment: number;
  avgQuality: number;
  lastAnalysis: Date;
}

interface ProviderStatsRow extends RowDataPacket {
  providerName: string;
  reportCount: number;
  avgSentiment: number | null;
  avgQuality: number | null;
}

export async function GET() {
  try {
    const connection = await getConnection();

    // Get overall stats with proper typing
    const [overallStats] = await connection.execute<StatsRow[]>(`
      SELECT 
    COUNT(nr.id) AS totalReports,
    COUNT(CASE WHEN nr.sentiment_score IS NOT NULL THEN 1 END) as analyzedReports,
    AVG(nr.sentiment_score) AS avgSentiment,
    AVG(nr.network_quality_score) AS avgQuality,
    MAX(ar.updated_at) AS lastAnalysis
FROM network_reports nr
LEFT JOIN analysis_results ar ON nr.id = ar.report_id;
    `);

    // Get provider stats with proper typing
    const [providerStats] = await connection.execute<ProviderStatsRow[]>(`
      SELECT 
        p.name as providerName,
        COUNT(*) as reportCount,
        AVG(r.sentiment_score) as avgSentiment,
        AVG(r.network_quality_score) as avgQuality
      FROM network_reports r
      JOIN providers p ON r.provider_id = p.id
      GROUP BY p.id, p.name
      ORDER BY reportCount DESC
    `);

    await connection.end();

    return NextResponse.json({
      success: true,
      stats: {
        totalReports: Number(overallStats[0].totalReports),
        analyzedReports: Number(overallStats[0].analyzedReports),
        lastAnalysisTime: overallStats[0].lastAnalysis,
        averageSentiment: Number(overallStats[0].avgSentiment) || 0,
        averageQuality: Number(overallStats[0].avgQuality) || 0,
        providerStats: providerStats.map((provider) => ({
          providerName: provider.providerName,
          reportCount: Number(provider.reportCount),
          avgSentiment: Number(provider.avgSentiment) || 0,
          avgQuality: Number(provider.avgQuality) || 0,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}
