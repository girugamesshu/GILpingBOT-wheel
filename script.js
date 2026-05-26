// Init Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();

// Color palette for the wheel slices
const colors = [
    '#ef4444', '#f97316', '#f59e0b', '#84cc16', 
    '#10b981', '#06b6d4', '#3b82f6', '#6366f1', 
    '#8b5cf6', '#d946ef', '#f43f5e'
];

let options = ['Да', 'Нет'];
let presetName = 'Рулетка';
let predeterminedWinner = null;

// Parse options from URL (e.g. ?name=Games&options=Dota,CS,Valorant&winner=CS)
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has('options')) {
    const rawOptions = urlParams.get('options');
    // decoding if necessary
    options = decodeURIComponent(rawOptions).split(',').map(o => o.trim()).filter(o => o);
}
if (urlParams.has('name')) {
    presetName = decodeURIComponent(urlParams.get('name'));
    document.getElementById('title').innerText = presetName;
}
if (urlParams.has('winner')) {
    predeterminedWinner = decodeURIComponent(urlParams.get('winner')).trim();
}

const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
const spinBtn = document.getElementById('spinBtn');
const resultModal = document.getElementById('resultModal');
const resultText = document.getElementById('resultText');
const closeBtn = document.getElementById('closeBtn');

const arc = Math.PI * 2 / options.length;
let currentRotation = 0;

function drawWheel() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = centerX;

    for (let i = 0; i < options.length; i++) {
        const angle = i * arc;
        
        // Draw slice
        ctx.beginPath();
        ctx.fillStyle = colors[i % colors.length];
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, angle, angle + arc, false);
        ctx.lineTo(centerX, centerY);
        ctx.fill();
        
        // Slice border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw text
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angle + arc / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px Inter, sans-serif';
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 5;
        
        let text = options[i];
        if(text.length > 18) text = text.substring(0, 16) + '...';
        
        ctx.fillText(text, radius - 25, 7);
        ctx.restore();
    }
}

drawWheel();

let isSpinning = false;

spinBtn.addEventListener('click', () => {
    if (isSpinning) return;
    isSpinning = true;
    spinBtn.disabled = true;
    
    // Haptic feedback for mobile
    if(tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('heavy');
    }
    
    let targetIndex = -1;
    if (predeterminedWinner) {
        targetIndex = options.findIndex(o => o.toLowerCase() === predeterminedWinner.toLowerCase());
    }

    let spinTurns = 5 + Math.floor(Math.random() * 3); // 5 to 7 full rotations
    let finalAngle = 0;
    
    if (targetIndex !== -1) {
        // Calculate exact angle to land on targetIndex
        // Canvas rotate() rotates the element visually. 
        // We use transform: rotate(-Xrad) in CSS, which rotates counter-clockwise.
        // The pointer is at the top (which is 270 degrees or 1.5 * PI in Canvas coordinates).
        // Slice i spans from i*arc to (i+1)*arc.
        
        const sliceStart = targetIndex * arc;
        // Random position within the slice (avoid exact edges)
        const randomOffset = (Math.random() * 0.7 + 0.15) * arc; 
        const targetAngle = sliceStart + randomOffset;
        
        // The angle that needs to be at the top pointer (1.5 * PI)
        let R = targetAngle - (Math.PI * 1.5);
        if (R < 0) R += Math.PI * 2;
        
        finalAngle = R + spinTurns * Math.PI * 2;
    } else {
        // Fallback: Random local spin
        finalAngle = Math.random() * Math.PI * 2 + spinTurns * Math.PI * 2;
    }
    
    const totalRotation = currentRotation + finalAngle;
    canvas.style.transform = `rotate(-${totalRotation}rad)`;
    
    setTimeout(() => {
        currentRotation = totalRotation % (Math.PI * 2);
        
        let winnerIndex = targetIndex;
        if (winnerIndex === -1) {
            const pointerAngle = (Math.PI * 1.5 + totalRotation) % (Math.PI * 2);
            winnerIndex = Math.floor(pointerAngle / arc) % options.length;
        }
        
        const winner = options[winnerIndex];
        
        if(tg.HapticFeedback) {
            tg.HapticFeedback.notificationOccurred('success');
        }
        
        resultText.innerText = `🏆 Выпало:\n${winner}`;
        resultModal.classList.remove('hidden');
        
    }, 4500); // Wait for 4.5s CSS transition to finish
});

closeBtn.addEventListener('click', () => {
    // We can either reset or close the web app entirely
    // resultModal.classList.add('hidden');
    // isSpinning = false;
    // spinBtn.disabled = false;
    tg.close(); // Closes the mini app entirely
});
