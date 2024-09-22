// src/domain/truck.js

import * as THREE from 'three';
import { scene } from '../presentation/renderer.js';

export function createTruck(y) {
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

  const cameraWidth = 20;
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
