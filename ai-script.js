const chatBox = document.getElementById("chatBox");
const input = document.getElementById("prompt");

const sendBtn = document.getElementById("send");
const micBtn = document.getElementById("mic");
const speakBtn = document.getElementById("speak");
const cameraBtn = document.getElementById("camera");

const imageInput = document.getElementById("uploadImage");
const videoInput = document.getElementById("video");

let lastBotReply = "";

let recognition = null;
let listeningMessage = null;


if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    recognition = new SpeechRecognition();

    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
}



function addMessage(text, sender) {

    const message = document.createElement("div");
    message.className = sender;

    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.innerHTML = text;

    message.appendChild(bubble);

    chatBox.appendChild(message);

    chatBox.scrollTop = chatBox.scrollHeight;
}


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

    }

    catch (err) {

        console.error(err);

        addMessage(
            " Unable to connect to AI server.",
            "bot"
        );

    }

}



sendBtn.addEventListener("click", sendMessage);

input.addEventListener("keydown", (e) => {

    if (e.key === "Enter") {

        e.preventDefault();

        sendMessage();

    }

});



if (recognition) {

    micBtn.addEventListener("click", () => {

        recognition.start();

    });

    recognition.onstart = () => {

        listeningMessage = document.createElement("div");

        listeningMessage.className = "bot";

        listeningMessage.innerHTML = `
            <div class="bubble">
                 Swastya Guru is listening......
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

        const text = event.results[0][0].transcript;

        input.value = text;

        sendMessage();

    };

    recognition.onerror = (event) => {

        if (listeningMessage) {

            listeningMessage.remove();

            listeningMessage = null;

        }

        addMessage(
            " Microphone Error : " + event.error,
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

speakBtn.addEventListener("click", () => {

    if (!lastBotReply) {
        alert("No AI reply available.");
        return;
    }

    speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(lastBotReply);

    speech.lang = "en-US";
    speech.rate = 1;
    speech.pitch = 1;
    speech.volume = 1;

    speechSynthesis.speak(speech);

});




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

        addMessage(" Unable to access camera.", "bot");

    }

});


// ==============================
// IMAGE UPLOAD
// ==============================

imageInput.addEventListener("change", async () => {

    if (imageInput.files.length === 0) return;

    const file = imageInput.files[0];

    addMessage("Selected Image: " + file.name, "user");

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


// ==============================
// VIDEO
// ==============================

videoInput.addEventListener("change", () => {

    if (videoInput.files.length === 0) return;

    addMessage(
        " Selected Video: " + videoInput.files[0].name,
        "user"
    );

});


// ==============================
// NEW CHAT
// ==============================

const newChatBtn = document.getElementById("newChat");

if (newChatBtn) {

    newChatBtn.addEventListener("click", async () => {

        try {

            await fetch(
                "https://swastya-guru.onrender.com/new-chat",
                {
                    method: "POST"
                }
            );

            chatBox.innerHTML = "";

            lastBotReply = "";

            addMessage(
                "<strong> Hello!</strong><br><br>I am Swastya Guru AI. Ask me any health-related question.",
                "bot"
            );

        } catch (err) {

            console.error(err);

            addMessage(" Unable to start a new chat.", "bot");

        }

    });

}


// ==============================
// HEADER SPEAKER
// ==============================

const headerSpeak = document.getElementById("headerSpeak");

if (headerSpeak) {

    headerSpeak.addEventListener("click", () => {

        if (!lastBotReply) return;

        speechSynthesis.cancel();

        const speech = new SpeechSynthesisUtterance(lastBotReply);

        speech.lang = "en-US";

        speechSynthesis.speak(speech);

    });

}


// ==============================
// PAGE LOAD
// ==============================

window.addEventListener("load", () => {

    input.focus();

});


// ==============================
// BEFORE CLOSE
// ==============================

window.addEventListener("beforeunload", () => {

    speechSynthesis.cancel();

});


// ==============================
// SUPPORT CHECK
// ==============================

if (!navigator.mediaDevices) {

    console.warn("Camera not supported.");

}

if (!("SpeechRecognition" in window) &&
    !("webkitSpeechRecognition" in window)) {

    console.warn("Speech Recognition not supported.");

}