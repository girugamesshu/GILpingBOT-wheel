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
    
    // Auto-scale font size based on segment count
    let baseFontSize;
    if (numSegments <= 3) baseFontSize = 20;
    else if (numSegments <= 5) baseFontSize = 17;
    else if (numSegments <= 8) baseFontSize = 14;
    else if (numSegments <= 12) baseFontSize = 11;
    else baseFontSize = 9;
    
    // Find the longest option text and shrink further if needed
    const maxTextLen = Math.max(...options.map(o => o.length));
    if (maxTextLen > 12) baseFontSize = Math.min(baseFontSize, baseFontSize * (12 / maxTextLen));
    baseFontSize = Math.max(baseFontSize, 7); // minimum readable size
    
    for (let i = 0; i < numSegments; i++) {
        const angle = i * arcSize;
        const color = colors[i % colors.length];
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, angle, angle + arcSize, false);
        ctx.lineTo(centerX, centerY);
        ctx.fillStyle = color;
        ctx.fill();
        
        // Segment borders
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#050510";
        ctx.stroke();

        // Draw text
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angle + arcSize / 2);
        ctx.textAlign = "right";
        ctx.fillStyle = "#ffffff";
        ctx.font = `bold ${Math.round(baseFontSize)}px 'Orbitron', sans-serif`;
        ctx.shadowColor = "#000";
        ctx.shadowBlur = 4;
        
        // Truncate text if too long for segment
        let text = options[i];
        const maxWidth = radius - 35;
        if (ctx.measureText(text).width > maxWidth && text.length > 3) {
            while (ctx.measureText(text + "…").width > maxWidth && text.length > 1) {
                text = text.slice(0, -1);
            }
            text += "…";
        }
        ctx.fillText(text, radius - 20, Math.round(baseFontSize / 3), maxWidth);
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
    
    // The pointer is at the top (12 o'clock = -PI/2 in canvas coordinates)
    // Canvas draws segment 0 starting from 3 o'clock (angle=0)
    // We need the CENTER of the winning segment to align with the pointer
    
    // Center angle of the target segment (in canvas space)
    const segmentCenter = targetIndex * arcSize + arcSize / 2;
    
    // Random offset within the segment to avoid landing on edges
    // Stay within 70% of the segment center (±35% from middle)
    const offsetRange = arcSize * 0.35;
    const randomOffset = (Math.random() * 2 - 1) * offsetRange;
    
    // The pointer is at top = -PI/2, but CSS rotation goes clockwise
    // We need to rotate so that segmentCenter + randomOffset ends up at -PI/2 (top)
    // rotation = -(segmentCenter + randomOffset) - PI/2  (to bring it to top)
    const baseRotation = -(segmentCenter + randomOffset) - Math.PI / 2;
    
    // Add many full rotations for dramatic effect (8-12 spins)
    const spins = (8 + Math.floor(Math.random() * 5)) * 2 * Math.PI;
    const finalRotation = spins + baseRotation;
    
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
