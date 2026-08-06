const chatBox = document.getElementById("chatBox");
const input = document.getElementById("prompt");

const sendBtn = document.getElementById("send");
const micBtn = document.getElementById("mic");
const speakBtn = document.getElementById("speak");
const cameraBtn = document.getElementById("camera");

const imageInput = document.getElementById("uploadImage");
const videoInput = document.getElementById("video");

let lastBotReply = "";

// ===== Speech =====
let recognition = null;
let listeningMessage = null;

let speech = null;
let isSpeaking = false;

// ================= Speech Recognition =================

if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    recognition = new SpeechRecognition();

    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
}

// ================= Chat Message =================

function addMessage(text, sender) {

    const message = document.createElement("div");
    message.className = sender;

    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.innerHTML = text;

    message.appendChild(bubble);

    chatBox.appendChild(message);

    // Auto scroll
    requestAnimationFrame(() => {
        chatBox.scrollTop = chatBox.scrollHeight;
    });

}

// ================= Send =================

async function sendMessage() {

    const message = input.value.trim();

    if (!message) return;

    addMessage(message, "user");

    input.value = "";

    try {

        const response = await fetch(
            "https://swastya-guru.onrender.com/chat",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    message
                })
            }
        );

        if (!response.ok)
            throw new Error("Server Error");

        const data = await response.json();

        lastBotReply = data.reply;

        addMessage(data.reply, "bot");

    } catch (err) {

        console.error(err);

        addMessage(
            "❌ Unable to connect to AI server.",
            "bot"
        );

    }

}

// ================= Send Button =================

sendBtn.addEventListener("click", sendMessage);

input.addEventListener("keydown", (e) => {

    if (e.key === "Enter") {

        e.preventDefault();

        sendMessage();

    }

});

// ================= Microphone =================

if (recognition) {

    micBtn.addEventListener("click", () => {

        recognition.start();

    });

    recognition.onstart = () => {

        listeningMessage = document.createElement("div");

        listeningMessage.className = "bot";

        listeningMessage.innerHTML = `
            <div class="bubble">
               स्वास्थ्य गुरु ले सुनिरहेको छ.......
            </div>
        `;

        chatBox.appendChild(listeningMessage);

        chatBox.scrollTop = chatBox.scrollHeight;

    };

    recognition.onresult = (event) => {

        if (listeningMessage) {

            listeningMessage.remove();

            listeningMessage = null;

        }

        input.value = event.results[0][0].transcript;

        sendMessage();

    };

    recognition.onerror = (event) => {

        if (listeningMessage) {

            listeningMessage.remove();

            listeningMessage = null;

        }

        addMessage(
            "❌ Microphone Error : " + event.error,
            "bot"
        );

    };

    recognition.onend = () => {

        if (listeningMessage) {

            listeningMessage.remove();

            listeningMessage = null;

        }

    };

}

// ================= Speaker Button =================

speakBtn.addEventListener("click", () => {

    if (!lastBotReply) {
        alert("No AI reply available.");
        return;
    }

    // Stop if already speaking
    if (speechSynthesis.speaking || isSpeaking) {

        speechSynthesis.cancel();

        isSpeaking = false;

        speakBtn.innerHTML =
            '<i class="fa-solid fa-volume-high"></i>';

        return;
    }

    speech = new SpeechSynthesisUtterance(lastBotReply);

    speech.lang = "en-US";
    speech.rate = 1;
    speech.pitch = 1;
    speech.volume = 1;

    isSpeaking = true;

    // Change icon while speaking
    speakBtn.innerHTML =
        '<i class="fa-solid fa-stop"></i>';

    speech.onend = () => {

        isSpeaking = false;

        speakBtn.innerHTML =
            '<i class="fa-solid fa-volume-high"></i>';

    };

    speech.onerror = () => {

        isSpeaking = false;

        speakBtn.innerHTML =
            '<i class="fa-solid fa-volume-high"></i>';

    };

    speechSynthesis.speak(speech);

});
// ================= CAMERA =================

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

        // Stop camera
        stream.getTracks().forEach(track => track.stop());

        const image = canvas.toDataURL("image/jpeg");

        const blob = await (await fetch(image)).blob();

        const formData = new FormData();

        formData.append("image", blob, "camera.jpg");

        addMessage("📷 Camera image captured.", "user");

        const response = await fetch(
            "https://swastya-guru.onrender.com/upload",
            {
                method: "POST",
                body: formData
            }
        );

        if (!response.ok)
            throw new Error("Upload Failed");

        const data = await response.json();

        lastBotReply = data.reply;

        addMessage(data.reply, "bot");

    } catch (err) {

        console.error(err);

        addMessage("❌ Unable to access camera.", "bot");

    }

});

// ================= IMAGE UPLOAD =================

imageInput.addEventListener("change", async () => {

    if (!imageInput.files.length) return;

    const file = imageInput.files[0];

    addMessage("🖼️ Image: " + file.name, "user");

    const formData = new FormData();

    formData.append("image", file);

    try {

        const response = await fetch(
            "https://swastya-guru.onrender.com/upload",
            {
                method: "POST",
                body: formData
            }
        );

        if (!response.ok)
            throw new Error("Upload Failed");

        const data = await response.json();

        lastBotReply = data.reply;

        addMessage(data.reply, "bot");

    } catch (err) {

        console.error(err);

        addMessage("❌ Image upload failed.", "bot");

    }

});

// ================= VIDEO =================

videoInput.addEventListener("change", () => {

    if (!videoInput.files.length) return;

    const file = videoInput.files[0];

    addMessage("🎥 Video selected: " + file.name, "user");

});
// ================= NEW CHAT =================

const newChatBtn = document.getElementById("newChat");

if (newChatBtn) {

    newChatBtn.addEventListener("click", async () => {

        try {

            // Stop speaking if AI is talking
            speechSynthesis.cancel();

            isSpeaking = false;

            speakBtn.innerHTML =
                '<i class="fa-solid fa-volume-high"></i>';

            await fetch(
                "https://swastya-guru.onrender.com/new-chat",
                {
                    method: "POST"
                }
            );

            chatBox.innerHTML = "";

            lastBotReply = "";

            addMessage(
                "<strong>👋 Hello!</strong><br><br>I am <b>Swastya Guru AI</b>.<br><br>Ask me any health-related question.",
                "bot"
            );

        } catch (err) {

            console.error(err);

            addMessage(
                "❌ Unable to start a new chat.",
                "bot"
            );

        }

    });

}

// ================= HEADER SPEAKER =================

const headerSpeak = document.getElementById("headerSpeak");

if (headerSpeak) {

    headerSpeak.addEventListener("click", () => {

        if (!lastBotReply) {
            alert("No AI reply available.");
            return;
        }

        // Stop if already speaking
        if (speechSynthesis.speaking) {

            speechSynthesis.cancel();

            return;

        }

        const headerSpeech =
            new SpeechSynthesisUtterance(lastBotReply);

        headerSpeech.lang = "en-US";
        headerSpeech.rate = 1;
        headerSpeech.pitch = 1;
        headerSpeech.volume = 1;

        speechSynthesis.speak(headerSpeech);

    });

}
// ================= PAGE LOAD =================

window.addEventListener("load", () => {

    input.focus();

    // Scroll to latest message
    setTimeout(() => {
        chatBox.scrollTop = chatBox.scrollHeight;
    }, 100);

});

// ================= STOP SPEECH WHEN LEAVING =================

window.addEventListener("beforeunload", () => {

    speechSynthesis.cancel();

});

// ================= SUPPORT CHECK =================

if (!navigator.mediaDevices) {

    console.warn("Camera is not supported on this browser.");

}

if (
    !("SpeechRecognition" in window) &&
    !("webkitSpeechRecognition" in window)
) {

    console.warn("Speech Recognition is not supported.");

}

// ================= KEEP CHAT SCROLLED TO BOTTOM =================

const observer = new MutationObserver(() => {

    requestAnimationFrame(() => {
        chatBox.scrollTop = chatBox.scrollHeight;
    });

});

observer.observe(chatBox, {
    childList: true,
    subtree: true
});

// ================= RESET SPEAKER BUTTON WHEN SPEECH ENDS =================

speechSynthesis.onvoiceschanged = () => {

    if (!speechSynthesis.speaking) {

        isSpeaking = false;

        speakBtn.innerHTML =
            '<i class="fa-solid fa-volume-high"></i>';
    }

};

// ================= ESC KEY STOPS SPEECH =================

document.addEventListener("keydown", (e) => {

    if (e.key === "Escape" && speechSynthesis.speaking) {

        speechSynthesis.cancel();

        isSpeaking = false;

        speakBtn.innerHTML =
            '<i class="fa-solid fa-volume-high"></i>';

    }

});
