// main.js

// Configuración de la escena, cámara y renderizador
const scene = new THREE.Scene();

const aspect = window.innerWidth / window.innerHeight;
const cameraWidth = 20;
let cameraHeight = cameraWidth / aspect;
const camera = new THREE.OrthographicCamera(
  -cameraWidth / 2, // Límite izquierdo
  cameraWidth / 2,  // Límite derecho
  cameraHeight / 2, // Límite superior
  -cameraHeight / 2, // Límite inferior
  0.1,  // Distancia mínima
  1000  // Distancia máxima
);
camera.position.z = 10;
camera.position.y = 5 + 5;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

window.addEventListener('resize', () => {
  const aspect = window.innerWidth / window.innerHeight;
  cameraHeight = cameraWidth / aspect;

  camera.top = cameraHeight / 2;
  camera.bottom = -cameraHeight / 2;

  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Crear el jugador y añadirlo a la escena
const player = createPlayer();
scene.add(player);

function createPlayer() {
  const group = new THREE.Group();

  const bodyGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
  const bodyMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = 0.6;
  group.add(body);

  group.position.set(0, 5, 0);

  return group;
}

// Variables para controlar el movimiento del jugador
let moveUp = false, moveDown = false, moveLeft = false, moveRight = false;
let gameOverState = false;
const playerSpeed = 0.2;

let score = 0;
let currentLane = Math.floor(player.position.y);

const scoreElement = document.getElementById('score');
function updateScore() {
  scoreElement.textContent = `Puntaje: ${score}`;

  // Verificar si el puntaje es 300 o más para terminar el juego
  if (score >= 300) {
    gameOverState = true;
    document.getElementById('game-over').style.display = 'block';
    document.getElementById('game-over').textContent = '¡Has ganado!';
    document.getElementById('restart-button').style.display = 'block';
  }
}

// Maneja los eventos de teclado para mover al jugador
window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();

  if (key === 'w') moveUp = true;
  if (key === 's') moveDown = true;
  if (key === 'a') moveLeft = true;
  if (key === 'd') moveRight = true;
});

window.addEventListener('keyup', (event) => {
  const key = event.key.toLowerCase();

  if (key === 'w') moveUp = false;
  if (key === 's') moveDown = false;
  if (key === 'a') moveLeft = false;
  if (key === 'd') moveRight = false;
});

// Variables para controlar los carriles (lanes) del juego
let lanes = [];
const initialLaneCount = 40;
const laneTypes = ['grass', 'road', 'truckLane'];
const safeLaneCount = 5; // Número de carriles iniciales sin obstáculos

// Función para generar un nuevo carril
function addLane() {
  const index = lanes.length;
  const laneY = index === 0 ? player.position.y : lanes[index - 1].position.y + 1;
  let type;

  if (index < safeLaneCount) {
    // Los primeros carriles son siempre de césped
    type = 'grass';
  } else {
    // Después de los carriles seguros, selecciona el tipo de carril al azar
    type = laneTypes[Math.floor(Math.random() * laneTypes.length)];
  }

  const lane = createLane(laneY, type, index);
  lanes.push(lane);
}

// Genera los carriles iniciales al comienzo del juego
for (let i = 0; i < initialLaneCount; i++) {
  addLane();
}

// Función para crear un carril
function createLane(y, type, index) {
  let color;

  if (type === 'grass') color = 0x7CFC00;
  else if (type === 'road') color = 0x555555;
  else if (type === 'truckLane') color = 0xAAAAAA;

  const geometry = new THREE.PlaneGeometry(cameraWidth, 1);
  const material = new THREE.MeshBasicMaterial({ color: color, side: THREE.DoubleSide });
  const plane = new THREE.Mesh(geometry, material);
  plane.position.set(0, y, 0);
  plane.rotation.x = -Math.PI / 2;
  scene.add(plane);

  const obstacles = [];

  // Generar obstáculos sólo si el índice del carril es mayor o igual al número de carriles seguros
  if (index >= safeLaneCount) {
    if (type === 'road') {
      // Generar entre 1 y 3 carros
      const numCars = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < numCars; i++) {
        const car = createCar(y);
        obstacles.push(car);
      }
    } else if (type === 'truckLane') {
      // Generar entre 1 y 2 camiones
      const numTrucks = Math.floor(Math.random() * 2) + 1;
      for (let i = 0; i < numTrucks; i++) {
        const truck = createTruck(y);
        obstacles.push(truck);
      }
    }
  }

  return { position: plane.position, type, mesh: plane, obstacles };
}

// Función para crear un auto
function createCar(y) {
  const car = new THREE.Group();

  const bodyGeometry = new THREE.BoxGeometry(2, 0.5, 1);
  const bodyMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = 0.25;
  car.add(body);

  const topGeometry = new THREE.BoxGeometry(1.2, 0.5, 0.8);
  const topMaterial = new THREE.MeshBasicMaterial({ color: 0xff6666 });
  const top = new THREE.Mesh(topGeometry, topMaterial);
  top.position.set(0, 0.65, 0);
  car.add(top);

  const wheelGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.5, 16);
  const wheelMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const wheelPositions = [
    [-0.7, 0, 0.5],
    [0.7, 0, 0.5],
    [-0.7, 0, -0.5],
    [0.7, 0, -0.5],
  ];
  wheelPositions.forEach((pos) => {
    const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(pos[0], 0.1, pos[2]);
    car.add(wheel);
  });

  car.position.x = Math.random() * cameraWidth - cameraWidth / 2;
  car.position.y = y;
  car.direction = Math.random() > 0.5 ? -1 : 1;

  car.update = function () {
    this.position.x += this.direction * 0.1;
    if (Math.abs(this.position.x) > cameraWidth / 2 + 5) {
      scene.remove(this);
      this.removed = true;
    }
  };

  scene.add(car);
  return car;
}

// Función para crear un camión
function createTruck(y) {
  const truck = new THREE.Group();

  const cabinGeometry = new THREE.BoxGeometry(1.5, 1, 1);
  const cabinMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
  const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
  cabin.position.set(-1.25, 0.5, 0);
  truck.add(cabin);

  const trailerGeometry = new THREE.BoxGeometry(3, 1, 1);
  const trailerMaterial = new THREE.MeshBasicMaterial({ color: 0x5555ff });
  const trailer = new THREE.Mesh(trailerGeometry, trailerMaterial);
  trailer.position.set(1.5, 0.5, 0);
  truck.add(trailer);

  const wheelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.5, 16);
  const wheelMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const wheelPositions = [
    [-2, 0, 0.5],
    [-0.5, 0, 0.5],
    [2, 0, 0.5],
    [-2, 0, -0.5],
    [-0.5, 0, -0.5],
    [2, 0, -0.5],
  ];
  wheelPositions.forEach((pos) => {
    const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(pos[0], 0.15, pos[2]);
    truck.add(wheel);
  });

  truck.position.x = Math.random() * cameraWidth - cameraWidth / 2;
  truck.position.y = y;
  truck.direction = Math.random() > 0.5 ? -1 : 1;

  truck.update = function () {
    this.position.x += this.direction * 0.08;
    if (Math.abs(this.position.x) > cameraWidth / 2 + 6) {
      scene.remove(this);
      this.removed = true;
    }
  };

  scene.add(truck);
  return truck;
}

// Función para mover al jugador
function movePlayer() {
  const moveAmount = playerSpeed;

  if (moveUp) player.position.y += moveAmount;
  if (moveDown) player.position.y -= moveAmount;
  if (moveLeft) player.position.x -= moveAmount;
  if (moveRight) player.position.x += moveAmount;

  // Limitar el movimiento del jugador
  player.position.x = Math.max(
    -cameraWidth / 2 + 0.5,
    Math.min(cameraWidth / 2 - 0.5, player.position.x)
  );

  const minY = player.position.y - 5;
  player.position.y = Math.max(minY, player.position.y);

  // Actualizar el puntaje si el jugador ha avanzado a un nuevo carril
  const newLane = Math.floor(player.position.y);
  if (newLane > currentLane) {
    score += newLane - currentLane;
    currentLane = newLane;
    updateScore();
  }
}

// Función para detectar colisiones
const playerBox = new THREE.Box3();
const obstacleBox = new THREE.Box3();

function detectCollisions() {
  playerBox.setFromObject(player);

  lanes.forEach((lane) => {
    lane.obstacles.forEach((obstacle) => {
      if (obstacle.removed) return;
      obstacleBox.setFromObject(obstacle);
      if (playerBox.intersectsBox(obstacleBox)) {
        endGame();
      }
    });
  });
}

// Función para terminar el juego
function endGame() {
  gameOverState = true;
  document.getElementById('game-over').style.display = 'block';
  document.getElementById('restart-button').style.display = 'block';
}

// Función para reiniciar el juego
function restartGame() {
  window.location.reload();
}

document.getElementById('restart-button').addEventListener('click', restartGame);

// Bucle de animación
function animate() {
  requestAnimationFrame(animate);
  if (!gameOverState) {
    movePlayer();
    updateObstacles();
    detectCollisions();
    checkGenerateNewLanes();
    moveCamera();
  }
  renderer.render(scene, camera);
}
animate();

function updateObstacles() {
  lanes.forEach((lane) => {
    lane.obstacles.forEach((obstacle) => {
      if (obstacle.removed) return;
      obstacle.update();
    });
    lane.obstacles = lane.obstacles.filter((obstacle) => !obstacle.removed);
  });
}

function checkGenerateNewLanes() {
  const lastLane = lanes[lanes.length - 1];

  if (player.position.y > lastLane.position.y - 10) {
    addLane();
  }

  lanes = lanes.filter((lane) => {
    if (lane.position.y < player.position.y - 20) {
      scene.remove(lane.mesh);
      lane.obstacles.forEach((obstacle) => {
        scene.remove(obstacle);
      });
      return false;
    }
    return true;
  });
}

function moveCamera() {
  camera.position.y = player.position.y + 5;
}

// Añade una luz ambiental a la escena
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);
