export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "POST only" }) };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: "API key not configured" }) };
  }

  let question;
  try {
    question = JSON.parse(event.body || "{}").question;
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid request" }) };
  }

  if (typeof question !== "string" || !question.trim() || question.length > 4000) {
    return { statusCode: 400, body: JSON.stringify({ error: "Enter a shorter question" }) };
  }

  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: question }] }]
        })
      }
    );

    if (!response.ok) throw new Error("Gemini request failed");

    const data = await response.json();
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;

    return {
      statusCode: 200,
      body: JSON.stringify({ answer: answer || "I couldn't generate an answer. Please try again." })
    };
  } catch {
    return {
      statusCode: 502,
      body: JSON.stringify({ error: "AI is unavailable. Please try again." })
    };
  }
}
