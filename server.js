import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Groq from "groq-sdk";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

// Serve all static files (HTML, CSS, JS, images)
app.use(express.static(__dirname));

// Open ai.html when visiting the website
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "ai.html"));
});

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Chat API
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are Swasthya Guru AI, a helpful health assistant. Reply in Nepali whenever possible.",
        },
        {
          role: "user",
          content: message,
        },
      ],
    });

    res.json({
      reply: completion.choices[0].message.content,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      reply: "Server error",
    });
  }
});

// Use Render's PORT if available
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});