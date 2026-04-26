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
  // FOOD
  if (
    text.includes("eat") ||
    text.includes("food") ||
    text.includes("hungry") ||
    text.includes("meal") ||
    text.includes("meals") ||
    text.includes("lunch") ||
    text.includes("dinner") ||
    text.includes("breakfast") ||
    text.includes("restaurant") ||
    text.includes("restaurants") ||
    text.includes("takeout") ||
    text.includes("delivery") ||
    text.includes("groceries") ||
    text.includes("grocery") ||
    text.includes("cheap food") ||
    text.includes("food near me") ||
    text.includes("healthy food")
  ) {
    return "food";
  }

  // DOCUMENTS / CREDIT
  if (
    text.includes("credit") ||
    text.includes("credit repair") ||
    text.includes("fix my credit") ||
    text.includes("dispute") ||
    text.includes("collection") ||
    text.includes("collections") ||
    text.includes("debt validation") ||
    text.includes("validation letter") ||
    text.includes("hard inquiry") ||
    text.includes("inquiry") ||
    text.includes("proof of income") ||
    text.includes("income letter") ||
    text.includes("hardship letter") ||
    text.includes("letter") ||
    text.includes("document") ||
    text.includes("documents") ||
    text.includes("resume") ||
    text.includes("cover letter")
  ) {
    return "documents";
  }

  // MONEY
  if (
    text.includes("money") ||
    text.includes("cash") ||
    text.includes("bill") ||
    text.includes("bills") ||
    text.includes("pay a bill") ||
    text.includes("pay bills") ||
    text.includes("need funding") ||
    text.includes("funding") ||
    text.includes("loan") ||
    text.includes("loans") ||
    text.includes("personal loan") ||
    text.includes("business funding") ||
    text.includes("income") ||
    text.includes("make money") ||
    text.includes("side hustle") ||
    text.includes("rent help") ||
    text.includes("utility help") ||
    text.includes("financial help") ||
    text.includes("emergency money")
  ) {
    return "money";
  }

  // HOUSING
  if (
    text.includes("housing") ||
    text.includes("apartment") ||
    text.includes("apartments") ||
    text.includes("rental") ||
    text.includes("renting") ||
    text.includes("renter") ||
    text.includes("rental application") ||
    text.includes("application help") ||
    text.includes("tenant") ||
    text.includes("landlord") ||
    text.includes("lease") ||
    text.includes("eviction") ||
    text.includes("move") ||
    text.includes("moving") ||
    text.includes("place to live") ||
    text.includes("rent assistance") ||
    text.includes("housing assistance")
    text.includes("home") ||
text.includes("homes") ||
text.includes("house") ||
text.includes("houses") ||
text.includes("find a home") ||
text.includes("find home") ||
  ) {
    return "housing";
  }

  // WORK
  if (
    text.includes("job") ||
    text.includes("jobs") ||
    text.includes("work") ||
    text.includes("career") ||
    text.includes("hiring") ||
    text.includes("interview") ||
    text.includes("resume help") ||
    text.includes("cover letter") ||
    text.includes("employment") ||
    text.includes("apply for jobs") ||
    text.includes("job application") ||
    text.includes("remote job") ||
    text.includes("part time") ||
    text.includes("full time")
  ) {
    return "work";
  }

  // FALLBACK
  return "unknown";
}

function getOptions(category) {
  const options = {
    food: ["Fast", "Affordable", "Healthy"],

    documents: [
      "Credit dispute letter",
      "Debt validation letter",
      "Proof of income letter"
    ],

    money: [
      "Pay a bill",
      "Find income",
      "Get funding"
    ],

    housing: [
      "Find housing",
      "Rental application help",
      "Create landlord letter"
    ],

    work: [
      "Find jobs",
      "Build resume",
      "Practice interview"
    ],

    direction: [
      "Food",
      "Money",
      "Documents"
    ],

    unknown: [
      "Food",
      "Money",
      "Documents",
      "Housing",
      "Work"
    ]
  };

  return options[category] || options.unknown;
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
Do not:
- promise guaranteed results
- give legal or financial guarantees
- create fake or misleading content


Your behavior:
- Respond directly to what the user actually asked.
- Do not repeat the same phrases every time.
- Do not sound generic.
- Keep responses short (1–3 sentences most of the time).
- If the user is unsure, guide them.
- If the user needs action, move them toward the right option.
- If the user is overwhelmed, simplify the next step.

Always:
- guide the user toward a real next step
- keep things simple and useful
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

    if (category === "unknown") {
  return res.json({
    success: true,
    category: "unknown",
    urgency: detectUrgency(text),
    reply: "I want to help, but I need a little more context. Please reword what you need using words like food, money, credit, housing, documents, or work.",
    options: ["Food", "Money", "Documents", "Housing", "Work"],
    nextAction: "reword_request"
  });
}

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
