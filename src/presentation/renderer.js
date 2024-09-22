// src/presentation/renderer.js

import * as THREE from 'three';

export const scene = new THREE.Scene();

const aspect = window.innerWidth / window.innerHeight;
const cameraWidth = 20;
let cameraHeight = cameraWidth / aspect;

export const camera = new THREE.OrthographicCamera(
  -cameraWidth / 2, // Límite izquierdo
  cameraWidth / 2,  // Límite derecho
  cameraHeight / 2, // Límite superior
  -cameraHeight / 2, // Límite inferior
  0.1,  // Distancia mínima
  1000  // Distancia máxima
);

camera.position.z = 10;

export const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
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

// Añade una luz ambiental a la escena
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);
