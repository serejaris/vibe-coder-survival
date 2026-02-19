import { Player } from './Player';
import { Enemy } from './Enemy';
import type { EnemyType } from './Enemy';
import { Bullet } from './Bullet';
import { Particle } from './Particle';
import { XPOrb } from './XpOrb';
import { PerkManager } from './PerkManager';
import { InputManager } from './InputManager';
import { distance } from './utils';

export class Game {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    width: number = 0;
    height: number = 0;

    input: InputManager;
    player!: Player;
    enemies: Enemy[] = [];
    bullets: Bullet[] = [];
    particles: Particle[] = [];
    xpOrbs: XPOrb[] = [];
    perkManager: PerkManager;

    score: number = 0;
    gameOver: boolean = false;
    isPaused: boolean = false;

    lastTime: number = 0;
    enemySpawnTimer: number = 0;
    enemySpawnInterval: number = 1000;

    // Wave System
    gameTime: number = 0; // Total time in ms
    phase: number = 1;

    // XP & Level System
    level: number = 1;
    currentXP: number = 0;
    xpToNextLevel: number = 100;
    pickupRadius: number = 80;

    // UI Elements
    scoreValueEl: HTMLElement;
    healthBarEl: HTMLElement;
    xpBarEl: HTMLElement;
    levelValueEl: HTMLElement;

    gameOverScreenEl: HTMLElement;
    finalScoreEl: HTMLElement;
    restartBtnEl: HTMLElement;

    levelUpScreenEl: HTMLElement;
    startScreenEl: HTMLElement;
    nicknameInputEl: HTMLInputElement;
    startBtnEl: HTMLElement;

    leaderboardBodyEl: HTMLElement;
    leaderboardLoadingEl: HTMLElement;

    nickname: string = '';

    // Binding required for RAF
    boundGameLoop: (timeStamp: number) => void;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error("Could not get 2D context");
        this.ctx = ctx;

        this.input = new InputManager();
        this.perkManager = new PerkManager(this);
        (this as any).BulletTemplate = Bullet; // Used by PerkManager

        this.scoreValueEl = document.getElementById('scoreValue')!;
        this.healthBarEl = document.getElementById('healthBar')!;
        this.xpBarEl = document.getElementById('xpBar')!;
        this.levelValueEl = document.getElementById('levelValue')!;

        this.gameOverScreenEl = document.getElementById('gameOverScreen')!;
        this.finalScoreEl = document.getElementById('finalScore')!;
        this.restartBtnEl = document.getElementById('restartBtn')!;

        this.levelUpScreenEl = document.getElementById('levelUpScreen')!;
        this.startScreenEl = document.getElementById('startScreen')!;
        this.nicknameInputEl = document.getElementById('nicknameInput') as HTMLInputElement;
        this.startBtnEl = document.getElementById('startBtn')!;

        this.leaderboardBodyEl = document.getElementById('leaderboardBody')!;
        this.leaderboardLoadingEl = document.getElementById('leaderboardLoading')!;

        this.restartBtnEl.addEventListener('click', () => {
            this.reset();
        });

        this.startBtnEl.addEventListener('click', () => {
            const name = this.nicknameInputEl.value.trim();
            if (name.length > 0) {
                this.nickname = name;
                this.startScreenEl.classList.add('hidden');
                this.start();
            } else {
                alert('Please enter a handle.');
            }
        });

        this.resize(window.innerWidth, window.innerHeight);
        this.boundGameLoop = this.gameLoop.bind(this);
    }

    resize(width: number, height: number) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.width = width;
        this.height = height;
    }

    reset() {
        this.player = new Player(this, this.width / 2, this.height / 2);
        this.enemies = [];
        this.bullets = [];
        this.particles = [];
        this.xpOrbs = [];

        this.score = 0;
        this.gameOver = false;
        this.isPaused = false;

        this.enemySpawnInterval = 1000;
        this.enemySpawnTimer = 0;
        this.gameTime = 0;
        this.phase = 1;

        this.level = 1;
        this.currentXP = 0;
        this.xpToNextLevel = 100;
        this.pickupRadius = 80;

        this.lastTime = performance.now();

        this.updateUI();
        this.gameOverScreenEl.classList.add('hidden');

        requestAnimationFrame(this.boundGameLoop);
    }

    start() {
        this.reset();
    }

    updateUI() {
        this.scoreValueEl.innerText = Math.floor(this.score).toString();
        const healthPct = Math.max(0, (this.player.health / this.player.maxHealth) * 100);
        this.healthBarEl.style.width = `${healthPct}%`;

        const xpPct = Math.min(100, (this.currentXP / this.xpToNextLevel) * 100);
        this.xpBarEl.style.width = `${xpPct}%`;
        this.levelValueEl.innerText = this.level.toString();
    }

    spawnEnemy() {
        let x, y;
        if (Math.random() < 0.5) {
            x = Math.random() < 0.5 ? 0 - 30 : this.width + 30;
            y = Math.random() * this.height;
        } else {
            x = Math.random() * this.width;
            y = Math.random() < 0.5 ? 0 - 30 : this.height + 30;
        }

        let availableTypes: EnemyType[] = ['GPT-5.2'];
        if (this.phase >= 2) availableTypes.push('Claude 4.5 Opus');
        if (this.phase >= 3) availableTypes.push('Gemini 3 Pro');
        if (this.phase >= 4) availableTypes.push('Llama 4 Scout');

        const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];

        // Scale health and speed slightly with time
        const hpMod = 1 + (this.gameTime / 60000); // +100% per minute
        const speedMod = 1 + (this.gameTime / 120000);

        this.enemies.push(new Enemy(x, y, type, speedMod, hpMod));
    }

    createExplosion(x: number, y: number, color: string, count: number) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, color));
        }
    }

    gameLoop(timeStamp: number) {
        if (this.gameOver) return;

        const dt = timeStamp - this.lastTime;
        this.lastTime = timeStamp;

        if (!this.isPaused) {
            this.update(dt);
        }

        this.draw();

        requestAnimationFrame(this.boundGameLoop);
    }

    update(dt: number) {
        this.gameTime += dt;

        // Check for phase evolution (every 30 seconds)
        const newPhase = Math.floor(this.gameTime / 30000) + 1;
        if (newPhase > this.phase) {
            this.phase = newPhase;
            console.log(`Phase ${this.phase} started!`);
            // Optional: Show UI text for phase change
        }

        // Update components
        this.perkManager.update(dt);
        this.player.update(this.input, dt);

        // Update bullets
        this.bullets.forEach(bullet => bullet.update(this.width, this.height));

        // Update particles
        this.particles.forEach(particle => particle.update());

        // Update XP Orbs
        this.xpOrbs.forEach(orb => {
            orb.update(this.player.x, this.player.y, this.pickupRadius);

            // Collect XP
            const dist = distance(this.player.x, this.player.y, orb.x, orb.y);
            if (dist < this.player.radius + orb.radius) {
                orb.markedForDeletion = true;
                this.gainXP(orb.value);
            }
        });

        // Spawn enemies
        if (this.enemySpawnTimer > this.enemySpawnInterval) {
            this.spawnEnemy();
            this.enemySpawnTimer = 0;
            // Gradually decrease spawn interval depending on phase
            const minInterval = Math.max(200, 1000 - (this.phase * 150));
            if (this.enemySpawnInterval > minInterval) {
                this.enemySpawnInterval -= 15;
            }
        } else {
            this.enemySpawnTimer += dt;
        }

        // Update enemies & collisions
        this.enemies.forEach((enemy) => {
            enemy.update(this.player.x, this.player.y);

            // Check collision with player
            const distToPlayer = distance(this.player.x, this.player.y, enemy.x, enemy.y);
            if (distToPlayer - enemy.radius - this.player.radius < 1) {
                this.player.health -= 20;
                enemy.markedForDeletion = true;
                this.createExplosion(enemy.x, enemy.y, enemy.color, 20);
                this.updateUI();

                if (this.player.health <= 0) {
                    this.triggerGameOver();
                }
            }

            // Check collision with bullets
            this.bullets.forEach(bullet => {
                if (bullet.markedForDeletion) return;

                const distToBullet = distance(bullet.x, bullet.y, enemy.x, enemy.y);
                if (distToBullet - enemy.radius - bullet.radius < 1) {

                    // Zero-Shot Generation check
                    let isZeroShot = false;
                    if (this.perkManager.hasPerk('ZeroShotGeneration') && Math.random() < 0.05) {
                        isZeroShot = true;
                    }

                    // Deal damage
                    if (isZeroShot) {
                        enemy.currentHealth = 0;
                        this.createExplosion(enemy.x, enemy.y, '#ffffff', 30); // Special massive pop effect
                    } else {
                        enemy.currentHealth -= 10; // Base bullet damage
                    }

                    // Piercing logic
                    if (!this.perkManager.hasPerk('GodTierPrompt') || isZeroShot) {
                        bullet.markedForDeletion = true;
                    } else {
                        // Very rough pierce implementation: just reduce bullet "health" or let it live for 2 hits.
                        // We'll let it survive but maybe just diminish it or track hits, let's just make it infinite pierce for simplicity here.
                        // Actually, without tracking hits per enemy, infinite pierce hits multiple times per frame.
                        bullet.markedForDeletion = true; // Let's simplify and make the prompt just large, logic can be complex
                    }

                    this.createExplosion(bullet.x, bullet.y, enemy.color, 5); // Small hit fx

                    // Kill enemy
                    if (enemy.currentHealth <= 0) {
                        enemy.markedForDeletion = true;
                        this.createExplosion(enemy.x, enemy.y, enemy.color, 25); // Death fx
                        this.score += enemy.maxHealth; // More hp = more score

                        // Drop XP (Value scales with enemy maxHP)
                        const xpValue = enemy.maxHealth * 1.5;
                        this.xpOrbs.push(new XPOrb(enemy.x, enemy.y, xpValue));

                        this.updateUI();
                    }
                }
            });
        });

        // Cleanup
        this.bullets = this.bullets.filter(b => !b.markedForDeletion);
        this.enemies = this.enemies.filter(e => !e.markedForDeletion);
        this.particles = this.particles.filter(p => !p.markedForDeletion);
        this.xpOrbs = this.xpOrbs.filter(x => !x.markedForDeletion);
    }

    gainXP(amount: number) {
        this.currentXP += amount;
        if (this.currentXP >= this.xpToNextLevel) {
            this.currentXP -= this.xpToNextLevel; // Carry over
            this.levelUp();
        }
        this.updateUI();
    }

    levelUp() {
        this.level++;
        this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.3); // Scale required XP
        this.isPaused = true;
        this.triggerLevelUpScreen();
    }

    triggerLevelUpScreen() {
        this.levelUpScreenEl.classList.remove('hidden');

        const perksContainer = document.getElementById('perksContainer')!;
        perksContainer.innerHTML = ''; // Clear earlier perks

        const randomPerks = this.perkManager.getRandomPerks(3);

        randomPerks.forEach(perk => {
            const card = document.createElement('div');
            card.className = 'perk-card';
            card.innerHTML = `
                <h3>${perk.name}</h3>
                <p>${perk.description}</p>
            `;
            // Check if already active
            if (perk.id !== 'SystemPromptOverride' && this.perkManager.hasPerk(perk.id)) {
                card.innerHTML += `<p style="color: #ffaa00; margin-top: auto; font-size: 14px;">(Upgrade)</p>`;
            } else {
                card.innerHTML += `<p style="color: #4caf50; margin-top: auto; font-size: 14px;">(New Skill)</p>`;
            }

            card.onclick = () => {
                this.perkManager.applyPerk(perk.id);
                this.resumeGame();
            };

            perksContainer.appendChild(card);
        });
    }

    resumeGame() {
        this.levelUpScreenEl.classList.add('hidden');
        this.isPaused = false;
        this.lastTime = performance.now(); // Prevent large dt jump
    }

    draw() {
        // Clear canvas with trail effect
        this.ctx.fillStyle = 'rgba(17, 17, 17, 0.4)';
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.xpOrbs.forEach(x => x.draw(this.ctx));
        this.particles.forEach(p => p.draw(this.ctx));
        this.bullets.forEach(b => b.draw(this.ctx));
        this.enemies.forEach(e => e.draw(this.ctx));
        this.perkManager.drawDrones(this.ctx, this.player.x, this.player.y);
        this.player.draw(this.ctx, this.input.mouse.x, this.input.mouse.y);
    }

    triggerGameOver() {
        this.gameOver = true;
        this.score = Math.floor(this.score); // Guarantee integer for display and submission
        this.finalScoreEl.innerText = this.score.toString();
        this.gameOverScreenEl.classList.remove('hidden');
        this.submitAndFetchScores();
    }

    async submitAndFetchScores() {
        this.leaderboardLoadingEl.style.display = 'block';
        this.leaderboardBodyEl.innerHTML = '';

        try {
            // Submit
            if (this.score > 0) {
                await fetch('/api/scores', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nickname: this.nickname, score: this.score })
                });
            }

            // Fetch
            const res = await fetch('/api/scores');
            if (res.ok) {
                const scores = await res.json();
                this.leaderboardLoadingEl.style.display = 'none';
                this.leaderboardBodyEl.innerHTML = scores.map((s: any, i: number) => `
                        <tr>
                            <td>#${i + 1}</td>
                            <td>${escapeHtml(s.nickname)}</td>
                            <td>${s.score}</td>
                        </tr>
                    `).join('');
            }
        } catch (e) {
            console.error("Leaderboard error", e);
            this.leaderboardLoadingEl.innerText = "Leaderboard offline or DB not configured.";
        }
    }
}

// Simple HTML escaper to prevent XSS injected from nicknames
function escapeHtml(unsafe: string) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
