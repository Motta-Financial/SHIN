"use server"

export async function generateClientSummary(
  clientName: string,
  workSummaries: string[],
  studentNames: string[],
): Promise<string> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error("[v0] OPENAI_API_KEY not configured")
      throw new Error("OpenAI API key not configured. Please add OPENAI_API_KEY to environment variables.")
    }

    const validClientName = clientName && typeof clientName === "string" ? clientName : "Unknown Client"

    const validWorkSummaries = Array.isArray(workSummaries)
      ? workSummaries.filter((s) => s && typeof s === "string" && s.trim().length > 0)
      : []

    const validStudentNames = Array.isArray(studentNames)
      ? studentNames.filter((s) => s && typeof s === "string" && s.trim().length > 0)
      : []

    if (validWorkSummaries.length === 0) {
      throw new Error("No valid work summaries provided")
    }

    if (validStudentNames.length === 0) {
      throw new Error("No valid student names provided")
    }

    const teamMembersText = validStudentNames.join(", ")
    const workDescriptionsText = validWorkSummaries.map((s, i) => `${i + 1}. ${s}`).join("\n")

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are summarizing weekly work for a client in the SEED program at Suffolk University. Create concise 2-3 sentence summaries that describe accomplishments, focus on progress and deliverables, use professional language, and do NOT mention hours or time spent.",
          },
          {
            role: "user",
            content: `Client: ${validClientName}
Team Members: ${teamMembersText}

Student Work Descriptions:
${workDescriptionsText}

Create a summary that combines all student work into a cohesive narrative about what was accomplished for this client this week.`,
          },
        ],
        max_tokens: 150,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`OpenAI API error: ${response.status} - ${JSON.stringify(errorData)}`)
    }

    const data = await response.json()

    if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
      throw new Error("Invalid response format from OpenAI")
    }

    const text = data.choices[0].message.content.trim()

    if (!text || text.length === 0) {
      throw new Error("No summary generated")
    }

    return text
  } catch (error: any) {
    console.error("[v0] Error generating client summary:", error.message || error)
    throw error
  }
}
