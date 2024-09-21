let cars = [];
let cameraWidth = 20;

// Recibir mensajes del hilo principal
onmessage = function(event) {
  const data = event.data;
  if (data.type === 'init') {
    cameraWidth = data.cameraWidth;
    createCar();
  }
};

// Crear un carro
function createCar() {
  const car = {
    position: {
      x: Math.random() > 0.5 ? -cameraWidth / 2 - 2 : cameraWidth / 2 + 2,
      y: 0,
      z: 0
    },
    direction: Math.random() > 0.5 ? 1 : -1
  };
  cars.push(car);
  postMessage({ type: 'createCar', position: car.position });
}

// Actualizar la posición de los carros
function updateCars() {
  cars.forEach(car => {
    car.position.x += car.direction * 0.1;
    if (Math.abs(car.position.x) > cameraWidth / 2 + 5) {
      // Reiniciar el carro
      car.position.x = car.direction > 0 ? -cameraWidth / 2 - 2 : cameraWidth / 2 + 2;
    }
  });
  postMessage({ type: 'updateCars', positions: cars.map(car => car.position) });
}

// Bucle de actualización
setInterval(() => {
  updateCars();
}, 50); // Actualizar cada 50ms
