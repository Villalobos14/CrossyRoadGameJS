// src/domain/lane.js

import * as THREE from 'three';
import { scene } from '../presentation/renderer.js';
import { lanes } from './laneData.js'; // Archivo para almacenar las lanes
import { carWorker } from 'src/domain/gameLogic.js';
import { truckWorker } from 'src/domain/gameLogic.js';

const laneTypes = ['grass', 'road', 'truckLane'];
const safeLaneCount = 5; // Número de carriles iniciales sin obstáculos

export function addLane() {
  const index = lanes.length;
  const laneY = index === 0 ? 5 : lanes[index - 1].position.y + 1;
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

export function createLane(y, type, index) {
  let color;

  if (type === 'grass') color = 0x7CFC00;
  else if (type === 'road') color = 0x555555;
  else if (type === 'truckLane') color = 0xAAAAAA;

  const geometry = new THREE.PlaneGeometry(20, 1);
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
        // Enviar mensaje al worker para crear un carro
        carWorker.postMessage({ type: 'createCar', laneY: y });
      }
    } else if (type === 'truckLane') {
      // Generar entre 1 y 2 camiones
      const numTrucks = Math.floor(Math.random() * 2) + 1;
      for (let i = 0; i < numTrucks; i++) {
        // Enviar mensaje al worker para crear un camión
        truckWorker.postMessage({ type: 'createTruck', laneY: y });
      }
    }
  }

  return { position: plane.position, type, mesh: plane, obstacles };
}
