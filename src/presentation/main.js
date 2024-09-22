// src/presentation/main.js

import { scene, camera, renderer } from '../presentation/renderer.js';
import { initGame, animate } from './';

// Inicializa el juego
initGame();

// Comienza el bucle de animación
animate();
