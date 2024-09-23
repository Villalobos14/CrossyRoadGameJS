const startMenu = document.getElementById('start-menu');
const startButton = document.getElementById('start-button');
const gameOverModal = document.getElementById('game-over-modal');
const restartButton = document.getElementById('restart-button');
const scoreElement = document.getElementById('score');
const finalScoreElement = document.getElementById('final-score');

let scene, camera, renderer;
let playerWorker, carWorker, truckWorker;
let player;
let moveUp = false, moveDown = false, moveLeft = false, moveRight = false;
let gameOverState = false;
let score = 0;
let currentLane = 5;
let lanes = [];
let obstacles = new Map();
const playerBox = new THREE.Box3();
const obstacleBox = new THREE.Box3();
let ambientLight;

startMenu.style.display = 'block';
scoreElement.style.display = 'none';
gameOverModal.style.display = 'none';

startButton.addEventListener('click', () => {
  startMenu.style.display = 'none';
  scoreElement.style.display = 'block';
  startGame();
});

restartButton.addEventListener('click', () => {
  window.location.reload();
});

function startGame() {
  scene = new THREE.Scene();
  const aspect = window.innerWidth / window.innerHeight;
  const cameraWidth = 20;
  let cameraHeight = cameraWidth / aspect;

  camera = new THREE.OrthographicCamera(
    -cameraWidth / 2,
    cameraWidth / 2,
    cameraHeight / 2,
    -cameraHeight / 2,
    0.1,
    1000
  );
  camera.position.z = 10;
  camera.position.y = 5 + 5;

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
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

  playerWorker = new Worker('src/workers/playerWorker.js');
  carWorker = new Worker('src/workers/carWorker.js');
  truckWorker = new Worker('src/workers/truckWorker.js');

  moveUp = false;
  moveDown = false;
  moveLeft = false;
  moveRight = false;
  gameOverState = false;
  score = 0;
  currentLane = 5;
  lanes = [];
  obstacles = new Map();

  player = createPlayer();
  scene.add(player);

  ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambientLight);

  playerWorker.postMessage({
    type: 'init',
    position: { x: 0, y: 5, z: 0 }
  });

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  playerWorker.onmessage = handlePlayerWorkerMessage;
  carWorker.onmessage = handleCarWorkerMessage;
  truckWorker.onmessage = handleTruckWorkerMessage;

  for (let i = 0; i < 40; i++) {
    addLane();
  }

  animate();
}

function onKeyDown(event) {
  const key = event.key.toLowerCase();
  if (key === 'w') moveUp = true;
  if (key === 's') moveDown = true;
  if (key === 'a') moveLeft = true;
  if (key === 'd') moveRight = true;
}

function onKeyUp(event) {
  const key = event.key.toLowerCase();
  if (key === 'w') moveUp = false;
  if (key === 's') moveDown = false;
  if (key === 'a') moveLeft = false;
  if (key === 'd') moveRight = false;
}

function updatePlayer() {
  playerWorker.postMessage({
    type: 'move',
    direction: {
      up: moveUp,
      down: moveDown,
      left: moveLeft,
      right: moveRight
    }
  });
}

function handlePlayerWorkerMessage(event) {
  if (event.data.type === 'updatePosition') {
    const newPosition = event.data.position;
    player.position.set(newPosition.x, newPosition.y, newPosition.z);

    const newLane = Math.floor(newPosition.y);
    if (newLane > currentLane) {
      score += newLane - currentLane;
      currentLane = newLane;
      updateScore();
    }
  }
}

function updateScore() {
  scoreElement.textContent = `Puntaje: ${score}`;
  if (score >= 300) {
    endGame();
  }
}

function endGame() {
  gameOverState = true;
  finalScoreElement.textContent = score;
  scoreElement.style.display = 'none';
  gameOverModal.style.display = 'block';

  playerWorker.terminate();
  carWorker.terminate();
  truckWorker.terminate();

  window.removeEventListener('keydown', onKeyDown);
  window.removeEventListener('keyup', onKeyUp);
}

function animate() {
  if (!gameOverState) {
    requestAnimationFrame(animate);
    updatePlayer();
    detectCollisions();
    checkGenerateNewLanes();
    moveCamera();
  }
  renderer.render(scene, camera);
}

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

const laneTypes = ['grass', 'road', 'truckLane'];
const safeLaneCount = 5;

function addLane() {
  const index = lanes.length;
  const laneY = index === 0
    ? player.position.y
    : lanes[index - 1].position.y + 1;
  let type;

  if (index < safeLaneCount) {
    type = 'grass';
  } else {
    type = laneTypes[Math.floor(Math.random() * laneTypes.length)];
  }

  const lane = createLane(laneY, type, index);
  lanes.push(lane);
}

function createLane(y, type, index) {
  let color;
  if (type === 'grass') color = 0x7CFC00;
  else if (type === 'road') color = 0x555555;
  else if (type === 'truckLane') color = 0xAAAAAA;

  const geometry = new THREE.PlaneGeometry(20, 1);
  const material = new THREE.MeshBasicMaterial({
    color: color,
    side: THREE.DoubleSide
  });
  const plane = new THREE.Mesh(geometry, material);
  plane.position.set(0, y, 0);
  plane.rotation.x = -Math.PI / 2;
  scene.add(plane);

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

function handleCarWorkerMessage(event) {
  if (event.data.type === 'newCar') {
    const carData = event.data.car;
    const carMesh = createCarMesh(carData);
    obstacles.set(`car-${carData.id}`, { mesh: carMesh, type: 'car' });
    scene.add(carMesh);
  } else if (event.data.type === 'updateCars') {
    event.data.cars.forEach((carData) => {
      const obstacle = obstacles.get(`car-${carData.id}`);
      if (obstacle) {
        obstacle.mesh.position.x = carData.position.x;
      }
    });

    event.data.carsToRemove.forEach((carId) => {
      const obstacle = obstacles.get(`car-${carId}`);
      if (obstacle) {
        scene.remove(obstacle.mesh);
        obstacles.delete(`car-${carId}`);
      }
    });
  }
}

function handleTruckWorkerMessage(event) {
  if (event.data.type === 'newTruck') {
    const truckData = event.data.truck;
    const truckMesh = createTruckMesh(truckData);
    obstacles.set(`truck-${truckData.id}`, {
      mesh: truckMesh,
      type: 'truck'
    });
    scene.add(truckMesh);
  } else if (event.data.type === 'updateTrucks') {
    event.data.trucks.forEach((truckData) => {
      const obstacle = obstacles.get(`truck-${truckData.id}`);
      if (obstacle) {
        obstacle.mesh.position.x = truckData.position.x;
      }
    });

    event.data.trucksToRemove.forEach((truckId) => {
      const obstacle = obstacles.get(`truck-${truckId}`);
      if (obstacle) {
        scene.remove(obstacle.mesh);
        obstacles.delete(`truck-${truckId}`);
      }
    });
  }
}

function createCarMesh(carData) {
  const car = new THREE.Group();
  const bodyGeometry = new THREE.BoxGeometry(2, 0.5, 1);
  const bodyMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = 0.25;
  car.add(body);

  car.position.set(
    carData.position.x,
    carData.position.y,
    carData.position.z
  );
  return car;
}

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

  truck.position.set(
    truckData.position.x,
    truckData.position.y,
    truckData.position.z
  );
  return truck;
}

function detectCollisions() {
  playerBox.setFromObject(player);

  obstacles.forEach((obstacle) => {
    obstacleBox.setFromObject(obstacle.mesh);
    if (playerBox.intersectsBox(obstacleBox)) {
      endGame();
    }
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
      return false;
    }
    return true;
  });
}

function moveCamera() {
  camera.position.y = player.position.y + 5;
}
