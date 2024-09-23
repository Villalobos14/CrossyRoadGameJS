// playerWorker.js

let playerPosition = { x: 0, y: 5, z: 0 };
const playerSpeed = 0.2;

onmessage = function(event) {
  const data = event.data;
  if (data.type === 'init') {
    playerPosition = data.position;
  } else if (data.type === 'move') {
    movePlayer(data.direction);
  } else if (data.type === 'reset') {
    resetWorker();
  }
};

function movePlayer(direction) {
  if (direction.up) {
    playerPosition.y += playerSpeed;
  }
  if (direction.down) {
    playerPosition.y -= playerSpeed;
  }
  if (direction.left) {
    playerPosition.x -= playerSpeed;
  }
  if (direction.right) {
    playerPosition.x += playerSpeed;
  }

  // Limitar movimiento
  const cameraWidth = 20;
  playerPosition.x = Math.max(-cameraWidth / 2 + 0.5, Math.min(cameraWidth / 2 - 0.5, playerPosition.x));
  const minY = playerPosition.y - 5;
  playerPosition.y = Math.max(minY, playerPosition.y);

  // Enviar la nueva posición al hilo principal
  postMessage({ type: 'updatePosition', position: playerPosition });
}

function resetWorker() {
  playerPosition = { x: 0, y: 5, z: 0 };
}


