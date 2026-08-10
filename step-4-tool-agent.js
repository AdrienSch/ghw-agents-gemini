import { GoogleGenAI, Type } from "@google/genai";
import "dotenv/config";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const rl = readline.createInterface({
  input,
  output,
});

// Our JavaScript tool
function getWeather(location) {
  const weatherData = {
    lagos: {
      temperature: 30,
      condition: "Sunny",
    },
    london: {
      temperature: 18,
      condition: "Cloudy",
    },
    "new york": {
      temperature: 24,
      condition: "Partly cloudy",
    },
  };

  const result = weatherData[location.toLowerCase()];

  if (!result) {
    return {
      location,
      message: "Weather data is not available for this location.",
    };
  }

  return {
    location,
    ...result,
  };
}

// Tell Gemini about the tool
const weatherTool = {
  name: "getWeather",
  description: "Get the current weather for a location.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      location: {
        type: Type.STRING,
        description: "The city to get weather information for.",
      },
    },
    required: ["location"],
  },
};

console.log("🤖 Gemini Tool Agent");
console.log("Ask me something. Type 'exit' to quit.\n");

while (true) {
  const userQuestion = await rl.question("You: ");

  if (userQuestion.toLowerCase() === "exit") {
    console.log("\n👋 Goodbye!");
    break;
  }

  try {
    // Ask Gemini the user's question
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: userQuestion,
      config: {
        tools: [
          {
            functionDeclarations: [weatherTool],
          },
        ],
      },
    });

    const functionCall = response.functionCalls?.[0];

    // If Gemini doesn't need a tool, just print its answer
    if (!functionCall) {
      console.log(`\n🤖 Gemini: ${response.text}\n`);
      continue;
    }

    console.log("\n🔧 Gemini decided to use a tool:");
    console.log(functionCall);

    // Our application executes the tool
    const toolResult = getWeather(functionCall.args.location);

    console.log("\n🌤️ Tool result:");
    console.log(toolResult);

    // Preserve Gemini's original response metadata
    const modelContent = response.candidates[0].content;

    // Send tool result back to Gemini
    const finalResponse = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: userQuestion,
            },
          ],
        },

        modelContent,

        {
          role: "user",
          parts: [
            {
              functionResponse: {
                name: functionCall.name,
                response: toolResult,
              },
            },
          ],
        },
      ],

      config: {
        tools: [
          {
            functionDeclarations: [weatherTool],
          },
        ],
      },
    });

    console.log(`\n🤖 Gemini: ${finalResponse.text}\n`);
  } catch (error) {
    console.error("\n❌ Something went wrong:");
    console.error(error.message);
    console.log();
  }
}

rl.close();