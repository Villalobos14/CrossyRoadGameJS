const worker = new Worker('worker.js');
worker.postMessage(5); // Enviar datos al worker

worker.onmessage = function(event) {
    console.log("Resultado del worker:", event.data); // Recibir respuesta del worker
};
