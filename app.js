const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

let player;
// Burbujas (horizontal)
let bubbles = [];
const totalBurbujas = 50;

function crearBurbuja() {
    return {
        x: canvas.width + Math.random() * 100,
        y: Math.random() * canvas.height,
        radius: Math.random() * 5 + 2,
        speed: Math.random() * 30 + 0.5,
        alpha: Math.random() * 5 + 0.3
    };
}

for (let i = 0; i < totalBurbujas; i++) {
    bubbles.push(crearBurbuja());
}

// Corriente marina (líneas móviles)
let waveOffset = 0;
const waveLines = 6;

function drawCorriente() {
    waveOffset += 2;

    for (let j = 0; j < waveLines; j++) {
        const y = (canvas.height / waveLines) * j + 20;

        ctx.beginPath();
        for (let x = canvas.width; x >= 0; x -= 20) {
            const offset = Math.sin((x + waveOffset + j * 50) * 0.01) * 10;
            ctx.lineTo(x, y + offset);
        }

        ctx.strokeStyle = `rgba(0, 150, 255, 0.1)`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }
}

function createPlayer() {
    return {
        x: canvas.width / 2,
        y: canvas.height / 2,
        radius: 10,
        speed: 5
    };

}

// Animación
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawCorriente();

    bubbles.forEach((b, i) => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${b.alpha})`;
        ctx.fill();
        b.x -= b.speed;

        if (b.x < -b.radius) {
            bubbles[i] = crearBurbuja(); // Respawn desde la derecha
        }
    });

    requestAnimationFrame(animate);
}

animate();
