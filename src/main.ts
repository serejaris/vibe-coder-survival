import './style.css'
import { Game } from './Game'

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const game = new Game(canvas);

window.addEventListener('resize', () => {
  game.resize(window.innerWidth, window.innerHeight);
});

// game.start() is now called by the Start Button in Game.ts
