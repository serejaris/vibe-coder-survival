import { angleTo } from './utils';

export type EnemyType = 'GPT-5.2' | 'Claude 4.5 Opus' | 'Gemini 3 Pro' | 'Llama 4 Scout';

export class Enemy {
    x: number;
    y: number;
    radius: number;
    color: string;
    speed: number;
    markedForDeletion: boolean = false;
    currentHealth: number;
    maxHealth: number;
    type: EnemyType;

    constructor(x: number, y: number, type: EnemyType, speedMod: number = 1, healthMod: number = 1) {
        this.x = x;
        this.y = y;
        this.type = type;

        switch (type) {
            case 'GPT-5.2':
                this.color = '#3ca374'; // Green
                this.radius = 16;
                this.maxHealth = 15 * healthMod;
                this.speed = (Math.random() * 1.5 + 1.5) * speedMod;
                break;
            case 'Claude 4.5 Opus':
                this.color = '#d97757'; // Orange
                this.radius = 14;
                this.maxHealth = 10 * healthMod;
                this.speed = (Math.random() * 2 + 2.5) * speedMod; // Faster
                break;
            case 'Gemini 3 Pro':
                this.color = '#4285f4'; // Blue
                this.radius = 20;
                this.maxHealth = 40 * healthMod; // Tank
                this.speed = (Math.random() * 1 + 1.0) * speedMod; // Slower
                break;
            case 'Llama 4 Scout':
                this.color = '#8b5cf6'; // Purple
                this.radius = 18;
                this.maxHealth = 25 * healthMod;
                this.speed = (Math.random() * 1.5 + 2.0) * speedMod; // Fast & beefy
                break;
        }
        this.currentHealth = this.maxHealth;
    }

    update(playerX: number, playerY: number) {
        const angle = angleTo(this.x, this.y, playerX, playerY);
        this.x += Math.cos(angle) * this.speed;
        this.y += Math.sin(angle) * this.speed;
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = '#fff'; // White border for contrast
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();

        // Draw HP Bar
        const hpPercent = this.currentHealth / this.maxHealth;
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x - 10, this.y - this.radius - 8, 20, 4);
        ctx.fillStyle = '#0f0';
        ctx.fillRect(this.x - 10, this.y - this.radius - 8, 20 * hpPercent, 4);
    }
}
