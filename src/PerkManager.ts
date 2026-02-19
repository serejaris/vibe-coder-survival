import { Game } from './Game';
import { Bullet } from './Bullet';

export type PerkType =
    | 'GodTierPrompt'
    | 'AgenticLoop'
    | 'ContextWindowExpansion'
    | 'APILimitReached'
    | 'ZeroShotGeneration'
    | 'SystemPromptOverride';

export interface Perk {
    id: PerkType;
    name: string;
    description: string;
    apply: (game: Game) => void;
}

export class PerkManager {
    game: Game;
    activePerks: PerkType[] = [];

    // Perk specific state variables
    agenticDroneCount: number = 0;
    droneAngle: number = 0;

    apiLimitTimer: number = 0;
    apiLimitInterval: number = 5000;

    constructor(game: Game) {
        this.game = game;
    }

    availablePerks: Perk[] = [
        {
            id: 'GodTierPrompt',
            name: 'God-tier Prompt',
            description: 'Bullets pierce 1 enemy and are 50% larger.',
            apply: (_game: Game) => {
                // Modified dynamically in Player/Bullet logic via checking 'activePerks'
            }
        },
        {
            id: 'AgenticLoop',
            name: 'Agentic Loop',
            description: 'Summons an autonomous drone to orbit and shoot.',
            apply: (game: Game) => {
                game.perkManager.agenticDroneCount++;
            }
        },
        {
            id: 'ContextWindowExpansion',
            name: 'Context Window Expansion',
            description: 'Increases pickup radius and fire range.',
            apply: (game: Game) => {
                game.pickupRadius *= 1.5;
                // Range logic modified in bullet timeout/speed
            }
        },
        {
            id: 'APILimitReached',
            name: 'API Limit Reached',
            description: 'Periodically freezes all enemies for 2 seconds.',
            apply: (_game: Game) => {
                // Logic handled in update loop
            }
        },
        {
            id: 'ZeroShotGeneration',
            name: 'Zero-Shot Generation',
            description: '5% chance for any bullet to instantly delete an enemy.',
            apply: (_game: Game) => {
                // Handled in collision
            }
        },
        {
            id: 'SystemPromptOverride',
            name: 'System Prompt Override',
            description: 'Instantly wipes all on-screen enemies & heals 50 HP.',
            apply: (game: Game) => {
                // One time effect
                game.enemies.forEach(e => {
                    e.markedForDeletion = true;
                    game.createExplosion(e.x, e.y, e.color, 15);
                    game.score += e.maxHealth;
                });
                game.player.health = Math.min(game.player.maxHealth, game.player.health + 50);
                game.updateUI();
            }
        }
    ];

    getRandomPerks(count: number): Perk[] {
        const shuffled = [...this.availablePerks].sort(() => 0.5 - Math.random());
        // SystemPromptOverride is one-time, so we might want to filter it if they already have full HP, but let's keep it simple
        return shuffled.slice(0, count);
    }

    applyPerk(perkId: PerkType) {
        this.activePerks.push(perkId);
        const perk = this.availablePerks.find(p => p.id === perkId);
        if (perk) perk.apply(this.game);
    }

    hasPerk(perkId: PerkType): boolean {
        return this.activePerks.includes(perkId);
    }

    update(dt: number) {
        // Agentic Loop logic
        if (this.agenticDroneCount > 0) {
            this.droneAngle += 0.05; // Orbit speed

            // Drones shoot automatically
            if (Math.random() < 0.05 * this.agenticDroneCount && this.game.enemies.length > 0) {
                // Find random target
                const target = this.game.enemies[Math.floor(Math.random() * this.game.enemies.length)];

                // Spawn bullet from player center (simulate drone for now, or calculate actual drone pos)
                const bx = this.game.player.x;
                const by = this.game.player.y;
                const angleToEnemy = Math.atan2(target.y - by, target.x - bx);

                // Create auto-bullet, smaller radius, cyan color
                this.game.bullets.push(
                    new Bullet(bx, by, angleToEnemy, 1, 0.66, '#00ffff', true)
                );
            }
        }

        // API Limit Reached Logic (Freeze)
        if (this.hasPerk('APILimitReached')) {
            this.apiLimitTimer += dt;
            if (this.apiLimitTimer > this.apiLimitInterval) {
                this.apiLimitTimer = 0;

                // Freeze enemies
                this.game.enemies.forEach(e => {
                    e.speed = 0; // Temporary freeze
                    setTimeout(() => {
                        // Restore speed roughly based on phase/type (could be cleaner)
                        e.speed = (Math.random() * 1.5 + 1.5);
                    }, 2000);
                });

                // Visual effect for freeze
                const overlay = document.createElement('div');
                overlay.style.position = 'absolute';
                overlay.style.top = '0';
                overlay.style.left = '0';
                overlay.style.width = '100%';
                overlay.style.height = '100%';
                overlay.style.backgroundColor = 'rgba(0, 200, 255, 0.2)';
                overlay.style.pointerEvents = 'none';
                overlay.style.zIndex = '50';
                document.body.appendChild(overlay);
                setTimeout(() => overlay.remove(), 200);
            }
        }
    }

    drawDrones(ctx: CanvasRenderingContext2D, playerX: number, playerY: number) {
        if (this.agenticDroneCount === 0) return;

        for (let i = 0; i < this.agenticDroneCount; i++) {
            const angleOffset = (Math.PI * 2 / this.agenticDroneCount) * i;
            const droneX = playerX + Math.cos(this.droneAngle + angleOffset) * 40;
            const droneY = playerY + Math.sin(this.droneAngle + angleOffset) * 40;

            ctx.beginPath();
            ctx.rect(droneX - 4, droneY - 4, 8, 8);
            ctx.fillStyle = '#00ffff';
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.stroke();
            ctx.closePath();
        }
    }
}
