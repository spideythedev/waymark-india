const GROQ_API_KEY = defineSecret("GROQ_API_KEY");

export const askWaymark = onCall(
  {
    region: REGION,
    secrets: [GROQ_API_KEY]
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "Sign in to use WAYMARK Intelligence."
      );
    }

    const question = String(request.data?.question || "").trim();

    if (!question || question.length > 4000) {
      throw new HttpsError(
        "invalid-argument",
        "Your question must be between 1 and 4000 characters."
      );
    }

    const context = request.data?.context || {};

    const safeContext = {
      educationLevel: String(context.educationLevel || "").slice(0, 80),
      stream: String(context.stream || "").slice(0, 80),
      interests: Array.isArray(context.interests)
        ? context.interests.slice(0, 8).map((item) => String(item).slice(0, 80))
        : [],
      goals: Array.isArray(context.goals)
        ? context.goals.slice(0, 5).map((item) => String(item).slice(0, 100))
        : [],
      preferredStates: Array.isArray(context.preferredStates)
        ? context.preferredStates.slice(0, 5).map((item) => String(item).slice(0, 80))
        : []
    };

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY.value()}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          temperature: 0.4,
          max_tokens: 1800,
          messages: [
            {
              role: "system",
              content: [
                "You are WAYMARK Intelligence, an education guidance assistant focused on India.",
                "Give clear, practical, age-appropriate educational guidance.",
                "Never invent colleges, courses, fees, eligibility rules, exam dates, scholarships, or admission deadlines.",
                "Distinguish verified facts from general guidance and uncertainty.",
                "When a current official fact cannot be confirmed, say so and direct the student to the relevant official authority.",
                "Do not claim that AI-generated suggestions are official or verified.",
                "Explain alternatives and trade-offs rather than forcing one career choice.",
                "Use the student's profile only as context, not as a limitation."
              ].join(" ")
            },
            {
              role: "user",
              content: `Student context:\n${JSON.stringify(safeContext)}\n\nQuestion:\n${question}`
            }
          ]
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Groq request failed:", response.status, errorText);

      throw new HttpsError(
        "unavailable",
        "WAYMARK Intelligence is temporarily unavailable."
      );
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content?.trim();

    if (!answer) {
      throw new HttpsError(
        "internal",
        "The AI service returned an empty response."
      );
    }

    return {
      answer,
      model: "openai/gpt-oss-120b"
    };
  }
);