// Game variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');
const finalScoreElement = document.getElementById('finalScore');
const gameOverScreen = document.getElementById('gameOver');
const startScreen = document.getElementById('startScreen');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');

// Game state
let gameRunning = false;
let score = 0;
let lives = 3;
let player = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 60,
    width: 50,
    height: 40,
    speed: 7,
    color: '#00ff00'
};

// Game objects
let bullets = [];
let enemies = [];
let enemyBullets = [];
let particles = [];
let keys = {};
let enemyDirection = 1;
let enemyMoveTimer = 0;
let enemyMoveInterval = 30;
let lastTime = 0;

// Initialize enemies
function initEnemies() {
    enemies = [];
    const rows = 5;
    const cols = 10;
    const enemyWidth = 40;
    const enemyHeight = 30;
    const padding = 15;
    const offsetX = (canvas.width - (cols * (enemyWidth + padding))) / 2;
    const offsetY = 50;
    
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            enemies.push({
                x: offsetX + col * (enemyWidth + padding),
                y: offsetY + row * (enemyHeight + padding),
                width: enemyWidth,
                height: enemyHeight,
                alive: true,
                color: row === 0 ? '#ff0000' : row < 3 ? '#ffff00' : '#00ffff'
            });
        }
    }
}

// Create explosion particles
function createExplosion(x, y, color) {
    for (let i = 0; i < 15; i++) {
        particles.push({
            x: x,
            y: y,
            size: Math.random() * 4 + 2,
            speedX: Math.random() * 6 - 3,
            speedY: Math.random() * 6 - 3,
            color: color,
            life: 30
        });
    }
}

// Player ship drawing
function drawPlayer() {
    ctx.fillStyle = player.color;
    
    // Draw ship body
    ctx.beginPath();
    ctx.moveTo(player.x, player.y + player.height);
    ctx.lineTo(player.x + player.width / 2, player.y);
    ctx.lineTo(player.x + player.width, player.y + player.height);
    ctx.closePath();
    ctx.fill();
    
    // Draw ship details
    ctx.fillStyle = '#008800';
    ctx.fillRect(player.x + 10, player.y + player.height - 10, player.width - 20, 10);
}

// Draw bullets
function drawBullets() {
    bullets.forEach(bullet => {
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        
        // Add glow effect
        ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
        ctx.fillRect(bullet.x - 2, bullet.y - 2, bullet.width + 4, bullet.height + 4);
    });
    
    enemyBullets.forEach(bullet => {
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        
        // Add glow effect
        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.fillRect(bullet.x - 2, bullet.y - 2, bullet.width + 4, bullet.height + 4);
    });
}

// Draw enemies
function drawEnemies() {
    enemies.forEach(enemy => {
        if (enemy.alive) {
            ctx.fillStyle = enemy.color;
            
            // Draw enemy body
            ctx.beginPath();
            ctx.moveTo(enemy.x, enemy.y);
            ctx.lineTo(enemy.x + enemy.width, enemy.y);
            ctx.lineTo(enemy.x + enemy.width - 10, enemy.y + enemy.height);
            ctx.lineTo(enemy.x + 10, enemy.y + enemy.height);
            ctx.closePath();
            ctx.fill();
            
            // Draw enemy details
            ctx.fillStyle = '#000';
            ctx.fillRect(enemy.x + 10, enemy.y + 10, 8, 8);
            ctx.fillRect(enemy.x + enemy.width - 18, enemy.y + 10, 8, 8);
        }
    });
}

// Draw particles
function drawParticles() {
    particles.forEach((particle, index) => {
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.life / 30;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        
        // Update particle
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        particle.life--;
        
        // Remove dead particles
        if (particle.life <= 0) {
            particles.splice(index, 1);
        }
    });
}

// Update game logic
function update() {
    if (!gameRunning) return;
    
    // Move player
    if (keys['ArrowLeft'] && player.x > 0) {
        player.x -= player.speed;
    }
    if (keys['ArrowRight'] && player.x < canvas.width - player.width) {
        player.x += player.speed;
    }
    
    // Move bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].y -= 10;
        
        // Remove bullets that go off screen
        if (bullets[i].y < 0) {
            bullets.splice(i, 1);
            continue;
        }
        
        // Check bullet collision with enemies
        for (let j = 0; j < enemies.length; j++) {
            if (enemies[j].alive) {
                if (bullets[i] && 
                    bullets[i].x < enemies[j].x + enemies[j].width &&
                    bullets[i].x + bullets[i].width > enemies[j].x &&
                    bullets[i].y < enemies[j].y + enemies[j].height &&
                    bullets[i].y + bullets[i].height > enemies[j].y) {
                    
                    // Create explosion effect
                    createExplosion(enemies[j].x + enemies[j].width/2, enemies[j].y + enemies[j].height/2, enemies[j].color);
                    
                    // Remove enemy and bullet
                    enemies[j].alive = false;
                    bullets.splice(i, 1);
                    
                    // Update score
                    score += 100;
                    scoreElement.textContent = score;
                    break;
                }
            }
        }
    }
    
    // Move enemy bullets
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        enemyBullets[i].y += 5;
        
        // Remove bullets that go off screen
        if (enemyBullets[i].y > canvas.height) {
            enemyBullets.splice(i, 1);
            continue;
        }
        
        // Check bullet collision with player
        if (enemyBullets[i] && 
            enemyBullets[i].x < player.x + player.width &&
            enemyBullets[i].x + enemyBullets[i].width > player.x &&
            enemyBullets[i].y < player.y + player.height &&
            enemyBullets[i].y + enemyBullets[i].height > player.y) {
            
            // Create explosion effect
            createExplosion(player.x + player.width/2, player.y + player.height/2, '#00ff00');
            
            // Remove bullet and player
            enemyBullets.splice(i, 1);
            lives--;
            livesElement.textContent = lives;
            
            // Check game over
            if (lives <= 0) {
                gameOver();
            }
            break;
        }
    }
    
    // Move enemies
    enemyMoveTimer++;
    if (enemyMoveTimer >= enemyMoveInterval) {
        enemyMoveTimer = 0;
        
        let moveDown = false;
        
        // Check if enemies need to change direction
        for (let i = 0; i < enemies.length; i++) {
            if (enemies[i].alive) {
                if ((enemyDirection === 1 && enemies[i].x + enemies[i].width > canvas.width - 10) ||
                    (enemyDirection === -1 && enemies[i].x < 10)) {
                    moveDown = true;
                    break;
                }
            }
        }
        
        if (moveDown) {
            enemyDirection *= -1;
            for (let i = 0; i < enemies.length; i++) {
                if (enemies[i].alive) {
                    enemies[i].y += 20;
                    
                    // Check if enemies reached the bottom
                    if (enemies[i].y + enemies[i].height > player.y) {
                        gameOver();
                    }
                }
            }
        } else {
            for (let i = 0; i < enemies.length; i++) {
                if (enemies[i].alive) {
                    enemies[i].x += 5 * enemyDirection;
                }
            }
        }
        
        // Random enemy shooting
        if (Math.random() < 0.02) {
            const aliveEnemies = enemies.filter(enemy => enemy.alive);
            if (aliveEnemies.length > 0) {
                const shooter = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
                enemyBullets.push({
                    x: shooter.x + shooter.width / 2 - 2,
                    y: shooter.y + shooter.height,
                    width: 4,
                    height: 10
                });
            }
        }
    }
    
    // Check win condition
    const aliveEnemies = enemies.filter(enemy => enemy.alive);
    if (aliveEnemies.length === 0) {
        // Level complete - spawn new enemies
        initEnemies();
        score += 1000; // Bonus for completing level
        scoreElement.textContent = score;
    }
    
    // Update particles
    drawParticles();
}

// Draw everything
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw stars
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 100; i++) {
        const x = (i * 13) % canvas.width;
        const y = (i * 7) % canvas.height;
        ctx.fillRect(x, y, 1, 1);
    }
    
    // Draw game objects
    drawPlayer();
    drawBullets();
    drawEnemies();
    drawParticles();
}

// Game loop
function gameLoop(timestamp) {
    if (!gameRunning) return;
    
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    
    update();
    draw();
    
    requestAnimationFrame(gameLoop);
}

// Start game
function startGame() {
    gameRunning = true;
    score = 0;
    lives = 3;
    scoreElement.textContent = score;
    livesElement.textContent = lives;
    
    player.x = canvas.width / 2 - 25;
    
    bullets = [];
    enemyBullets = [];
    particles = [];
    
    initEnemies();
    
    startScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

// Game over
function gameOver() {
    gameRunning = false;
    finalScoreElement.textContent = `Your Score: ${score}`;
    gameOverScreen.style.display = 'flex';
}

// Event listeners
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    
    // Fire laser when spacebar is pressed
    if (e.key === ' ' && gameRunning) {
        e.preventDefault();
        bullets.push({
            x: player.x + player.width / 2 - 2,
            y: player.y,
            width: 4,
            height: 10
        });
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);

// Initialize game
initEnemies();