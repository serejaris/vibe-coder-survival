import { InputManager } from './InputManager';
import { Bullet } from './Bullet';
import { angleTo } from './utils';
import { Game } from './Game';

export class Player {
    game: Game;
    x: number;
    y: number;
    radius: number = 18;
    color: string = '#4c8bf5';
    speed: number = 6;
    health: number = 100;
    maxHealth: number = 100;

    // Weapon attributes
    fireRate: number = 120; // ms per shot
    lastFireTime: number = 0;

    constructor(game: Game, x: number, y: number) {
        this.game = game;
        this.x = x;
        this.y = y;
    }

    update(input: InputManager, _dt: number) {
        // Movement
        let dx = 0;
        let dy = 0;

        if (input.keys['w'] || input.keys['arrowup']) dy -= 1;
        if (input.keys['s'] || input.keys['arrowdown']) dy += 1;
        if (input.keys['a'] || input.keys['arrowleft']) dx -= 1;
        if (input.keys['d'] || input.keys['arrowright']) dx += 1;

        // Normalize diagonal movement
        if (dx !== 0 && dy !== 0) {
            const length = Math.hypot(dx, dy);
            dx /= length;
            dy /= length;
        }

        this.x += dx * this.speed;
        this.y += dy * this.speed;

        // Keep player in bounds
        this.x = Math.max(this.radius, Math.min(this.game.width - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(this.game.height - this.radius, this.y));

        // Shooting
        if (input.mouse.down) {
            this.shoot();
        }
    }

    shoot() {
        const now = performance.now();
        if (now - this.lastFireTime >= this.fireRate) {
            const angle = angleTo(this.x, this.y, this.game.input.mouse.x, this.game.input.mouse.y);
            // Spawn bullet slightly ahead of player to not shoot from center
            const bulletOffsetX = Math.cos(angle) * (this.radius + 5);
            const bulletOffsetY = Math.sin(angle) * (this.radius + 5);

            // Apply Perks
            let sizeMod = 1;
            let speedMod = 1;
            let color = '#00ff00'; // Default green text-like bullets

            if (this.game.perkManager.hasPerk('GodTierPrompt')) {
                sizeMod = 1.5;
                speedMod = 1.2;
                color = '#ffcc00'; // Golden for god-tier
            }

            const bullet = new Bullet(this.x + bulletOffsetX, this.y + bulletOffsetY, angle, speedMod, sizeMod, color);
            this.game.bullets.push(bullet);
            this.lastFireTime = now;
        }
    }

    draw(ctx: CanvasRenderingContext2D, mouseX: number, mouseY: number) {
        const angle = angleTo(this.x, this.y, mouseX, mouseY);

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(angle);

        // Draw Player Body (Coder Silhouette)
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color; // Base blue color
        ctx.fill();
        ctx.strokeStyle = '#2855b5';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();

        // Draw Laptop (instead of a gun)
        ctx.beginPath();
        // A grey rectangle sitting "in front" of the coder
        ctx.roundRect(this.radius - 5, -12, 18, 24, 3);
        ctx.fillStyle = '#ccc';
        ctx.fill();
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();

        // Draw Laptop Screen (glowing)
        ctx.beginPath();
        ctx.roundRect(this.radius - 2, -9, 12, 18, 2);
        ctx.fillStyle = '#1e1e1e';
        ctx.fill();
        ctx.strokeStyle = '#4caf50'; // Green code vibe
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.closePath();

        ctx.restore();
    }
}
