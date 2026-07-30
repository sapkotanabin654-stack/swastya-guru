// ===============================
// SWASTYA GURU AI - SCRIPT
// ===============================

const chatBox = document.getElementById("chatBox");
const input = document.getElementById("prompt");
const sendBtn = document.getElementById("send");
const speakBtn = document.getElementById("speak");
const cameraBtn = document.getElementById("camera");
const imageInput = document.getElementById("image");
const videoInput = document.getElementById("video");

let lastBotReply = "";

// ===============================
// Add Message
// ===============================

function addMessage(text, sender) {

    const div = document.createElement("div");
    div.className = sender;

    div.innerHTML = `<p>${text}</p>`;

    chatBox.appendChild(div);

    chatBox.scrollTop = chatBox.scrollHeight;
}

// ===============================
// Send Text Message
// ===============================

async function sendMessage() {

    const message = input.value.trim();

    if (message === "") return;

    addMessage(message, "user");

    input.value = "";

    try {

        const response = await fetch("https://swastya-guru.onrender.com/chat", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                message: message
            })

        });

        const data = await response.json();

        lastBotReply = data.reply;

        addMessage(data.reply, "bot");

    } catch (error) {

        console.error(error);

        addMessage("❌ Unable to connect to the AI server.", "bot");

    }

}

// ===============================
// Send Button
// ===============================

sendBtn.addEventListener("click", sendMessage);

// ===============================
// Enter Key
// ===============================

input.addEventListener("keydown", function (e) {

    if (e.key === "Enter") {

        sendMessage();

    }

});

// ===============================
// Speak Button
// (Only speaks when clicked)
// ===============================

speakBtn.addEventListener("click", () => {

    if (lastBotReply === "") {

        alert("No AI reply available.");

        return;

    }

    const speech = new SpeechSynthesisUtterance(lastBotReply);

    speech.lang = "en-US";      // Change to "ne-NP" if your browser supports Nepali
    speech.rate = 1;
    speech.pitch = 1;
    speech.volume = 1;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(speech);

});

// ===============================
// Camera
// ===============================

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

        addMessage("📷 Image Captured", "user");

        const response = await fetch("https://swastya-guru.onrender.com/image", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                image: image
            })

        });

        const data = await response.json();

        lastBotReply = data.reply;

        addMessage(data.reply, "bot");

    } catch (error) {

        console.error(error);

        addMessage("❌ Unable to access camera.", "bot");

    }

});

// ===============================
// Image Upload
// ===============================

imageInput.addEventListener("change", () => {

    if (imageInput.files.length > 0) {

        addMessage("🖼️ Selected Image: " + imageInput.files[0].name, "user");

    }

});

// ===============================
// Video Upload
// ===============================

videoInput.addEventListener("change", () => {

    if (videoInput.files.length > 0) {

        addMessage("🎥 Selected Video: " + videoInput.files[0].name, "user");

    }

});