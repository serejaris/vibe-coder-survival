export class XPOrb {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number = 4;
    color: string = '#00ffcc';
    value: number;
    markedForDeletion: boolean = false;
    friction: number = 0.90; // Slows down quickly after drop

    constructor(x: number, y: number, value: number) {
        this.x = x;
        this.y = y;
        this.value = value;

        // Initial tiny explosion outward
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3 + 1;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
    }

    update(playerX: number, playerY: number, pickupRadius: number) {
        // Apply friction
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.x += this.vx;
        this.y += this.vy;

        // Magnetism towards player if within pickup radius
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist < pickupRadius) {
            // Accelerate towards player based on distance (closer = faster)
            const speedMod = 150 / Math.max(dist, 1);
            this.x += (dx / dist) * speedMod * 0.1;
            this.y += (dy / dist) * speedMod * 0.1;
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.closePath();
        ctx.shadowBlur = 0; // reset
    }
}
