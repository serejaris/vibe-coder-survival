export class Bullet {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number = 3;
    speed: number = 15;
    color: string = '#ffff00';
    markedForDeletion: boolean = false;

    constructor(x: number, y: number, angle: number, speedMod: number = 1, sizeMod: number = 1, color: string = '#ffff00', _isDroneBullet: boolean = false) {
        this.x = x;
        this.y = y;
        this.speed *= speedMod;
        this.radius *= sizeMod;
        this.color = color;
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
    }

    update(width: number, height: number) {
        this.x += this.vx;
        this.y += this.vy;

        if (
            this.x < 0 ||
            this.x > width ||
            this.y < 0 ||
            this.y > height
        ) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }
}
