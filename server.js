const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");

const app = express();

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.get("/", (req, res) => {
  res.send("Livara backend is running.");
});

function detectUrgency(text) {
  if (
    text.includes("now") ||
    text.includes("today") ||
    text.includes("asap") ||
    text.includes("emergency") ||
    text.includes("urgent") ||
    text.includes("late") ||
    text.includes("overdue")
  ) {
    return "urgent";
  }

  if (
    text.includes("how") ||
    text.includes("what is") ||
    text.includes("explain") ||
    text.includes("learn")
  ) {
    return "exploring";
  }

  return "active";
}

function detectCategory(text) {
  if (
    text.includes("eat") ||
    text.includes("food") ||
    text.includes("hungry") ||
    text.includes("lunch") ||
    text.includes("dinner") ||
    text.includes("breakfast") ||
    text.includes("restaurant")
  ) {
    return "food";
  }

  if (
    text.includes("credit") ||
    text.includes("dispute") ||
    text.includes("letter") ||
    text.includes("collection") ||
    text.includes("debt") ||
    text.includes("validation") ||
    text.includes("inquiry") ||
    text.includes("proof of income") ||
    text.includes("hardship") ||
    text.includes("resume")
  ) {
    return "documents";
  }

  if (
    text.includes("money") ||
    text.includes("bill") ||
    text.includes("income") ||
    text.includes("funding") ||
    text.includes("cash") ||
    text.includes("pay") ||
    text.includes("rent")
  ) {
    return "money";
  }

  if (
    text.includes("housing") ||
    text.includes("apartment") ||
    text.includes("home") ||
    text.includes("landlord") ||
    text.includes("lease") ||
    text.includes("move")
  ) {
    return "housing";
  }

  if (
    text.includes("job") ||
    text.includes("work") ||
    text.includes("career") ||
    text.includes("interview") ||
    text.includes("hiring")
  ) {
    return "work";
  }

  return "direction";
}

function getOptions(category) {
  const options = {
    food: ["Fast", "Affordable", "Healthy"],
    documents: [
      "Credit dispute letter",
      "Debt validation letter",
      "Proof of income letter"
    ],
    money: ["Pay a bill", "Find income", "Get funding"],
    housing: ["Find housing", "Rental application help", "Create landlord letter"],
    work: ["Find jobs", "Build resume", "Practice interview"],
    direction: ["Food", "Money", "Documents"]
  };

  return options[category] || options.direction;
}

// HALO governance framework
function haloCheck(message) {
  const text = message.toLowerCase();

  const blockedPatterns = [
    "fake document",
    "forge",
    "commit fraud",
    "lie on",
    "illegal",
    "bypass verification"
  ];

  const matched = blockedPatterns.find(pattern => text.includes(pattern));

  if (matched) {
    return {
      allowed: false,
      reason: "unsafe_or_improper_request"
    };
  }

  return {
    allowed: true,
    reason: "allowed"
  };
}

async function createLivaraReply(message, category, urgency) {
  const systemPrompt = `
You are Livara, a calm, clear, supportive life decision assistant.

You help users narrow real-life needs into simple next steps.

Your tone:
- warm
- direct
- human
- clear
- not robotic
- not overly emotional
- not overly spiritual
- no long lectures

Rules:
- Keep responses short.
- Never overwhelm the user.
- Give 2-3 next-step choices when helpful.
- Do not claim guaranteed outcomes.
- Do not provide legal, medical, or financial guarantees.
- For credit or document needs, guide the user toward proper, lawful document creation.
- If a user asks for fraud, fake documents, illegal actions, or bypassing verification, redirect to safe/legal options.
- Do not mention HALO to the user.
- Do not sound like a generic AI chatbot.
`;

  const userPrompt = `
User message: ${message}
Detected category: ${category}
Detected urgency: ${urgency}

Create Livara's response in 1-3 short sentences.
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    temperature: 0.6,
    max_tokens: 130
  });

  return response.choices[0].message.content.trim();
}

app.post("/api/livara/decide", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: "Message is required."
      });
    }

    const text = message.toLowerCase();
    const category = detectCategory(text);
    const urgency = detectUrgency(text);
    const options = getOptions(category);
    const halo = haloCheck(message);

    if (!halo.allowed) {
      return res.json({
        success: true,
        category,
        urgency,
        reply: "I can’t help with anything false or improper. I can help you create a proper document or find the right lawful next step.",
        options,
        nextAction: "safe_redirect"
      });
    }

    let reply;

    if (process.env.OPENAI_API_KEY) {
      reply = await createLivaraReply(message, category, urgency);
    } else {
      reply = "Let’s narrow this down. What do you need most today?";
    }

    return res.json({
      success: true,
      category,
      urgency,
      reply,
      options,
      nextAction: category === "documents" ? "open_formatflow" : category + "_options"
    });

  } catch (error) {
    console.error("Livara Error:", error);

    return res.status(500).json({
      success: false,
      error: "Server error."
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Livara backend running on port ${PORT}`);
});
