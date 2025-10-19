"use server"

import { generateText } from "ai"

export async function generateWeeklySummary(summaries: string[]): Promise<string> {
  try {
    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt: `You are analyzing weekly student consultant activity reports for the SEED program at Suffolk University. Based on the following work summaries from students across different clinics (Consulting, Accounting, Resource Acquisition/Funding, Marketing), provide a concise 2-3 paragraph executive summary highlighting:

1. Major accomplishments and milestones achieved this week
2. Key client engagements and progress
3. Any notable challenges or important items that require attention

Work summaries:
${summaries.join("\n")}

Write in a professional tone suitable for clinic directors. Focus on actionable insights and program-wide trends.`,
    })
    return text
  } catch (error) {
    console.error("[v0] Error generating summary:", error)
    throw new Error("Failed to generate weekly summary")
  }
}
