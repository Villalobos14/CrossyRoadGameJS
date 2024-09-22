// src/domain/gameLogic.js

import * as THREE from 'three';
import { scene, camera, renderer } from '../presentation/renderer.js';
import { createPlayerMesh } from './player.js';
import { createLane, addLane, lanes } from './lane.js';

// Variables globales
let player;
let moveUp = false, moveDown = false, moveLeft = false, moveRight = false;
let gameOverState = false;
let score = 0;
let currentLane;

// Workers
const playerWorker = new Worker('../data/playerWorker.js', { type: 'module' });
const carWorker = new Worker('../data/carWorker.js', { type: 'module' });
const truckWorker = new Worker('../data/truckWorker.js', { type: 'module' });

// Mapas para rastrear obstáculos por ID
const cars = new Map();
const trucks = new Map();

export function initGame() {
  // Crear el jugador y añadirlo a la escena
  player = createPlayerMesh();
  scene.add(player);

  // Inicializar el worker del jugador
  playerWorker.postMessage({ type: 'init', position: { x: 0, y: 5, z: 0 } });

  currentLane = Math.floor(player.position.y);

  // Genera los carriles iniciales al comienzo del juego
  for (let i = 0; i < 40; i++) {
    addLane();
  }

  // Configura los event listeners
  setupEventListeners();

  // Actualiza el puntaje inicial
  updateScore();

  // Configura los mensajes de los workers
  setupWorkerListeners();
}

function setupEventListeners() {
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

  document.getElementById('restart-button').addEventListener('click', restartGame);
}

function setupWorkerListeners() {
  // Worker del jugador
  playerWorker.onmessage = function (event) {
    const data = event.data;
    if (data.type === 'updatePosition') {
      player.position.set(data.position.x, data.position.y, data.position.z);
      handlePlayerProgress();
    }
  };

  // Worker de los carros
  carWorker.onmessage = function (event) {
    const data = event.data;
    if (data.type === 'newCar') {
      createCarMesh(data.car);
    } else if (data.type === 'updateCars') {
      updateCars(data.cars, data.carsToRemove);
    }
  };

  // Worker de los camiones
  truckWorker.onmessage = function (event) {
    const data = event.data;
    if (data.type === 'newTruck') {
      createTruckMesh(data.truck);
    } else if (data.type === 'updateTrucks') {
      updateTrucks(data.trucks, data.trucksToRemove);
    }
  };
}

function updateScore() {
  const scoreElement = document.getElementById('score');
  scoreElement.textContent = `Puntaje: ${score}`;

  // Verificar si el puntaje es 300 o más para terminar el juego
  if (score >= 300) {
    gameOverState = true;
    document.getElementById('game-over').style.display = 'block';
    document.getElementById('game-over').textContent = '¡Has ganado!';
    document.getElementById('restart-button').style.display = 'block';
  }
}

function handlePlayerProgress() {
  // Actualizar el puntaje si el jugador ha avanzado a un nuevo carril
  const newLane = Math.floor(player.position.y);
  if (newLane > currentLane) {
    score += newLane - currentLane;
    currentLane = newLane;
    updateScore();
  }
}

function movePlayer() {
  // Enviar comando de movimiento al worker del jugador
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

function detectCollisions() {
  const playerBox = new THREE.Box3().setFromObject(player);
  const obstacleBox = new THREE.Box3();

  // Verificar colisiones con carros
  cars.forEach((car) => {
    obstacleBox.setFromObject(car.mesh);
    if (playerBox.intersectsBox(obstacleBox)) {
      endGame();
    }
  });

  // Verificar colisiones con camiones
  trucks.forEach((truck) => {
    obstacleBox.setFromObject(truck.mesh);
    if (playerBox.intersectsBox(obstacleBox)) {
      endGame();
    }
  });
}

function endGame() {
  gameOverState = true;
  document.getElementById('game-over').style.display = 'block';
  document.getElementById('restart-button').style.display = 'block';

  // Detener los workers
  playerWorker.postMessage({ type: 'reset' });
  carWorker.postMessage({ type: 'reset' });
  truckWorker.postMessage({ type: 'reset' });
}

function restartGame() {
  window.location.reload();
}

function updateObstacles() {
  // Los workers manejan la actualización de obstáculos, no necesitamos hacer nada aquí
}

function checkGenerateNewLanes() {
  const lastLane = lanes[lanes.length - 1];

  if (player.position.y > lastLane.position.y - 10) {
    addLane();
  }

  // Remover carriles y obstáculos antiguos
  while (lanes.length > 0 && lanes[0].position.y < player.position.y - 20) {
    const lane = lanes.shift();
    scene.remove(lane.mesh);

    // Remover obstáculos asociados al carril
    lane.obstacles.forEach((obstacle) => {
      if (obstacle.type === 'car') {
        scene.remove(obstacle.mesh);
        cars.delete(obstacle.id);
      } else if (obstacle.type === 'truck') {
        scene.remove(obstacle.mesh);
        trucks.delete(obstacle.id);
      }
    });
  }
}

function moveCamera() {
  camera.position.y = player.position.y + 5;
}

export function animate() {
  requestAnimationFrame(animate);
  if (!gameOverState) {
    movePlayer();
    detectCollisions();
    checkGenerateNewLanes();
    moveCamera();
  }
  renderer.render(scene, camera);
}

function createCarMesh(carData) {
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

  car.position.set(carData.position.x, carData.position.y, carData.position.z);

  // Añadir el carro al mapa de carros
  cars.set(carData.id, { mesh: car, id: carData.id, type: 'car' });

  scene.add(car);
}

function updateCars(carDataArray, carsToRemove) {
  // Actualizar posiciones
  carDataArray.forEach((carData) => {
    const car = cars.get(carData.id);
    if (car) {
      car.mesh.position.set(carData.position.x, carData.position.y, carData.position.z);
    }
  });

  // Remover carros que salieron de la pantalla
  carsToRemove.forEach((id) => {
    const car = cars.get(id);
    if (car) {
      scene.remove(car.mesh);
      cars.delete(id);
    }
  });
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

  truck.position.set(truckData.position.x, truckData.position.y, truckData.position.z);

  // Añadir el camión al mapa de camiones
  trucks.set(truckData.id, { mesh: truck, id: truckData.id, type: 'truck' });

  scene.add(truck);
}

function updateTrucks(truckDataArray, trucksToRemove) {
  // Actualizar posiciones
  truckDataArray.forEach((truckData) => {
    const truck = trucks.get(truckData.id);
    if (truck) {
      truck.mesh.position.set(truckData.position.x, truckData.position.y, truckData.position.z);
    }
  });

  // Remover camiones que salieron de la pantalla
  trucksToRemove.forEach((id) => {
    const truck = trucks.get(id);
    if (truck) {
      scene.remove(truck.mesh);
      trucks.delete(id);
    }
  });
}
