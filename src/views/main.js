// Configuración de la escena, cámara y renderizador
const scene = new THREE.Scene();
const aspect = window.innerWidth / window.innerHeight;
const cameraWidth = 20;
let cameraHeight = cameraWidth / aspect;

const camera = new THREE.OrthographicCamera(
  -cameraWidth / 2, cameraWidth / 2,
  cameraHeight / 2, -cameraHeight / 2,
  0.1, 1000
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

// Crear los Workers
const playerWorker = new Worker('src/workers/playerWorker.js');
const carWorker = new Worker('src/workers/carWorker.js');
const truckWorker = new Worker('src/workers/truckWorker.js');

// Variables para controlar el movimiento del jugador
let moveUp = false, moveDown = false, moveLeft = false, moveRight = false;
let gameOverState = false;
let score = 0;
let currentLane = 5;

const scoreElement = document.getElementById('score');

// Inicializar el jugador y añadirlo a la escena
const player = createPlayer();
scene.add(player);

// Enviar posición inicial al Worker del jugador
playerWorker.postMessage({ type: 'init', position: { x: 0, y: 5, z: 0 } });

// Manejo del teclado para mover al jugador
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

// Enviar comandos de movimiento al Worker del jugador
function updatePlayer() {
  playerWorker.postMessage({
    type: 'move',
    direction: { up: moveUp, down: moveDown, left: moveLeft, right: moveRight }
  });
}

// Recibir la nueva posición del jugador desde el Worker
playerWorker.onmessage = function(event) {
  if (event.data.type === 'updatePosition') {
    const newPosition = event.data.position;
    player.position.set(newPosition.x, newPosition.y, newPosition.z);

    // Actualizar puntaje si el jugador avanza a un nuevo carril
    const newLane = Math.floor(newPosition.y);
    if (newLane > currentLane) {
      score += newLane - currentLane;
      currentLane = newLane;
      updateScore();
    }
  }
};

// Función para actualizar el puntaje
function updateScore() {
  scoreElement.textContent = `Puntaje: ${score}`;
  if (score >= 300) {
    gameOverState = true;
    document.getElementById('game-over').style.display = 'block';
    document.getElementById('game-over').textContent = '¡Has ganado!';
    document.getElementById('restart-button').style.display = 'block';
  }
}

// Crear el jugador
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
    type = 'grass';
  } else {
    type = laneTypes[Math.floor(Math.random() * laneTypes.length)];
  }

  const lane = createLane(laneY, type, index);
  lanes.push(lane);
}

// Genera los carriles iniciales al comienzo del juego
for (let i = 0; i < initialLaneCount; i++) {
  addLane();
}

// Función para crear un carril y solicitar creación de obstáculos al Worker correspondiente
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

  // Solicitar creación de obstáculos al Worker correspondiente
  if (index >= safeLaneCount) {
    if (type === 'road') {
      const numCars = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < numCars; i++) {
        carWorker.postMessage({ type: 'createCar', laneY: y });
      }
    } else if (type === 'truckLane') {
      const numTrucks = Math.floor(Math.random() * 2) + 1;
      for (let i = 0; i < numTrucks; i++) {
        truckWorker.postMessage({ type: 'createTruck', laneY: y });
      }
    }
  }

  return { position: plane.position, type, mesh: plane };
}

// Mapa para almacenar los obstáculos en la escena
const obstacles = new Map();

// Funciones para manejar mensajes de los Workers
carWorker.onmessage = function(event) {
  if (event.data.type === 'newCar') {
    const carData = event.data.car;
    const carMesh = createCarMesh(carData);
    obstacles.set(`car-${carData.id}`, { mesh: carMesh, type: 'car' });
    scene.add(carMesh);
  } else if (event.data.type === 'updateCars') {
    event.data.cars.forEach(carData => {
      const obstacle = obstacles.get(`car-${carData.id}`);
      if (obstacle) {
        obstacle.mesh.position.x = carData.position.x;
      }
    });

    event.data.carsToRemove.forEach(carId => {
      const obstacle = obstacles.get(`car-${carId}`);
      if (obstacle) {
        scene.remove(obstacle.mesh);
        obstacles.delete(`car-${carId}`);
      }
    });
  }
};

truckWorker.onmessage = function(event) {
  if (event.data.type === 'newTruck') {
    const truckData = event.data.truck;
    const truckMesh = createTruckMesh(truckData);
    obstacles.set(`truck-${truckData.id}`, { mesh: truckMesh, type: 'truck' });
    scene.add(truckMesh);
  } else if (event.data.type === 'updateTrucks') {
    event.data.trucks.forEach(truckData => {
      const obstacle = obstacles.get(`truck-${truckData.id}`);
      if (obstacle) {
        obstacle.mesh.position.x = truckData.position.x;
      }
    });

    event.data.trucksToRemove.forEach(truckId => {
      const obstacle = obstacles.get(`truck-${truckId}`);
      if (obstacle) {
        scene.remove(obstacle.mesh);
        obstacles.delete(`truck-${truckId}`);
      }
    });
  }
};

// Función para crear el modelo 3D de un carro
function createCarMesh(carData) {
  const car = new THREE.Group();
  const bodyGeometry = new THREE.BoxGeometry(2, 0.5, 1);
  const bodyMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = 0.25;
  car.add(body);

  car.position.set(carData.position.x, carData.position.y, carData.position.z);
  return car;
}

// Función para crear el modelo 3D de un camión
function createTruckMesh(truckData) {
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

  truck.position.set(truckData.position.x, truckData.position.y, truckData.position.z);
  return truck;
}

// Función para detectar colisiones
const playerBox = new THREE.Box3();
const obstacleBox = new THREE.Box3();

function detectCollisions() {
  playerBox.setFromObject(player);

  obstacles.forEach(obstacle => {
    obstacleBox.setFromObject(obstacle.mesh);
    if (playerBox.intersectsBox(obstacleBox)) {
      endGame();
    }
  });
}

// Función para terminar el juego
function endGame() {
  gameOverState = true;
  document.getElementById('game-over').style.display = 'block';
  document.getElementById('restart-button').style.display = 'block';

  // Detener los Workers
  playerWorker.postMessage({ type: 'reset' });
  carWorker.postMessage({ type: 'reset' });
  truckWorker.postMessage({ type: 'reset' });
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
    updatePlayer();
    detectCollisions();
    checkGenerateNewLanes();
    moveCamera();
  }
  renderer.render(scene, camera);
}
animate();

// Función para verificar y generar nuevos carriles si es necesario
function checkGenerateNewLanes() {
  const lastLane = lanes[lanes.length - 1];
  if (player.position.y > lastLane.position.y - 10) {
    addLane();
  }

  // Remover carriles que están muy atrás
  lanes = lanes.filter(lane => {
    if (lane.position.y < player.position.y - 20) {
      scene.remove(lane.mesh);
      return false;
    }
    return true;
  });
}

// Función para mover la cámara siguiendo al jugador
function moveCamera() {
  camera.position.y = player.position.y + 5;
}

// Añade una luz ambiental a la escena
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);
