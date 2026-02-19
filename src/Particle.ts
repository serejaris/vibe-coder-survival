import { randomRange } from './utils';

export class Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    color: string;
    alpha: number = 1;
    markedForDeletion: boolean = false;
    friction: number = 0.95;

    constructor(x: number, y: number, color: string) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.radius = randomRange(1, 3);
        const angle = randomRange(0, Math.PI * 2);
        const velocity = randomRange(2, 6);
        this.vx = Math.cos(angle) * velocity;
        this.vy = Math.sin(angle) * velocity;
    }

    update() {
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= 0.02;

        if (this.alpha <= 0) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.alpha);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
        ctx.restore();
    }
}
