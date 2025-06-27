const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

/* Game parameters */
let gameStarted = false;
let score = 0;
let lastScoreUpdate = 0;
/*Player---------------------------------------------------------*/
// Player image
const playerImage = new Image();
playerImage.src = 'resources/javito.png';

// Player object
const player = {
    x: 0,
    y: 0,
    width: 160,
    height: 110,
    speed: 8,
    movingUp: false,
    movingDown: false,
    isMoving: false
};

window.addEventListener('keydown', function iniciarJuego() {
    if (!gameStarted) {
        gameStarted = true;
        window.removeEventListener('keydown', iniciarJuego);
        animate(); // arranca la animación
    }
});

// Player center on canvas
function centrarPlayer() {
    player.x = canvas.width / 2 - player.width / 2; //or 230
    player.y = canvas.height / 2 - player.height / 2;
}

// Update vertical movement
function updatePlayer() {
    if (player.movingUp && player.y > 0) {
        player.y -= player.speed;
        player.isMoving = true;
    }
    if (player.movingDown && player.y + player.height < canvas.height) {
        player.y += player.speed;
        player.isMoving = true;
    }
}

function updateScore() {
    const now = performance.now();
    if (player.isMoving && now - lastScoreUpdate >= 250) { // 250ms = 1/4 de segundo
        score += 1;
        lastScoreUpdate = now;
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

/* Draw Game Score and Game Start --------------------------------------------------- */
function drawScore() {
    ctx.font = '32px "Comic Sans MS", cursive, sans-serif';
    ctx.textAlign = 'right';

    ctx.lineWidth = 5;
    ctx.strokeStyle = 'navy';
    ctx.strokeText(`Puntaje: ${score}`, canvas.width - 20, 40);

    // fill
    ctx.fillStyle = "#05F0A5";
    ctx.shadowColor = "#460073​";
    ctx.shadowBlur = 4;
    ctx.fillText(`Puntaje: ${score}`, canvas.width - 20, 40);

    // clean shadow
    ctx.shadowBlur = 0;
}

function drawStartMessage() {
    const text = 'Presiona cualquier tecla para empezar';

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.font = '36px "Comic Sans MS", cursive';
    ctx.fillStyle = "#05F0A5";
    ctx.shadowBlur = 4;
    ctx.lineWidth = 5;
    ctx.textAlign = 'center';

    ctx.strokeText(text, canvas.width / 2, canvas.height / 2);
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
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
    updateScore();
    drawPlayer();
    drawScore();
    requestAnimationFrame(animate);
}

/*Canvas resize-------------------------------------------------*/

function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
}
/*---------------------------------------------------------------*/

resizeCanvas();
centrarPlayer();
drawStartMessage();
window.addEventListener('resize', resizeCanvas);