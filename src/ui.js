export class GameUI {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        // Usamos un canvas offscreen para evitar parpadeos
        this.offscreenCanvas = document.createElement('canvas');
        this.offscreenCanvas.width = this.canvas.width;
        this.offscreenCanvas.height = this.canvas.height;
        this.offscreenCtx = this.offscreenCanvas.getContext('2d');
    }

    clearCanvas() {
        this.offscreenCtx.clearRect(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height);
    }

    renderToScreen() {
        this.ctx.drawImage(this.offscreenCanvas, 0, 0);
    }

    drawBackground(offset) {
        this.offscreenCtx.fillStyle = 'green'; // Fondo de carretera simple
        this.offscreenCtx.fillRect(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height);
    }

    drawPlayer(x, y) {
        this.offscreenCtx.fillStyle = 'blue'; // Jugador simplificado
        this.offscreenCtx.fillRect(x, y, 40, 40); // Rectángulo para representar el jugador
    }

    drawCar(x, y) {
        this.offscreenCtx.fillStyle = 'red'; // Autos representados como rectángulos rojos
        this.offscreenCtx.fillRect(x, y, 50, 30); // Tamaño simplificado de los autos
    }

    drawLog(x, y) {
        this.offscreenCtx.fillStyle = 'brown'; // Troncos representados como rectángulos marrones
        this.offscreenCtx.fillRect(x, y, 60, 20); // Tamaño simplificado de los troncos
    }

    drawScore(score) {
        this.offscreenCtx.font = '20px Arial';
        this.offscreenCtx.fillStyle = 'white';
        this.offscreenCtx.fillText(`Puntuación: ${score}`, 10, 30);
    }
}