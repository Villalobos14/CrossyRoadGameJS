import { GameUI } from './ui.js';

export class Game {
    constructor() {
        this.ui = new GameUI('gameCanvas');
        this.player = { x: 50, y: 550, width: 40, height: 40 };
        this.cars = [];
        this.logs = [];
        this.score = 0;
        this.gameRunning = false;

        this.initWorkers();
    }

    initWorkers() {
        // Worker para autos
        this.carWorker = new Worker('src/worker_cars.js');
        this.carWorker.onmessage = (e) => {
            this.cars = e.data;
        };

        // Worker para troncos
        this.logWorker = new Worker('src/worker_logs.js');
        this.logWorker.onmessage = (e) => {
            this.logs = e.data;
        };
    }

    startGame() {
        this.gameRunning = true;
        this.spawnObstacles();
        this.startGameLoop();
    }

    stopGame() {
        this.gameRunning = false;
        alert("Game Over! Your score: " + this.score);
        location.reload();
    }

    movePlayer(direction) {
        if (this.gameRunning) {
            // Movimiento del jugador basado en las teclas presionadas
            switch (direction) {
                case 'up': this.player.y -= 40; break;
                case 'down': this.player.y += 40; break;
                case 'left': this.player.x -= 40; break;
                case 'right': this.player.x += 40; break;
            }

            // Asegurarse de que el jugador no salga de los límites del canvas
            if (this.player.x < 0) this.player.x = 0;
            if (this.player.y < 0) this.player.y = 0;
            if (this.player.x > this.ui.canvas.width - this.player.width) this.player.x = this.ui.canvas.width - this.player.width;
            if (this.player.y > this.ui.canvas.height - this.player.height) this.player.y = this.ui.canvas.height - this.player.height;
        }
    }

    spawnObstacles() {
        setInterval(() => {
            if (this.gameRunning) {
                this.cars.push({ x: 800, y: this.randomLane(), width: 50, height: 30 });
                this.logs.push({ x: 800, y: this.randomLane(), width: 60, height: 20 });

                // Enviar autos y troncos a sus respectivos workers
                this.carWorker.postMessage(this.cars);
                this.logWorker.postMessage(this.logs);
            }
        }, 2000);
    }

    randomLane() {
        const lanes = [100, 200, 300, 400];
        return lanes[Math.floor(Math.random() * lanes.length)];
    }

    detectCollisions() {
        this.cars.forEach(car => {
            if (this.isColliding(this.player, car)) {
                this.stopGame(); // Termina el juego si hay colisión
            }
        });

        this.logs.forEach(log => {
            if (this.isColliding(this.player, log)) {
                this.stopGame(); // Termina el juego si hay colisión
            }
        });
    }

    isColliding(a, b) {
        return (
            a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y
        );
    }

    startGameLoop() {
        const gameLoop = () => {
            if (this.gameRunning) {
                this.ui.clearCanvas();
                this.ui.drawBackground();

                // Dibujar jugador
                this.ui.drawPlayer(this.player.x, this.player.y);

                // Dibujar autos y troncos
                this.cars.forEach(car => this.ui.drawCar(car.x, car.y));
                this.logs.forEach(log => this.ui.drawLog(log.x, log.y));

                this.detectCollisions();

                requestAnimationFrame(gameLoop); // Continuar el loop
            }
        };

        gameLoop(); // Iniciar el loop
    }
}
