// services/analysis.ts
import Together from "together-ai";
import { getConnection } from "@/lib/db";
import { RowDataPacket } from "mysql2";

const together = new Together({ apiKey: process.env.TOGETHER_API_KEY });

interface ReportRow extends RowDataPacket {
  id: number;
  comment: string;
  download_speed: number;
  upload_speed: number;
  created_at: Date;
}

interface AnalysisResult {
  sentiment_score: number;
  quality_score: number;
  analysis: string;
  sentiment_aspects: {
    speed_satisfaction: number; // -1 to 1
    reliability_satisfaction: number; // -1 to 1
    value_satisfaction: number; // -1 to 1
    service_satisfaction: number; // -1 to 1
    aspects_analysis: string;
  };
}

function cleanJsonResponse(content: string): string {
  // Remove markdown code blocks and any surrounding whitespace
  return content
    .replace(/```json\n?/g, "") // Remove ```json
    .replace(/```\n?/g, "") // Remove ```
    .trim(); // Remove surrounding whitespace
}

function validateAnalysis(analysis: any): analysis is AnalysisResult {
  return (
    typeof analysis === "object" &&
    typeof analysis.sentiment_score === "number" &&
    typeof analysis.quality_score === "number" &&
    typeof analysis.analysis === "string" &&
    typeof analysis.sentiment_aspects === "object" &&
    typeof analysis.sentiment_aspects.speed_satisfaction === "number" &&
    typeof analysis.sentiment_aspects.reliability_satisfaction === "number" &&
    typeof analysis.sentiment_aspects.value_satisfaction === "number" &&
    typeof analysis.sentiment_aspects.service_satisfaction === "number" &&
    typeof analysis.sentiment_aspects.aspects_analysis === "string"
  );
}

export async function analyzeReports() {
  const connection = await getConnection();

  try {
    const [reports] = await connection.execute<ReportRow[]>(`
      SELECT 
        r.id,
        r.comment,
        r.download_speed,
        r.upload_speed,
        r.created_at
      FROM network_reports r
      LEFT JOIN analysis_results a ON r.id = a.report_id
      WHERE a.sentiment_score IS NULL
      AND r.created_at >= NOW() - INTERVAL 120 MINUTE;
    `);

    console.log(`Found ${reports.length} reports to analyze`);

    for (const report of reports) {
      try {
        const response = await together.chat.completions.create({
          messages: [
            {
              role: "system",
              content: `You are an AI that analyzes network quality reports. Analyze both overall sentiment and specific aspects:
                - Overall sentiment: -1 (very negative) to 1 (very positive)
                - Network quality: 0 (very poor) to 10 (excellent)
                - Aspect-specific sentiment (-1 to 1 for each):
                  * Speed satisfaction: analyzing user satisfaction with network speed
                  * Reliability satisfaction: analyzing network stability and consistency
                  * Value satisfaction: analyzing if user feels service is worth the cost
                  * Service satisfaction: analyzing user's experience with provider service
                Return a valid JSON object without markdown formatting.`,
            },
            {
              role: "user",
              content: `Analyze this network report in detail:
                Comment: ${report.comment}
                Download Speed: ${report.download_speed} Mbps
                Upload Speed: ${report.upload_speed} Mbps
                
                Return ONLY JSON in this format:
                {
                  "sentiment_score": number,
                  "quality_score": number,
                  "analysis": string,
                  "sentiment_aspects": {
                    "speed_satisfaction": number,
                    "reliability_satisfaction": number,
                    "value_satisfaction": number,
                    "service_satisfaction": number,
                    "aspects_analysis": string
                  }
                }`,
            },
          ],
          model: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
          temperature: 0.7,
          top_p: 0.7,
          top_k: 50,
        });

        if (!response.choices[0]?.message?.content) {
          throw new Error("No response content from AI");
        }

        const cleanContent = cleanJsonResponse(
          response.choices[0].message.content
        );

        try {
          const analysis: AnalysisResult = JSON.parse(cleanContent);

          // Validate the analysis object
          if (!validateAnalysis(analysis)) {
            throw new Error("Invalid analysis format");
          }

          // Update analysis results with sentiment aspects
          await connection.execute(
            `UPDATE analysis_results 
             SET sentiment_score = ?,
                 quality_score = ?,
                 sentiment_aspects = ?,
                 analysis_details = ?,
                 updated_at = NOW()
             WHERE report_id = ?`,
            [
              analysis.sentiment_score,
              analysis.quality_score,
              JSON.stringify(analysis.sentiment_aspects),
              JSON.stringify(analysis),
              report.id,
            ]
          );

          // Update network_reports table
          await connection.execute(
            `UPDATE network_reports 
             SET sentiment_score = ?,
                network_quality_score = ?,
                updated_at = NOW()
          WHERE id = ?`,
            [analysis.sentiment_score, analysis.quality_score, report.id]
          );

          // Commit the transaction
          await connection.commit();

          console.log(`Analyzed report ${report.id}`);
        } catch (parseError) {
          console.error(`Error parsing AI response for report ${report.id}:`, {
            content: response.choices[0].message.content,
            cleanContent,
            error: parseError,
          });
          continue;
        }
      } catch (error) {
        console.error(`Error analyzing report ${report.id}:`, error);
      }
    }

    return {
      success: true,
      analyzed: reports.length,
    };
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  } finally {
    await connection.end();
  }
}
