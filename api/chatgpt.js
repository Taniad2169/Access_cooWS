export default async function handler(req, res) {
  try {
    const { prompt } = await req.json();

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + process.env.OPENAI_API_KEY
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await response.json();
    const result = data?.choices?.[0]?.message?.content || "No response from ChatGPT.";
    return res.status(200).json({ result });
  } catch (error) {
    return res.status(500).json({ error: "ChatGPT API Error: " + error.message });
  }
} 
