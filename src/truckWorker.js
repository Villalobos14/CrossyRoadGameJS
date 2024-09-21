let trucks = [];
let cameraWidth = 20;

// Recibir mensajes del hilo principal
onmessage = function(event) {
  const data = event.data;
  if (data.type === 'init') {
    cameraWidth = data.cameraWidth;
    createTruck();
  }
};

// Crear un camión
function createTruck() {
  const truck = {
    position: {
      x: Math.random() > 0.5 ? -cameraWidth / 2 - 3 : cameraWidth / 2 + 3,
      y: 0,
      z: 0
    },
    direction: Math.random() > 0.5 ? 1 : -1
  };
  trucks.push(truck);
  postMessage({ type: 'createTruck', position: truck.position });
}

// Actualizar la posición de los camiones
function updateTrucks() {
  trucks.forEach(truck => {
    truck.position.x += truck.direction * 0.08;
    if (Math.abs(truck.position.x) > cameraWidth / 2 + 6) {
      // Reiniciar el camión
      truck.position.x = truck.direction > 0 ? -cameraWidth / 2 - 3 : cameraWidth / 2 + 3;
    }
  });
  postMessage({ type: 'updateTrucks', positions: trucks.map(truck => truck.position) });
}

// Bucle de actualización
setInterval(() => {
  updateTrucks();
}, 50); // Actualizar cada 50ms
