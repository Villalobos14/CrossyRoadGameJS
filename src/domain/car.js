// src/domain/car.js

import * as THREE from 'three';
import { scene } from '../presentation/renderer.js';

export function createCar(y) {
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

  const cameraWidth = 20;
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
