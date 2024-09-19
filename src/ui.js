// ui.js

export class GameUI {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        
        this.carImg = new Image();
        this.carImg.src = './assets/car.png';

        this.logImg = new Image();
        this.logImg.src = './assets/log.png';

        this.playerImg = new Image();
        this.playerImg.src = './assets/player.png';
    }

    drawBackground() {
        
        this.ctx.fillStyle = 'green';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawPlayer(x, y) {
        this.ctx.drawImage(this.playerImg, x, y, 40, 40);
    }

    drawCar(x, y) {
        this.ctx.drawImage(this.carImg, x, y, 50, 30);
    }

    drawLog(x, y) {
        this.ctx.drawImage(this.logImg, x, y, 60, 20);
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}
