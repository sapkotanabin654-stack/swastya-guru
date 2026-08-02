import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Groq from "groq-sdk";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });



dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json({ limit: "20mb" }));


app.use(express.static(__dirname));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Open ai.html
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "ai.html"));
});

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

let conversation = [
    {
        role: "system",
        content: `
You are Swastya Guru AI.

You are an intelligent AI healthcare assistant.

Rules:
- Always reply in English.
- Give detailed, natural, human-like answers.
- Explain medical topics clearly.
- Use bullet points whenever useful.
- If the user asks a follow-up question, remember previous messages.
- Never say you are ChatGPT.
- If it is a medical emergency, advise the user to consult a qualified doctor or emergency services.
- Be friendly and professional.
`
    }
];

app.post("/chat", async (req, res) => {

    try {

        const { message } = req.body;

        if (!message) {
            return res.status(400).json({
                reply: "Please enter a message."
            });
        }

        conversation.push({
            role: "user",
            content: message
        });

        // Keep only recent conversation
        if (conversation.length > 20) {
            conversation = [
                conversation[0],
                ...conversation.slice(-19)
            ];
        }

        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: conversation,
            temperature: 0.7,
            max_tokens: 1024
        });

        const reply = completion.choices[0].message.content;

        conversation.push({
            role: "assistant",
            content: reply
        });

        res.json({
            reply
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            reply: "Sorry, I couldn't process your request. Please try again."
        });

    }

});


app.post("/new-chat", (req, res) => {

    conversation = [
        {
            role: "system",
            content: `
You are Swastya Guru AI.

You are an intelligent AI healthcare assistant.

Always answer in English.
`
        }
    ];

    res.json({
        success: true
    });

});
app.post("/image", async(req,res)=>{

    const {image}=req.body;

    if(!image){
        return res.status(400).json({
            reply:"No image received."
        });
    }

    

});
app.post("/upload", upload.single("image"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                reply: "No image uploaded."
            });
        }

        console.log("Uploaded:", req.file.filename);

        res.json({
            success: true,
            reply: "Image uploaded successfully.",
            filename: req.file.filename,
            imageUrl: `/uploads/${req.file.filename}`
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            reply: "Image upload failed."
        });
    }
});
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});