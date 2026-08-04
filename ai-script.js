const chatBox = document.getElementById("chatBox");
const input = document.getElementById("prompt");
const sendBtn = document.getElementById("send");
const speakBtn = document.getElementById("speak");
const cameraBtn = document.getElementById("camera");
const imageInput = document.getElementById("image");
const videoInput = document.getElementById("video");

let lastBotReply = "";

// =========================
// Voice Recognition
// =========================

const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

let recognition = null;

if (SpeechRecognition) {
    recognition = new SpeechRecognition();

    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
        addMessage("Listening...", "bot");
    };

    recognition.onresult = async (event) => {
        const voiceText = event.results[0][0].transcript;

        input.value = voiceText;

        await sendMessage();
    };

    recognition.onerror = (event) => {
        console.error(event);
        addMessage("Voice recognition failed.", "bot");
    };
}

function addMessage(text, sender) {

    const message = document.createElement("div");
    message.className = sender;

    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.innerHTML = text;

    message.appendChild(bubble);

    chatBox.appendChild(message);

    setTimeout(() => {
        chatBox.scrollTop = chatBox.scrollHeight;
    }, 100);

}

async function sendMessage() {

    const message = input.value.trim();

    if (!message) return;

    addMessage(message, "user");

    input.value = "";

    try {

        const response = await fetch("https://swastya-guru.onrender.com/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message
            })
        });

        if (!response.ok) {
            throw new Error("Server Error");
        }

        const data = await response.json();

        lastBotReply = data.reply;

        addMessage(data.reply, "bot");

    } catch (error) {

        console.error(error);

        addMessage("❌ Unable to connect to the AI server.", "bot");

    }

}

// =========================
// Send Button
// =========================

sendBtn.addEventListener("click", sendMessage);

input.addEventListener("keydown", (e) => {

    if (e.key === "Enter") {

        e.preventDefault();

        sendMessage();

    }

});

// =========================
// Microphone Button
// Click -> Speak -> Send to AI
// =========================

speakBtn.addEventListener("click", () => {

    if (!recognition) {
        alert("Speech Recognition is not supported in this browser.");
        return;
    }

    recognition.start();

});

// =========================
// Speaker Button
// Reads Last AI Reply Only
// =========================

document.getElementById("sound").addEventListener("click", () => {

    if (!lastBotReply) {

        alert("No AI reply available.");

        return;

    }

    window.speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(lastBotReply);

    speech.lang = "en-US";
    speech.rate = 1;
    speech.pitch = 1;
    speech.volume = 1;

    window.speechSynthesis.speak(speech);

});

// =========================
// Camera Capture
// =========================

cameraBtn.addEventListener("click", async () => {

    try {

        const stream = await navigator.mediaDevices.getUserMedia({
            video: true
        });

        const video = document.createElement("video");

        video.srcObject = stream;

        await video.play();

        const canvas = document.createElement("canvas");

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext("2d");

        ctx.drawImage(video, 0, 0);

        stream.getTracks().forEach(track => track.stop());

        const image = canvas.toDataURL("image/jpeg");

        const blob = await (await fetch(image)).blob();

        const formData = new FormData();

        formData.append("image", blob, "camera.jpg");

        addMessage("📷 Image Captured", "user");

        const response = await fetch("https://swastya-guru.onrender.com/upload", {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            throw new Error("Image Error");
        }

        const data = await response.json();

        lastBotReply = data.reply;

        addMessage(data.reply, "bot");

    } catch (error) {

        console.error(error);

        addMessage("❌ Unable to access camera.", "bot");

    }

});

// =========================
// Image Upload
// =========================

imageInput.addEventListener("change", async () => {

    if (imageInput.files.length === 0) return;

    const file = imageInput.files[0];

    addMessage("🖼️ Selected Image: " + file.name, "user");

    const formData = new FormData();

    formData.append("image", file);

    try {

        const response = await fetch("https://swastya-guru.onrender.com/upload", {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        lastBotReply = data.reply;

        addMessage(data.reply, "bot");

    } catch (error) {

        console.error(error);

        addMessage("❌ Image upload failed.", "bot");

    }

});

// =========================
// Video Upload
// =========================

videoInput.addEventListener("change", () => {

    if (videoInput.files.length > 0) {

        addMessage("🎥 Selected Video: " + videoInput.files[0].name, "user");

    }

});