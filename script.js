// Initialize Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();

// DOM Elements
const canvas = document.getElementById("wheelCanvas");
const ctx = canvas.getContext("2d");
const resultModal = document.getElementById("resultModal");
const resultText = document.getElementById("resultText");
const titleText = document.getElementById("title");

// Get params
const urlParams = new URLSearchParams(window.location.search);
const presetName = urlParams.get("name") || "Случайная рулетка";
let rawOptions = urlParams.get("options");
let winner = urlParams.get("winner") || "";

titleText.innerText = presetName;
titleText.setAttribute("data-text", presetName);

let options = rawOptions ? rawOptions.split(",") : ["Да", "Нет"];
if (options.length === 0) options = ["Пусто"];

const numSegments = options.length;
const arcSize = (2 * Math.PI) / numSegments;
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;
const radius = canvas.width / 2;

// Cyberpunk Color Palette
const colors = ["#ff0055", "#00f0ff", "#8a2be2", "#ff00ff", "#00ff88"];

function drawWheel() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    for (let i = 0; i < numSegments; i++) {
        const angle = i * arcSize;
        const color = colors[i % colors.length];
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, angle, angle + arcSize, false);
        ctx.lineTo(centerX, centerY);
        ctx.fillStyle = color;
        ctx.fill();
        
        // Add neon glow to segment borders
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#050510";
        ctx.stroke();

        // Draw text
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angle + arcSize / 2);
        ctx.textAlign = "right";
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 18px 'Orbitron', sans-serif";
        ctx.shadowColor = "#000";
        ctx.shadowBlur = 5;
        // Max width for text
        ctx.fillText(options[i], radius - 20, 6, radius - 40);
        ctx.restore();
    }
}

function spinWheel() {
    // Determine winner index
    let targetIndex = options.indexOf(winner);
    if (targetIndex === -1) {
        targetIndex = Math.floor(Math.random() * numSegments);
        winner = options[targetIndex];
    }
    
    // Calculate rotation to make winner land at the top (pointer is at top = -PI/2)
    const targetAngle = targetIndex * arcSize + (arcSize / 2);
    const topAngle = Math.PI / 2; 
    
    // Add multiple full rotations (e.g. 10 spins)
    const spins = 10 * 2 * Math.PI;
    const finalRotation = spins + (topAngle - targetAngle);
    
    // Apply CSS transform
    canvas.style.transform = `rotate(${finalRotation}rad)`;
    
    // Wait for animation to finish (6s defined in CSS)
    setTimeout(() => {
        showWinner();
    }, 6200);
}

function showWinner() {
    resultText.innerText = winner;
    resultText.setAttribute("data-text", winner);
    resultModal.classList.remove("hidden");
    
    // Optional: Send data back if supported (usually not via inline URL, but keeping for compatibility)
    try {
        tg.HapticFeedback.notificationOccurred("success");
    } catch(e) {}
}

// Draw initial wheel and auto-spin on load
window.onload = () => {
    drawWheel();
    // Small delay to ensure rendering and smooth animation start
    setTimeout(() => {
        spinWheel();
    }, 500);
};
