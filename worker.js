self.onmessage = function(event) {
    const data = event.data;
    // Lógica concurrente del worker
    let result = doSomeComputation(data);
    postMessage(result); // Enviar resultado de vuelta al main thread
};

function doSomeComputation(data) {
    // Procesamiento o cálculo que se ejecuta en segundo plano
    return data * 2; // Ejemplo simple
}
