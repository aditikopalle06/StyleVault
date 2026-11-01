
require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function main() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: "Reply with just the word OK.",
    });

    console.log("Gemini test succeeded:", response.text);
  } catch (error) {
    console.error("Gemini test failed.");
    console.error("Status:", error.status);
    console.error("Message:", error.message);
  }
}

main();
