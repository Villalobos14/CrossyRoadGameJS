// src/domain/player.js

import * as THREE from 'three';

export function createPlayer() {
  const group = new THREE.Group();

  const bodyGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
  const bodyMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = 0.6;
  group.add(body);

  group.position.set(0, 5, 0);

  return group;
}
