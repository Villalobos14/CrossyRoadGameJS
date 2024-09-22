// src/data/truckWorker.js

let trucks = [];
let truckIdCounter = 0;
const cameraWidth = 20;

onmessage = function(event) {
  const data = event.data;
  if (data.type === 'createTruck') {
    createTruck(data.laneY);
  } else if (data.type === 'reset') {
    resetWorker();
  }
};

function createTruck(laneY) {
  const id = truckIdCounter++;
  const truck = {
    id: id,
    position: {
      x: Math.random() * cameraWidth - cameraWidth / 2,
      y: laneY,
      z: 0
    },
    direction: Math.random() > 0.5 ? -1 : 1
  };
  trucks.push(truck);

  // Notificar al hilo principal para crear el camión
  postMessage({ type: 'newTruck', truck: truck });
}

function updateTrucks() {
  const trucksToRemove = [];
  trucks.forEach(truck => {
    truck.position.x += truck.direction * 0.08;
    if (Math.abs(truck.position.x) > cameraWidth / 2 + 6) {
      trucksToRemove.push(truck.id);
    }
  });

  trucks = trucks.filter(truck => !trucksToRemove.includes(truck.id));

  // Enviar actualizaciones al hilo principal
  postMessage({ type: 'updateTrucks', trucks: trucks, trucksToRemove: trucksToRemove });
}

function resetWorker() {
  trucks = [];
  truckIdCounter = 0;
}

// Iniciar el bucle de actualización
setInterval(updateTrucks, 50);
