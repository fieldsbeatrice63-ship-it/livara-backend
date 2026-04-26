const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// HOME ROUTE
app.get("/", (req, res) => {
  res.send("Livara backend is running.");
});

// LIVARA DECISION ENGINE
app.post("/api/livara/decide", (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: "Message is required."
      });
    }

    const text = message.toLowerCase();

    let category = "direction";
    let urgency = "active";
    let reply = "";
    let options = [];
    let nextAction = "continue";

    // URGENCY DETECTION
    if (
      text.includes("now") ||
      text.includes("today") ||
      text.includes("asap") ||
      text.includes("emergency") ||
      text.includes("urgent") ||
      text.includes("late") ||
      text.includes("overdue")
    ) {
      urgency = "urgent";
    }

    // FOOD
    if (
      text.includes("eat") ||
      text.includes("food") ||
      text.includes("hungry") ||
      text.includes("lunch") ||
      text.includes("dinner") ||
      text.includes("breakfast") ||
      text.includes("restaurant")
    ) {
      category = "food";
      reply = "I’ll help you find something good nearby. What matters most right now?";
      options = ["Fast", "Affordable", "Healthy"];
      nextAction = "food_options";
    }

    // CREDIT / DOCUMENTS
    else if (
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
      category = "documents";
      reply = "I can help create the right document for you. What do you need?";
      options = [
        "Credit dispute letter",
        "Debt validation letter",
        "Proof of income letter"
      ];
      nextAction = "open_formatflow";
    }

    // MONEY
    else if (
      text.includes("money") ||
      text.includes("bill") ||
      text.includes("income") ||
      text.includes("funding") ||
      text.includes("cash") ||
      text.includes("pay") ||
      text.includes("rent")
    ) {
      category = "money";
      reply = "Let’s focus on what helps you most right now.";
      options = ["Pay a bill", "Find income", "Get funding"];
      nextAction = "money_options";
    }

    // HOUSING
    else if (
      text.includes("housing") ||
      text.includes("apartment") ||
      text.includes("home") ||
      text.includes("landlord") ||
      text.includes("lease") ||
      text.includes("move")
    ) {
      category = "housing";
      reply = "I can help with housing. What are you trying to handle?";
      options = ["Find housing", "Rental application help", "Create landlord letter"];
      nextAction = "housing_options";
    }

    // WORK
    else if (
      text.includes("job") ||
      text.includes("work") ||
      text.includes("career") ||
      text.includes("interview") ||
      text.includes("hiring")
    ) {
      category = "work";
      reply = "I can help with work. What do you need first?";
      options = ["Find jobs", "Build resume", "Practice interview"];
      nextAction = "work_options";
    }

    // DEFAULT
    else {
      category = "direction";
      reply = "Let’s narrow this down. What do you need most today?";
      options = ["Food", "Money", "Documents"];
      nextAction = "narrow_need";
    }

    return res.json({
      success: true,
      category,
      urgency,
      reply,
      options,
      nextAction
    });

  } catch (error) {
    console.error("Livara Error:", error);
    return res.status(500).json({
      success: false,
      error: "Server error."
    });
  }
});

// RENDER PORT
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Livara backend running on port ${PORT}`);
});
