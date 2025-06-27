const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

/* Game parameters */
let score = 0;

/*Player---------------------------------------------------------*/
// Player image
const playerImage = new Image();
playerImage.src = 'resources/javito.png';

// Player object
const player = {
    x: 0,
    y: 0,
    width: 180,
    height: 140,
    speed: 8,
    movingUp: false,
    movingDown: false
};

// Player center on canvas
function centrarPlayer() {
    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height / 2 - player.height / 2;
}

// Update vertical movement
function updatePlayer() {
    if (player.movingUp && player.y > 0) {
        player.y -= player.speed;
    }
    if (player.movingDown && player.y + player.height < canvas.height) {
        player.y += player.speed;
    }
}

// Player draw
function drawPlayer() {
    ctx.drawImage(playerImage, player.x, player.y, player.width, player.height);
}

window.addEventListener("keydown", (e) => {
    if (e.code === "ArrowUp") {
        player.movingUp = true;
    }
    if (e.code === "ArrowDown") {
        player.movingDown = true;
    }
});

window.addEventListener("keyup", (e) => {
    if (e.code === "ArrowUp") {
        player.movingUp = false;
    }
    if (e.code === "ArrowDown") {
        player.movingDown = false;
    }
});

/* Draw Score --------------------------------------------------- */
function drawScore() {
    ctx.font = '32px "Comic Sans MS", cursive, sans-serif';
    ctx.textAlign = 'right';

    ctx.lineWidth = 2;
    ctx.strokeStyle = 'navy';
    ctx.strokeText(`Puntaje: ${score}`, canvas.width - 20, 40);

    // fill
    ctx.fillStyle = 'rgba(0, 200, 255, 0.9)';
    ctx.shadowColor = 'rgba(0, 100, 255, 0.8)';
    ctx.shadowBlur = 4;
    ctx.fillText(`Puntaje: ${score}`, canvas.width - 20, 40);

    // clean shadow
    ctx.shadowBlur = 0;
}


/* -------------------------------------------------------------- */

/* Bubbles ------------------------------------------------------ */
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

/* Sea waves movement -----------------------------------*/
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

/** ------------------------------------------------*/

// Animation
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
            bubbles[i] = crearBurbuja();
        }
    });

    updatePlayer();
    drawPlayer();
    drawScore();
    requestAnimationFrame(animate);
}

animate();

/*Canvas resize-------------------------------------------------*/

function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
}
resizeCanvas();
centrarPlayer();
window.addEventListener('resize', resizeCanvas);

/*---------------------------------------------------------------*/
