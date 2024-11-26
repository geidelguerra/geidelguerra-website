(function () {
    /** @type {HTMLCanvasElement} */
    const canvas = document.getElementById('canvas');
    /** @type {CanvasRenderingContext2D} */
    const ctx = canvas.getContext('2d', { alpha: false, colorSpace: 'srgb' });

    let frameTime = 0;
    let frame = 0;
    let fps = 0;
    let score = 0;
    let input = {
        changed: false,
        mousePosition: { x: 0, y: 0 },
        mouseMoved: false,
        firePressed: false,
        paused: false,
        showHelpers: false,
    }
    let enemyTemplates = [
        {
            textureName: 'react',
            health: 50,
            scorePoints: 30,
        },
        {
            textureName: 'vue',
            health: 40,
            scorePoints: 20,
        },
        {
            textureName: 'svelte',
            health: 30,
            scorePoints: 15,
        },
        {
            textureName: 'angular',
            health: 35,
            scorePoints: 25,
        },
        {
            textureName: 'solidjs',
            health: 20,
            scorePoints: 10,
        }
    ]

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
        enemyHit1: {
            type: 'audio',
            url: '/static/game/assets/audio/impactMetal_000.ogg',
        },
        enemyHit2: {
            type: 'audio',
            url: '/static/game/assets/audio/impactMetal_004.ogg',
        },
        playerHit1: {
            type: 'audio',
            url: '/static/game/assets/audio/forceField_000.ogg',
        },
        playerHit2: {
            type: 'audio',
            url: '/static/game/assets/audio/forceField_001.ogg',
        },
        react: {
            type: 'texture',
            url: '/static/game/assets/textures/react.png',
        },
        vue: {
            type: 'texture',
            url: '/static/game/assets/textures/vue.png',
        },
        svelte: {
            type: 'texture',
            url: '/static/game/assets/textures/svelte.png',
        },
        angular: {
            type: 'texture',
            url: '/static/game/assets/textures/angular.png',
        },
        solidjs: {
            type: 'texture',
            url: '/static/game/assets/textures/solidjs.png',
        },
    };

    let leftEye = { centerX: 0, centerY: 0, x: 0, y: 0, size: 4 };
    let rightEye = { centerX: 0, centerY: 0, x: 0, y: 0, size: 4 };

    let player = {
        x: 0,
        y: 0,
        health: 100,
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

    let activeEnemyCount = 0;
    let enemySpawnRate = 1;
    let lastEnemySpawnTime = 0;
    let enemies = Array(5).fill().map(() => ({
        x: 0,
        y: 0,
        width: 50,
        height: 50,
        speed: 3,
        health: 1,
        scorePoints: 5,
        exploding: false,
        explodingStartTime: 0,
        explodingDuration: 1,
        textureName: null,
        stunned: false,
        lastHitTime: 0,
        stunDuration: 1,
        angle: 0,
        active: false,
    }));
    let closestEnemy = null;
    let gameOver = true;

    loadAssets().then(init).catch((errors) => console.log('Failed to load assets', errors));

    function update(time) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgb(0, 0, 0)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (gameOver) {
            if (input.firePressed) {
                gameOver = false;
                restart();
            } else {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                ctx.font = '700 48px Fira Sans';
                ctx.fillStyle = 'rgb(255, 0, 0)';
                ctx.fillText('Click to start', canvas.width * 0.5 - ctx.measureText('Click to start').width * 0.5, canvas.height * 0.5 - ctx.measureText('Click to start').hangingBaseline * 0.5)
            }
        } else {
            if (input.changed && !input.paused) {
                player.x = input.mousePosition.x - player.width * 0.5;

                if (player.x < 0) {
                    player.x = 0;
                } else if (player.x + player.width >= window.innerWidth) {
                    player.x = window.innerWidth - player.width;
                }
            }

            if (!input.paused) {
                player.y = canvas.height - player.height - 40;
            }

            ctx.drawImage(assets.bender.texture, player.x, player.y, player.width, player.height);

            if (!input.paused) {
                leftEye.centerX = player.x + 35;
                leftEye.centerY = player.y + 48;

                rightEye.centerX = player.x + 55;
                rightEye.centerY = player.y + 48;
            }

            if (input.firePressed && !input.paused) {
                if (time - player.lastFireTime >= 1000 / player.fireRate) {
                    fire();
                    player.lastFireTime = time;
                }
            }

            for (let enemy of enemies) {
                if (enemy.active) {
                    if (!input.paused) {
                        if (enemy.exploding) {
                            if (time - enemy.explodingStartTime >= enemy.explodingDuration * 1000) {
                                enemy.exploding = false;
                                enemy.active = false;
                                activeEnemyCount--;
                            }
                        } else {
                            if (enemy.stunned && time - enemy.lastHitTime >= enemy.stunDuration * 1000) {
                                enemy.stunned = false;
                            }

                            enemy.x += Math.sin(time * 0.01) * enemy.speed * 0.5 * enemy.angle;
                            enemy.y += (enemy.stunned ? 0.5 : 1) * enemy.speed;
                        }
                    }

                    if (enemy.y + enemy.height >= canvas.height) {
                        enemy.active = false;
                        activeEnemyCount--;
                        player.health = Math.max(0, player.health - 5);
                        assets.playerHit1.sound.volume(0.2);
                        assets.playerHit1.sound.play();

                        if (player.health === 0) {
                            gameOver = true;
                        }
                    }

                    if (enemy.active) {
                        if (closestEnemy) {
                            if (Math.min(distance(player.x, player.y, enemy.x, enemy.y), distance(player.x, player.y, closestEnemy.x, closestEnemy.y))) {
                                closestEnemy = enemy;
                            }
                        } else {
                            closestEnemy = enemy;
                        }

                        let textureAspectRatio = assets[enemy.textureName].texture.height / assets[enemy.textureName].texture.width;
                        ctx.drawImage(assets[enemy.textureName].texture, enemy.x, enemy.y, enemy.width, enemy.height * textureAspectRatio);

                        if (input.showHelpers) {
                            ctx.strokeStyle = enemy.stunned ? 'rgb(128, 128, 128)' : 'rgb(255, 0, 0)';
                            ctx.strokeRect(enemy.x, enemy.y, enemy.width, enemy.height);
                        }
                    }
                }
            }

            for (let laser of lasers) {
                if (laser.active) {
                    if (!input.paused) {
                        laser.y -= laser.speed;

                        for (let enemy of enemies) {
                            if (enemy.active && !enemy.exploding) {
                                if (collide(enemy.x, enemy.y, enemy.width, enemy.height, laser.x, laser.y, laser.width, laser.length)) {
                                    laser.active = false;
                                    enemy.stunned = true;
                                    enemy.lastHitTime = time;
                                    enemy.health = Math.max(0, enemy.health - 20);
                                    let hitSoundIndex = Math.round(1 + Math.random() * 1);
                                    assets[`enemyHit${hitSoundIndex}`].sound.volume(0.5);
                                    assets[`enemyHit${hitSoundIndex}`].sound.play();

                                    if (enemy.health === 0) {
                                        score += enemy.scorePoints;
                                        enemy.explodingStartTime = time;
                                        enemy.exploding = true;
                                        let explosionIndex = Math.round(1 + Math.random() * 3);
                                        let explosionVolume = (1 - Math.abs(enemy.y - player.y) / player.y) * 0.3;
                                        assets[`explosion${explosionIndex}`].sound.volume(explosionVolume);
                                        assets[`explosion${explosionIndex}`].sound.play();
                                    }
                                }
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

            if (time - lastEnemySpawnTime >= 1000 / enemySpawnRate) {
                spawnEnemy();
                lastEnemySpawnTime = time;
            }

            if (closestEnemy && closestEnemy.active && !closestEnemy.exploding) {
                let leftEyeAngle = -Math.atan2(closestEnemy.y - leftEye.centerY, closestEnemy.x - leftEye.centerX) * -1;
                leftEye.x = leftEye.centerX + Math.cos(leftEyeAngle) * 5;
                leftEye.y = leftEye.centerY + Math.sin(leftEyeAngle) * 5;

                let rightEyeAngle = -Math.atan2(closestEnemy.y - rightEye.centerY, closestEnemy.x - rightEye.centerX) * -1;
                rightEye.x = rightEye.centerX + Math.cos(rightEyeAngle) * 5;
                rightEye.y = rightEye.centerY + Math.sin(rightEyeAngle) * 5;
            } else {
                leftEye.x = leftEye.centerX;
                leftEye.y = leftEye.centerY;
                rightEye.x = rightEye.centerX;
                rightEye.y = rightEye.centerY;
            }

            ctx.fillStyle = input.firePressed ? 'rgb(128, 128, 0)' : 'rgb(0, 0, 0)';
            ctx.fillRect(leftEye.x, leftEye.y, leftEye.size, leftEye.size);
            ctx.fillRect(rightEye.x, rightEye.y, rightEye.size, rightEye.size);

            ctx.font = '700 48px Fira Code';
            ctx.fillStyle = 'rgb(255, 0, 0)';
            ctx.fillText(player.health, 20, canvas.height - ctx.measureText(player.health).hangingBaseline, canvas.width);

            ctx.font = '700 48px Fira Code';
            ctx.fillStyle = 'rgb(255, 255, 255)';
            let scoreMeasure = ctx.measureText(score);
            let scoreX = canvas.width * 0.5 - scoreMeasure.width * 0.5;
            let scoreY = 20 + scoreMeasure.hangingBaseline;

            ctx.fillText(score, scoreX, scoreY, canvas.width);

            if (input.paused) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                ctx.font = '700 50px Fira Code';
                ctx.fillStyle = 'rgb(255, 255, 255)';
                ctx.fillText('Paused', canvas.width * 0.5 - ctx.measureText('Paused').width * 0.5, canvas.height * 0.5 - ctx.measureText('Paused').hangingBaseline * 0.5, canvas.width);
            }

            ctx.font = '700 18px Fira Code';
            ctx.fillStyle = 'rgb(255, 255, 255)';
            ctx.fillText(fps, 20, 20 + ctx.measureText(fps).hangingBaseline, canvas.width);

            if (time - frameTime > 1000) {
                fps = frame;
                frame = 0;
                frameTime = time;
            } else {
                frame++;
            }

            input.changed = false;
        }

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

    function spawnEnemy() {
        for (let enemy of enemies) {
            if (!enemy.active) {
                let template = enemyTemplates[Math.round(Math.random() * (enemyTemplates.length - 1))];
                enemy.textureName = template.textureName;
                enemy.health = template.health;
                enemy.x = 100 + Math.random() * (canvas.width - 200);
                enemy.y = -enemy.height;
                enemy.angle = Math.random() * 2;
                enemy.active = true;
                activeEnemyCount++;
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

    function keyDown(e) {
        switch (e.code) {
            case 'Space':
                input.paused = !input.paused;
                break;
            case 'KeyH':
                input.showHelpers = !input.showHelpers;
                break;
            case 'KeyR':
                restart();
                break;
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

    function restart() {
        player.x = canvas.width * 0.5 - assets.bender.texture.width * 0.5;
        player.health = 100;
        player.score = 0;
        input.firePressed = false;

        for (let enemy of enemies) {
            enemy.active = false;
        }
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
            } catch (e) {
                reject(e);
            }
        })));
    }

    function init() {
        resize();
        restart();
        update();

        window.addEventListener('resize', resize);
        window.addEventListener('mousemove', mouseMove);
        window.addEventListener('mousedown', mouseDown);
        window.addEventListener('mouseup', mouseUp);
        window.addEventListener('keydown', keyDown);
    }
})();