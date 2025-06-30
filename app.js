// ===========================
// Configuración de Canvas y Estado Global
// ===========================
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const beepSound = new Audio('resources/sounds/beep.mp3');
const choqueSound = new Audio('resources/sounds/ouch.mp3');
const eatSound = new Audio('resources/sounds/eat.mp3');
const bgMusic = new Audio('resources/sounds/song.mp3');
const gameoverSound = new Audio('resources/sounds/gameover.wav');
bgMusic.loop = true;
bgMusic.volume = 0.2;

let score = 0;
let lastScoreUpdate = 0;
let objetosQueDan = 0;
let objetosQueQuitan = 0;
let gameState = 'start';
let pulseTime = 0;
let seleccionando = false;
let selectedIndex = 0;
let maxVida = 100;
let vida = maxVida;
let dañoRecibidoTime = 0;
let comerTiempo = 0;
let dificultadEscalon = 500;
let gameOverTimestamp = 0;
let tiempoUltimoObjeto = 0;
let intervaloObjetos = 600;
const efectoDuracion = 500;

// ===========================
// Personajes
// ===========================
const personajes = [
    { nombre: "Javito", imgSrc: "resources/javito.png" },
    { nombre: "Govito", imgSrc: "resources/govito.png" },
    { nombre: "Javito Estresado", imgSrc: "resources/javito-estresado.png" },
    { nombre: "Javito Limpito", imgSrc: "resources/cleanito.png" },
];

const personajesImgs = personajes.map(p => {
    const img = new Image();
    img.src = p.imgSrc;
    return img;
});

// ===========================
// Jugador
// ===========================
const playerImage = new Image();
playerImage.src = personajes[0].imgSrc;

const player = {
    x: 0,
    y: 0,
    width: 90,
    height: 80,
    speed: 8,
    movingUp: false,
    movingDown: false,
    movingLeft: false,
    movingRight: false,
    isMoving: false
};

function centrarPlayer() {
    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height / 2 - player.height / 2;
}

function updatePlayer() {
    player.isMoving = false;
    if (player.movingUp && player.y > 0) player.y -= player.speed, player.isMoving = true;
    if (player.movingDown && player.y + player.height < canvas.height) player.y += player.speed, player.isMoving = true;
    if (player.movingLeft && player.x > 0) player.x -= player.speed, player.isMoving = true;
    if (player.movingRight && player.x + player.width < canvas.width) player.x += player.speed, player.isMoving = true;
}

function drawPlayer() {
    const now = performance.now();

    if (now - dañoRecibidoTime < efectoDuracion) {
        if (Math.floor(now / 100) % 2 === 0) return; // parpadeo: desaparece intermitente
        ctx.globalAlpha = 0.8;
        ctx.filter = 'brightness(150%)';
        ctx.drawImage(playerImage, player.x, player.y, player.width, player.height);
        ctx.filter = 'none';
        ctx.globalAlpha = 1.0;
        return;
    }

    if (now - comerTiempo < efectoDuracion) {
        ctx.shadowColor = '#00ffe0';
        ctx.shadowBlur = 20;
    }

    ctx.drawImage(playerImage, player.x, player.y, player.width, player.height);
    ctx.shadowBlur = 0; // limpiar después
}

// ===========================
// Score y Vida
// ===========================
function updateScore() {
    const now = performance.now();
    if (now - lastScoreUpdate >= 100) {
        score++;
        lastScoreUpdate = now;
    }

    if (score >= dificultadEscalon) {
        intervaloObjetos = Math.max(intervaloObjetos - 50, 50);
        dificultadEscalon += 500;
    }
}
function drawScore() {
    ctx.font = '32px "Comic Sans MS", cursive';
    ctx.textAlign = 'right';
    ctx.strokeStyle = 'navy';
    ctx.lineWidth = 5;
    ctx.strokeText(`Puntaje: ${score}`, canvas.width - 20, 40);
    ctx.fillStyle = "#05F0A5";
    ctx.shadowColor = "#460073";
    ctx.shadowBlur = 4;
    ctx.fillText(`Puntaje: ${score}`, canvas.width - 20, 40);
    ctx.shadowBlur = 0;
}

function drawVida() {
    const x = 20, y = 20, ancho = 200, alto = 25;
    ctx.fillStyle = '#333';
    ctx.fillRect(x, y, ancho, alto);

    const porcentaje = vida / maxVida;
    const barraAncho = ancho * porcentaje;
    const color = porcentaje > 0.5 ? '#00e676' : porcentaje > 0.25 ? '#ffeb3b' : '#f44336';

    ctx.fillStyle = color;
    ctx.fillRect(x, y, barraAncho, alto);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, ancho, alto);
}

// ===========================
// Obstáculos y Colisiones
// ===========================
const objetos = [
    // Objetos que quitan vida
    { nombre: "pez bug", imgSrc: "resources/obstaculos/pez-bug.png", vida: -20 },
    { nombre: "medusa usb", imgSrc: "resources/obstaculos/medusa-usb.png", vida: -20 },
    { nombre: "ancla", imgSrc: "resources/obstaculos/ancla.png", vida: -20 },
    { nombre: "chancla", imgSrc: "resources/obstaculos/chancla.png", vida: -20 },
    // Objetos que suman vida
    { nombre: "java", imgSrc: "resources/obstaculos/java.png", vida: +5 },
    { nombre: "calamar springboot", imgSrc: "resources/obstaculos/calamar-springboot.png", vida: +5 }
];


const objetosActivos = [];

function crearObjeto() {
    const base = objetos[Math.floor(Math.random() * objetos.length)];
    const img = new Image();
    img.src = base.imgSrc;

    return {
        nombre: base.nombre,
        img: img,
        vida: base.vida,
        x: canvas.width + 50,
        y: Math.random() * (canvas.height - 80),
        width: 60,
        height: 60,
        speed: 5
    };
}

function hayColision(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

// ===========================
// Burbujas y Corriente
// ===========================
let bubbles = [];
const totalBurbujas = 50;
for (let i = 0; i < totalBurbujas; i++) bubbles.push(crearBurbuja());

function crearBurbuja() {
    return {
        x: canvas.width + Math.random() * 100,
        y: Math.random() * canvas.height,
        radius: Math.random() * 5 + 2,
        speed: Math.random() * 30 + 0.5,
        alpha: Math.random() * 0.5 + 0.3
    };
}

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

// ===========================
// UI: Pantallas y Selección
// ===========================
function drawStartMessage() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Título principal
    const title = "Out Of Connection";
    const subtitle = "Javito";

    ctx.font = '24px "VT323", monospace';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#460073';
    ctx.shadowBlur = 8;
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#A100FF';
    ctx.strokeText(title, canvas.width / 2, 120);
    ctx.fillStyle = '#a3fadb';
    ctx.fillText(title, canvas.width / 2, 120);

    ctx.font = 'bold 50px "Comic Sans MS", cursive';
    ctx.strokeStyle = '#E6DCFF';
    ctx.lineWidth = 5;
    ctx.strokeText(subtitle, canvas.width / 2, 180);
    ctx.fillStyle = '#05F0A5';
    ctx.fillText(subtitle, canvas.width / 2, 180);

    ctx.shadowBlur = 0;

    // Mensaje de empezar
    ctx.font = '36px "Comic Sans MS", cursive';
    ctx.fillStyle = "#05F0A5";
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#460073';
    ctx.strokeText('Presiona cualquier tecla para empezar', canvas.width / 2, canvas.height / 2 + 50);
    ctx.fillText('Presiona cualquier tecla para empezar', canvas.width / 2, canvas.height / 2 + 50);
}

function drawSelectPlayerMessage() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawCorriente();
    bubbles.forEach(b => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${b.alpha})`;
        ctx.fill();
    });

    // Texto principal
    ctx.font = '32px "Comic Sans MS"';
    ctx.textAlign = 'center';
    ctx.strokeStyle = 'navy';
    ctx.fillStyle = "#05F0A5";
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 4;
    ctx.strokeText('Selecciona un Javito para empezar', canvas.width / 2, 40);
    ctx.fillText('Selecciona un Javito para empezar', canvas.width / 2, 40);
    ctx.shadowBlur = 0;

    const objetosQueQuitan = [
        { src: "resources/obstaculos/pez-bug.png", nombre: "Pez Bug", signo: "−", img: null },
        { src: "resources/obstaculos/medusa-usb.png", nombre: "Medusa USB", signo: "−", img: null },
        { src: "resources/obstaculos/ancla.png", nombre: "Ancla", signo: "−", img: null },
        { src: "resources/obstaculos/chancla.png", nombre: "Chancla", signo: "−", img: null },
    ];
    const objetosQueDan = [
        { src: "resources/obstaculos/calamar-springboot.png", nombre: "Calamar SpringBoot", signo: "+", img: null },
        { src: "resources/obstaculos/java.png", nombre: "Taza de Java", signo: "+", img: null },
    ];

    function precargarImagenes(arr) {
        arr.forEach(obj => {
            obj.img = new Image();
            obj.img.src = obj.src;
        });
    }

    precargarImagenes(objetosQueQuitan);
    precargarImagenes(objetosQueDan);


    const listaX1 = 120; // Izquierda
    const listaX2 = canvas.width - 400; // Derecha
    const itemYStart = 100;
    const itemSpacing = 45;
    const iconSize = 42;

    // Fondo negro con bordes redondeados
    const boxY = itemYStart - 40;
    const objetosActivosHeight = 4 * itemSpacing + 80;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.beginPath();
    ctx.roundRect(60, boxY, canvas.width - 120, objetosActivosHeight, 15);
    ctx.fill();

    // Títulos
    ctx.font = '20px Comic Sans MS';
    ctx.fillStyle = '#ffffff';
    ctx.fillText("Objetos que quitan vida", listaX1 + 80, itemYStart - 10);
    ctx.fillText("Objetos que dan vida", listaX2 + 80, itemYStart - 10);

    function dibujarListaVertical(arr, xBase) {
        arr.forEach((obj, i) => {
            const y = itemYStart + i * itemSpacing;
            if (obj.img && obj.img.complete) {
                ctx.drawImage(obj.img, xBase, y, iconSize, iconSize);
            }
            ctx.fillStyle = obj.signo === "+" ? "#00e676" : "#f44336";
            ctx.font = '20px Comic Sans MS';
            ctx.textAlign = 'left'
            ctx.fillText(`${obj.signo} ${obj.nombre}`, xBase + iconSize + 10, y + 24);
        });
    }


    dibujarListaVertical(objetosQueQuitan, listaX1);
    dibujarListaVertical(objetosQueDan, listaX2);

    // Dibujar personajes debajo
    const boxWidth = 100, boxHeight = 100, spacing = 40;
    const totalWidth = personajes.length * (boxWidth + spacing) - spacing;
    const startX = canvas.width / 2 - totalWidth / 2;
    const personajeY = objetosActivosHeight + 120;

    pulseTime += 0.05;
    const scale = 1 + Math.sin(pulseTime) * 0.05;

    personajesImgs.forEach((img, i) => {
        let x = startX + i * (boxWidth + spacing);
        let width = boxWidth, height = boxHeight;

        if (i === selectedIndex) {
            x -= (width * scale - width) / 2;
            width *= scale;
            height *= scale;
            ctx.strokeStyle = '#A100FF';
            ctx.lineWidth = 4;
            ctx.strokeRect(x - 5, personajeY - 5, width + 10, height + 10);
        }

        ctx.fillStyle = 'rgba(0, 51, 68, 0.6)';
        ctx.fillRect(x, personajeY, width, height);
        ctx.drawImage(img, x + 10, personajeY + 10, width - 20, height - 20);

        ctx.font = '14px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(personajes[i].nombre, x + width / 2, personajeY + height + 20);
    });
}

function drawGameOver() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawCorriente();

    ctx.font = 'bold 60px "Comic Sans MS", cursive';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f44336';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 10;
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 60);
    ctx.shadowBlur = 0;

    ctx.font = '32px "Comic Sans MS"';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 4;
    ctx.strokeText(`Puntaje final: ${score}`, canvas.width / 2, canvas.height / 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`Puntaje final: ${score}`, canvas.width / 2, canvas.height / 2);

    ctx.font = '24px "Comic Sans MS"';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3;
    ctx.strokeText('Presiona cualquier tecla para volver al menú', canvas.width / 2, canvas.height / 2 + 50);
    ctx.fillStyle = '#05F0A5';
    ctx.fillText('Presiona cualquier tecla para volver al menú', canvas.width / 2, canvas.height / 2 + 50);
}

function animateSelectScreen() {
    if (gameState === 'select') {
        drawSelectPlayerMessage();
        requestAnimationFrame(animateSelectScreen);
    }
}

// ===========================
// Loop Principal
// ===========================
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawCorriente();

    const now = performance.now();

    bubbles.forEach((b, i) => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${b.alpha})`;
        ctx.fill();
        b.x -= b.speed;
        if (b.x < -b.radius) bubbles[i] = crearBurbuja();
    });

    // Generar objetos con intervalo dinámico
    if (now - tiempoUltimoObjeto > intervaloObjetos) {
        objetosActivos.push(crearObjeto());
        tiempoUltimoObjeto = now;
    }

    updatePlayer();
    updateScore();
    drawPlayer();
    drawScore();
    drawVida();

    for (let i = objetosActivos.length - 1; i >= 0; i--) {
        const obj = objetosActivos[i];
        obj.x -= obj.speed;
        ctx.drawImage(obj.img, obj.x, obj.y, obj.width, obj.height);

        if (hayColision(player, obj)) {
            vida = Math.max(0, Math.min(maxVida, vida + obj.vida));
            if (obj.vida > 0) {
                objetosQueDan++;
                eatSound.play();
                comerTiempo = performance.now();
            } else {
                objetosQueQuitan++;
                choqueSound.play();
                dañoRecibidoTime = performance.now();
                if (vida <= 0) {
                    gameState = 'gameover';
                    bgMusic.pause();
                    gameoverSound.play();
                    gameOverTimestamp = performance.now();
                    drawGameOver();
                    return;
                }
            }
            objetosActivos.splice(i, 1);
        } else if (obj.x + obj.width < 0) {
            objetosActivos.splice(i, 1);
        }
    }

    requestAnimationFrame(animate);
}

// ===========================
// Controles
// ===========================
window.addEventListener('keydown', (e) => {
    if (gameState === 'start') {
        beepSound.play();
        gameState = 'select';
        if (!seleccionando) {
            seleccionando = true;
            animateSelectScreen();
        }
        return;
    }

    if (gameState === 'select') {
        if (e.code === 'ArrowLeft') selectedIndex = (selectedIndex - 1 + personajes.length) % personajes.length, beepSound.play();
        if (e.code === 'ArrowRight') selectedIndex = (selectedIndex + 1) % personajes.length, beepSound.play();
        if (e.code === 'Enter') {
            beepSound.play();
            playerImage.src = personajes[selectedIndex].imgSrc;
            centrarPlayer();
            gameState = 'playing';

            bgMusic.currentTime = 0;
            bgMusic.play();

            animate();
        }
    }

    if (gameState === 'playing') {
        if (e.code === "ArrowUp") player.movingUp = true;
        if (e.code === "ArrowDown") player.movingDown = true;
        if (e.code === "ArrowLeft") player.movingLeft = true;
        if (e.code === "ArrowRight") player.movingRight = true;
    }

    if (gameState === 'gameover') {
        const now = performance.now();
        if (now - gameOverTimestamp >= 1000) {
            gameState = 'select';
            vida = maxVida;
            dificultadEscalon = 500;
            score = 0;
            objetosActivos.length = 0;
            seleccionando = true;
            animateSelectScreen();
        }
        return;
    }


});

window.addEventListener("keyup", (e) => {
    if (e.code === "ArrowUp") player.movingUp = false;
    if (e.code === "ArrowDown") player.movingDown = false;
    if (e.code === "ArrowLeft") player.movingLeft = false;
    if (e.code === "ArrowRight") player.movingRight = false;
});

// ===========================
// Canvas Init
// ===========================
function resizeCanvas() {
    canvas.width = 800;
    canvas.height = 600;
}

resizeCanvas();
centrarPlayer();
drawStartMessage();
window.addEventListener('resize', resizeCanvas);