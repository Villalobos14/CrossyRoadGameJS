// carWorker.js

let cars = [];
let carIdCounter = 0;
const cameraWidth = 20;

onmessage = function(event) {
  const data = event.data;
  if (data.type === 'createCar') {
    createCar(data.laneY);
  } else if (data.type === 'reset') {
    resetWorker();
  }
};

function createCar(laneY) {
  const id = carIdCounter++;
  const car = {
    id: id,
    position: {
      x: Math.random() * cameraWidth - cameraWidth / 2,
      y: laneY,
      z: 0
    },
    direction: Math.random() > 0.5 ? -1 : 1
  };
  cars.push(car);

  // Notificar al hilo principal para crear el carro
  postMessage({ type: 'newCar', car: car });
}

function updateCars() {
  const carsToRemove = [];
  cars.forEach(car => {
    car.position.x += car.direction * 0.1;
    if (Math.abs(car.position.x) > cameraWidth / 2 + 5) {
      carsToRemove.push(car.id);
    }
  });

  cars = cars.filter(car => !carsToRemove.includes(car.id));

  // Enviar actualizaciones al hilo principal
  postMessage({ type: 'updateCars', cars: cars, carsToRemove: carsToRemove });
}

function resetWorker() {
  cars = [];
  carIdCounter = 0;
}

// Iniciar el bucle de actualización
setInterval(updateCars, 50);
