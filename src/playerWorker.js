let playerPosition = { x: 0, y: 5, z: 0 };
const playerSpeed = 0.2;

// Recibir mensajes del hilo principal
onmessage = function(event) {
  const data = event.data;
  if (data.type === 'init') {
    playerPosition = { x: data.position.x, y: data.position.y, z: data.position.z };
  } else if (data.type === 'move') {
    movePlayer(data.direction);
  }
};

function movePlayer(direction) {
  let moved = false;

  if (direction.up) {
    playerPosition.y += playerSpeed;
    moved = true;
  }
  if (direction.down) {
    playerPosition.y -= playerSpeed;
    moved = true;
  }
  if (direction.left) {
    playerPosition.x -= playerSpeed;
    moved = true;
  }
  if (direction.right) {
    playerPosition.x += playerSpeed;
    moved = true;
  }

  // Limitar el movimiento horizontal del jugador
  const cameraWidth = 20;
  playerPosition.x = Math.max(-cameraWidth / 2 + 0.5, Math.min(cameraWidth / 2 - 0.5, playerPosition.x));

  // Enviar la nueva posición al hilo principal
  postMessage({ type: 'update', position: playerPosition });

  // Puedes agregar aquí la detección de colisiones y enviar un mensaje de 'gameOver' si es necesario
}
