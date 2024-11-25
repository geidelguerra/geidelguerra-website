(function () {
    const canvas = document.getElementById('canvas');
    /** @type {CanvasRenderingContext2D} */
    const ctx = canvas.getContext('2d');

    let frameTime = 0;
    let frame = 0;
    let fps = 0;
    let score = 0;
    let input = {
        changed: false,
        mousePosition: { x: 0, y: 0 },
        mouseMoved: false,
        firePressed: false,
    }

    let assets = {
        bender: {
            type: 'texture',
            url: '/static/game/assets/textures/bender.png',
        },
        ship: {
            type: 'texture',
            url: '/static/game/assets/textures/ship.png'
        },
        laser1: {
            type: 'audio',
            url: '/static/game/assets/audio/laserSmall_001.ogg'
        },
        laser2: {
            type: 'audio',
            url: '/static/game/assets/audio/laserSmall_002.ogg'
        },
        explosion1: {
            type: 'audio',
            url: '/static/game/assets/audio/explosionCrunch_000.ogg',
        },
        explosion2: {
            type: 'audio',
            url: '/static/game/assets/audio/explosionCrunch_001.ogg',
        },
        explosion3: {
            type: 'audio',
            url: '/static/game/assets/audio/explosionCrunch_002.ogg',
        },
        explosion4: {
            type: 'audio',
            url: '/static/game/assets/audio/explosionCrunch_003.ogg',
        },
    };

    let leftEye = { centerX: 0, centerY: 0, x: 0, y: 0, size: 4 };
    let rightEye = { centerX: 0, centerY: 0, x: 0, y: 0, size: 4 };

    let player  = {
        x: 0,
        y: 0,
        width: 93,
        height: 100,
        fireRate: 5,
        lastFireTime: 0,
    };

    let lasers = Array(10).fill().map(() => ({
        x: 0,
        y: 0,
        speed: 15,
        width: 5,
        length: 20,
        active: false,
    }));

    let activeShipsCount = 0;
    let shipSpawnRate = 1;
    let lastShipSpawnTime = 0;
    let ships = Array(3).fill().map(() => ({
        x: 0,
        y: 0,
        width: 50,
        height: 50,
        speed: 5,
        exploding: false,
        explodingStartTime: 0,
        explodingDuration: 1,
        active: false,
    }));
    let closestShip = null;

    loadAssets().then(init).catch((errors) => console.log('Failed to load assets', errors));

    function update(time) {
        ctx.fillStyle = 'rgb(0, 0, 0)';
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (input.changed) {
            player.x = input.mousePosition.x - player.width * 0.5;

            if (player.x < 0) {
                player.x = 0;
            } else if (player.x + player.width >= window.innerWidth) {
                player.x = window.innerWidth - player.width;
            }
        }

        ctx.drawImage(assets.bender.texture, player.x, player.y, player.width, player.height);

        leftEye.centerX = player.x + 35;
        leftEye.centerY = player.y + 48;

        rightEye.centerX = player.x + 55;
        rightEye.centerY = player.y + 48;

        if (input.firePressed) {
            if (time - player.lastFireTime >= 1000 / player.fireRate) {
                fire();
                player.lastFireTime = time;
            }
        }

        for (let ship of ships) {
            if (ship.active) {
                if (ship.exploding) {
                    if (time - ship.explodingStartTime >= ship.explodingDuration * 1000) {
                        ship.exploding = false;
                        ship.active = false;
                        activeShipsCount--;
                    }
                } else {
                    ship.y += ship.speed;
                }

                if (ship.y + ship.height >= canvas.height) {
                    ship.active = false;
                    activeShipsCount--;
                }

                if (ship.active) {
                    if(closestShip) {
                        if (Math.min(distance(player.x, player.y, ship.x, ship.y), distance(player.x, player.y, closestShip.x, closestShip.y))) {
                            closestShip = ship;
                        }
                    } else {
                        closestShip = ship;
                    }

                    ctx.drawImage(assets.ship.texture, ship.x, ship.y, ship.width, ship.height);
                }
            }
        }

        for (let laser of lasers) {
            if (laser.active) {
                laser.y -= laser.speed;

                for (let ship of ships) {
                    if (ship.active && !ship.exploding) {
                        if (collide(ship.x, ship.y, ship.width, ship.height, laser.x, laser.y, laser.width, laser.length)) {
                            laser.active = false;
                            ship.explodingStartTime = time;
                            let explosionIndex = Math.round(1 + Math.random() * 3);
                            assets[`explosion${explosionIndex}`].sound.volume(0.5);
                            assets[`explosion${explosionIndex}`].sound.play();
                            ship.exploding = true;
                            score += 10;
                        }
                    }
                }

                if (laser.y + laser.length <= 0) {
                    laser.active = false;
                } else {
                    ctx.fillStyle = 'rgb(128, 128, 0)';
                    ctx.fillRect(laser.x, laser.y - laser.length, laser.width, laser.length);
                }
            }
        }

        if (time - lastShipSpawnTime >= 1000 / shipSpawnRate) {
            spawnShip();
            lastShipSpawnTime = time;
        }

        if (closestShip && closestShip.active && !closestShip.exploding) {
            let leftEyeAngle = -Math.atan2(closestShip.y - leftEye.centerY, closestShip.x - leftEye.centerX) * -1;
            leftEye.x = leftEye.centerX + Math.cos(leftEyeAngle) * 5;
            leftEye.y = leftEye.centerY + Math.sin(leftEyeAngle) * 5;

            let rightEyeAngle = -Math.atan2(closestShip.y - rightEye.centerY, closestShip.x - rightEye.centerX) * -1;
            rightEye.x = rightEye.centerX + Math.cos(rightEyeAngle) * 5;
            rightEye.y = rightEye.centerY + Math.sin(rightEyeAngle) * 5;
        } else {
            leftEye.x = leftEye.centerX;
            leftEye.y = leftEye.centerY;
            rightEye.x = rightEye.centerX;
            rightEye.y = rightEye.centerY;
        }

        ctx.fillStyle = input.firePressed ? 'rgb(255, 0, 0)' : 'rgb(0, 0, 0)';
        ctx.fillRect(leftEye.x, leftEye.y, leftEye.size, leftEye.size);
        ctx.fillRect(rightEye.x, rightEye.y, rightEye.size, rightEye.size);

        ctx.font = '700 48px Fira Code';
        ctx.fillStyle = 'rgb(255, 255, 255)';
        let scoreMeasure = ctx.measureText(score);
        let scoreX = canvas.width * 0.5 - scoreMeasure.width * 0.5;
        let scoreY = 20 + scoreMeasure.hangingBaseline;

        ctx.fillText(score, scoreX, scoreY, canvas.width);

        ctx.font = '700 18px Fira Code';
        ctx.fillStyle = 'rgb(255, 255, 255)';
        let fpsMeasure = ctx.measureText(fps);
        let fpsX = 20;
        let fpsY = 20 + fpsMeasure.hangingBaseline;

        ctx.fillText(fps, fpsX, fpsY, canvas.width);

        if (time - frameTime > 1000) {
            fps = frame;
            frame = 0;
            frameTime = time;
        } else {
            frame++;
        }

        input.changed = false;

        requestAnimationFrame(update);
    }

    function fire() {
        for (let laser of lasers) {
            if (!laser.active) {
                laser.x = player.x + player.width * 0.5;
                laser.y = player.y;
                laser.active = true;
                let soundIndex = Math.round(1 + Math.random() * 1);
                assets[`laser${soundIndex}`].sound.volume(0.2);
                assets[`laser${soundIndex}`].sound.play();
                break;
            }
        }
    }

    function spawnShip() {
        for (let ship of ships) {
            if (!ship.active) {
                ship.x = 100 + Math.random() * (canvas.width - 200);
                ship.y = -ship.height;
                ship.active = true;
                activeShipsCount++;
                break;
            }
        }
    }

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function mouseMove(e) {
        input.mousePosition.x = e.clientX;
        input.mousePosition.y = e.clientY;
        input.mouseMoved = true;
        input.changed = true;
    }

    function mouseDown(e) {
        input.mousePosition.x = e.clientX;
        input.mousePosition.y = e.clientY;

        if (e.which === 1) {
            input.firePressed = true;
        }

        input.changed = true;
    }

    function mouseUp(e) {
        if (e.which === 1) {
            input.firePressed = false;
            input.changed = true;
        }
    }

    /** @returns {Boolean} */
    function collide(x0, y0, w0, h0, x1, y1, w1, h1) {
        if (x0 >= x1 && x0 <= x1 + w1 && y0 >= y1 && y0 <= y1 + h1) {
            return true;
        }

        if (x1 >= x0 && x1 <= x0 + w0 && y1 >= y0 && y1 <= y0 + h0) {
            return true;
        }

        return false;
    }

    /** @returns {Number} */
    function distance(x0, y0, x1, y1) {
        return Math.sqrt(Math.pow(x1 - x0) + Math.pow(y1 - y0));
    }

    function reset() {
        player.x = canvas.width * 0.5 - assets.bender.texture.width * 0.5;
        player.y = canvas.height - assets.bender.texture.height;
    }

    function loadAssets() {
        return Promise.all(Object.keys(assets).map((key) => new Promise((resolve, reject) => {
            try {
                if (assets[key].type === 'texture') {
                    assets[key].texture = new Image();
                    assets[key].texture.onload = resolve;
                    assets[key].texture.onerror = reject;
                    assets[key].texture.src = assets[key].url;
                } else if (assets[key].type === 'audio') {
                    assets[key].sound = new Howl({
                        src: [assets[key].url],
                        onload: resolve,
                        onerror: reject
                    });
                }
            } catch(e) {
                reject(e);
            }
        })));
    }

    function init() {
        resize();
        reset();
        update();

        window.addEventListener('resize', resize);
        window.addEventListener('mousemove', mouseMove);
        window.addEventListener('mousedown', mouseDown);
        window.addEventListener('mouseup', mouseUp);
        window.addEventListener('', mouseUp);
    }
})();