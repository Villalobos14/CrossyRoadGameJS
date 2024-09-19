

// worker_player.js

self.onmessage = function(event) {
    const { player, direction } = event.data;
    switch (direction) {
        case 'up': player.y -= 40; break;
        case 'down': player.y += 40; break;
        case 'left': player.x -= 40; break;
        case 'right': player.x += 40; break;
    }
    postMessage(player); 
};









// worker_cars.js
self.onmessage = function(event) {
    let cars = event.data;

    function moveCars() {
        cars.forEach(car => {
            car.x -= 5; 
            if (car.x < -50) {
                car.x = 800; 
            }
        });
        postMessage(cars);
    }

    setInterval(moveCars, 1000 / 60); 
};





// worker_logs.js
self.onmessage = function(event) {
    let logs = event.data;

    function moveLogs() {
        logs.forEach(log => {
            log.x -= 3; 
            if (log.x < -60) {
                log.x = 800; 
            }
        });
        postMessage(logs);
    }

    setInterval(moveLogs, 1000 / 60);
};
