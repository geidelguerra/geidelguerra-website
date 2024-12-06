(function () {
    const STATE_INACTIVE = 'inactive';
    const STATE_ACTIVE = 'active';
    const STATE_EXPLODING = 'exploding';
    const DIR_NONE = 'non';
    const DIR_LEFT = 'left';
    const DIR_RIGHT = 'right';
    const DIR_DOWN = 'down';
    const COLS = 11;
    const ROWS = 5;
    const MAX_LASERS = 10;

    class Vector2 {
        constructor(x = 0, y = 0) {
            this.x = x;
            this.y = y;
        }
    }

    class Enemy {
        constructor() {
            this.position = new Vector2();
            this.width = 50;
            this.height = 50;
            this.textureName = null;
            this.health = 1;
            this.canShoot = false;
            this.state = STATE_INACTIVE;
            this.stateStartTime = null;
            this.lastMoveTime = 0;
            this.moveDuration = 0.025;
            this.fliped = false;
            this.direction = DIR_NONE;
        }
    }

    class EnemyFormation {
        constructor() {
            this.direction = DIR_NONE;
            this.previousDirection = DIR_NONE;
            this.horizontalSpeed = 5;
            this.verticalSpeed = 2;
            this.fireRate = 0.5;
            this.lastFireTime = 0;
            this.lastMoveTime = 0;
            this.moveDuration = 0.5;
        }
    }

    class Laser {
        constructor() {
            this.position = new Vector2(0, 0);
            this.width = 4;
            this.height = 20;
            this.speed = 20;
            this.state = STATE_INACTIVE;
        }
    }

    /** @type {HTMLCanvasElement} */
    const canvas = document.getElementById('game');
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
    };

    let enemyTemplates = {
        scout: {
            scorePoints: 10,
            textureName: 'solidjs'
        },
        grunt: {
            scorePoints: 20,
            textureName: 'sveltejs'
        },
        officer: {
            scorePoints: 30,
            textureName: 'vuejs'
        },
        boss: {
            scorePoints: 30,
            textureName: 'reactjs'
        },
    };

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
        reactjs: {
            type: 'texture',
            url: '/static/game/assets/textures/react.png',
        },
        vuejs: {
            type: 'texture',
            url: '/static/game/assets/textures/vue.png',
        },
        sveltejs: {
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

    let enemies = Array(ROWS * COLS).fill().map(() => new Enemy());
    let playerLasers = Array(1).fill().map(() => new Laser());
    let enemyLasers = Array(1).fill().map(() => new Laser());
    let enemyFormation = new EnemyFormation();
    let gameStarted = false;
    let gameOver = true;

    loadAssets().then(init).catch((errors) => console.log('Failed to load assets', errors));

    function update(time) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgb(24, 24, 27)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (!gameStarted) {
            if (input.firePressed) {
                gameStarted = true;
                restart();
            } else {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                ctx.font = '700 48px Fira Sans';
                ctx.fillStyle = 'rgb(255, 255, 128)';
                ctx.fillText('Click to start', canvas.width * 0.5 - ctx.measureText('Click to start').width * 0.5, canvas.height * 0.5 - ctx.measureText('Click to start').hangingBaseline * 0.5)
            }
        } else if (gameOver) {
            if (input.firePressed) {
                gameOver = false;
                restart();
            } else {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                let gameOverText = 'Complexity beated you! Good luck next time.';
                ctx.font = '700 38px Fira Sans';
                ctx.fillStyle = 'rgb(255, 0, 0)';
                ctx.fillText(gameOverText, canvas.width * 0.5 - ctx.measureText(gameOverText).width * 0.5, canvas.height * 0.5 - ctx.measureText(gameOverText).hangingBaseline * 0.5)

                let restartText = 'Click to restart'
                ctx.font = '700 48px Fira Sans';
                ctx.fillStyle = 'rgb(255, 255, 128)';
                ctx.fillText(restartText, canvas.width * 0.5 - ctx.measureText(restartText).width * 0.5, canvas.height * 0.5 + ctx.measureText(gameOverText).hangingBaseline)
            }
        } else {
            if (!input.paused) {
                if (input.changed) {
                    player.x = input.mousePosition.x - player.width * 0.5;

                    if (player.x < 0) {
                        player.x = 0;
                    } else if (player.x + player.width >= window.innerWidth) {
                        player.x = window.innerWidth - player.width;
                    }
                }

                player.y = canvas.height - player.height;

                leftEye.centerX = player.x + 35;
                leftEye.centerY = player.y + 48;

                rightEye.centerX = player.x + 55;
                rightEye.centerY = player.y + 48;

                if (input.firePressed) {
                    if (time - player.lastFireTime >= 1000 / player.fireRate) {
                        firePlayerLaser();
                        player.lastFireTime = time;
                    }
                }

                let newDirection = enemyFormation.direction;
                let newDirectionSetted = false;

                for (let enemy of enemies) {
                    if (enemy.state === STATE_EXPLODING) {
                        enemy.canShoot = false;

                        if (time - enemy.stateStartTime > 2000) {
                            enemy.state = STATE_INACTIVE;
                        }
                    } else if (enemy.state === STATE_ACTIVE) {
                        enemy.canShoot = true;

                        let rayStartY = enemy.position.y + enemy.height;
                        let rayY = rayStartY;
                        let maxRayDistance = Math.abs(canvas.height - rayStartY);
                        let collided = false;

                        while(rayY - rayStartY < maxRayDistance) {
                            rayY += 5;

                            for (let other of enemies) {
                                if (other !== enemy && other.state === STATE_ACTIVE) {
                                    if (collide(enemy.position.x, rayY, 50, 50, other.position.x, other.position.y, other.width, other.height)) {
                                        collided = true;
                                        enemy.canShoot = false;
                                        break;
                                    }
                                }
                            }

                            if (collided) {
                                break;
                            }
                        }

                        enemy.direction = enemyFormation.direction;

                        switch(enemyFormation.direction) {
                            case DIR_RIGHT:
                                if (time - enemy.lastMoveTime >= enemy.moveDuration * 1000) {
                                    enemy.position.x += enemyFormation.horizontalSpeed;
                                    enemy.lastMoveTime = time;
                                    enemy.fliped = !enemy.fliped;
                                }

                                if (enemy.position.x + enemy.width >= canvas.width && !newDirectionSetted) {
                                    newDirection = DIR_DOWN;
                                    newDirectionSetted = true;
                                }

                                enemy.position.y += Math.sin(time * 0.01) * 1.65;
                                break;
                            case DIR_LEFT:
                                if (time - enemy.lastMoveTime >= enemy.moveDuration * 1000) {
                                    enemy.position.x -= enemyFormation.horizontalSpeed;
                                    enemy.lastMoveTime = time;
                                    enemy.fliped = !enemy.fliped;
                                }

                                if (enemy.position.x <= 0 && !newDirectionSetted) {
                                    newDirection = DIR_DOWN;
                                    newDirectionSetted = true;
                                }

                                enemy.position.y += Math.sin(time * 0.01) * 1.65;
                                break;
                            case DIR_DOWN:
                                enemy.position.x += Math.cos(time * 0.01) * 1.65;
                                enemy.position.y += enemyFormation.verticalSpeed;
                                break;
                        }

                        if (collide(enemy.position.x, enemy.position.y, enemy.width, enemy.height, player.x, player.y, player.width, player.height)) {
                            gameOver = true;
                        } else if (enemy.position.y >= player.y) {
                            gameOver = true;
                        }
                    }
                }

                if (enemyFormation.direction === DIR_DOWN && time - enemyFormation.lastMoveTime >= enemyFormation.moveDuration * 1000) {
                    enemyFormation.lastMoveTime = time;

                    if (enemyFormation.previousDirection === DIR_LEFT) {
                        enemyFormation.direction = DIR_RIGHT;
                    } else if (enemyFormation.previousDirection === DIR_RIGHT) {
                        enemyFormation.direction = DIR_LEFT;
                    }
                } else if(newDirectionSetted) {
                    enemyFormation.previousDirection = enemyFormation.direction;
                    enemyFormation.direction = newDirection;
                    enemyFormation.lastMoveTime = time;
                }

                let canShootEnemies = enemies.filter((enemy) => enemy.canShoot);
                if (canShootEnemies.length > 0 && time - enemyFormation.lastFireTime >= 1000 / enemyFormation.fireRate) {
                    enemyFormation.lastFireTime = time;
                    let enemy = canShootEnemies[Math.floor(Math.random() * canShootEnemies.length)];
                    fireEnemyLaser(enemy);
                }

                for (let laser of playerLasers) {
                    if (laser.state === STATE_ACTIVE) {
                        if (!input.paused) {
                            laser.position.y -= laser.speed;

                            for (let enemy of enemies) {
                                if (enemy.state === STATE_ACTIVE) {
                                    if (collide(enemy.position.x, enemy.position.y, enemy.width, enemy.height, laser.position.x, laser.position.y, laser.width, laser.height)) {
                                        laser.state = STATE_INACTIVE;
                                        enemy.health = Math.max(0, enemy.health - 20);
                                        let hitSoundIndex = Math.round(1 + Math.random() * 1);
                                        assets[`enemyHit${hitSoundIndex}`].sound.volume(0.5);
                                        assets[`enemyHit${hitSoundIndex}`].sound.play();

                                        if (enemy.health === 0) {
                                            score += enemy.scorePoints;
                                            enemy.state = STATE_EXPLODING;
                                            enemy.stateStartTime = time;
                                            let explosionIndex = Math.round(1 + Math.random() * 3);
                                            let explosionVolume = (1 - Math.abs(enemy.y - player.y) / player.y) * 0.3;
                                            assets[`explosion${explosionIndex}`].sound.volume(explosionVolume);
                                            assets[`explosion${explosionIndex}`].sound.play();
                                        }
                                    }
                                }
                            }
                        }

                        if (laser.position.y + laser.height <= 0) {
                            laser.state = STATE_INACTIVE;
                        }
                    }
                }

                for (let laser of enemyLasers) {
                    if (laser.state === STATE_ACTIVE) {
                        laser.position.y += laser.speed;

                        if (collide(player.x, player.y, player.width, player.height, laser.position.x, laser.position.y, laser.width, laser.height)) {
                            laser.state = STATE_INACTIVE;
                            player.health = Math.max(0, player.health - 10);

                            let explosionIndex = Math.round(1 + Math.random() * 3);
                            assets[`explosion${explosionIndex}`].sound.volume(0.2);
                            assets[`explosion${explosionIndex}`].sound.play();

                            if (player.health === 0) {
                                gameOver = true;
                            }
                        } else if (laser.position.y >= canvas.height) {
                            laser.state = STATE_INACTIVE;
                        }
                    }
                }
            }

            ctx.fillStyle = 'rgba(255, 0, 0, 0.25)';
            ctx.fillRect(0, player.y, canvas.width, player.height);

            ctx.drawImage(assets.bender.texture, player.x, player.y, player.width, player.height);

            for (let enemy of enemies) {
                if (enemy.state === STATE_ACTIVE || enemy.state === STATE_EXPLODING) {
                    let texture = assets[enemy.textureName].texture;
                    let textureX = enemy.position.x;
                    let textureY = enemy.position.y;
                    let textureWidth = enemy.width;
                    let textureHeight = enemy.height;

                    if (enemy.direction === DIR_LEFT) {
                        ctx.save();
                        ctx.scale(-1, 1);
                        ctx.drawImage(texture, -textureWidth - textureX, textureY, textureWidth, textureHeight);
                        ctx.restore();
                    } else {
                        ctx.drawImage(texture, textureX, textureY, textureWidth, textureHeight);
                    }


                    if (input.showHelpers) {
                        ctx.lineWidth = 2;
                        let color = 'rgb(255, 0, 0)';
                        if (enemy.state === STATE_EXPLODING) {
                            color = 'rgb(128, 128, 128)';
                        } else if (enemy.canShoot) {
                            color = 'rgb(0, 255, 128)';
                        }

                        ctx.strokeStyle = color;
                        ctx.strokeRect(enemy.position.x, enemy.position.y, enemy.width, enemy.height);
                    }
                }
            }

            for (let laser of playerLasers) {
                if (laser.state === STATE_ACTIVE) {
                    ctx.fillStyle = 'rgb(128, 128, 0)';
                    ctx.fillRect(laser.position.x, laser.position.y - laser.height, laser.width, laser.height);
                }
            }

            for (let laser of enemyLasers) {
                if (laser.state === STATE_ACTIVE) {
                    ctx.fillStyle = 'rgb(0, 128, 128)';
                    ctx.fillRect(laser.position.x, laser.position.y - laser.height, laser.width, laser.height);
                }
            }

            leftEye.x = leftEye.centerX;
            leftEye.y = leftEye.centerY;
            rightEye.x = rightEye.centerX;
            rightEye.y = rightEye.centerY;

            ctx.fillStyle = input.firePressed ? 'rgb(128, 128, 0)' : 'rgb(0, 0, 0)';
            ctx.fillRect(leftEye.x, leftEye.y, leftEye.size, leftEye.size);
            ctx.fillRect(rightEye.x, rightEye.y, rightEye.size, rightEye.size);

            ctx.font = '700 48px Fira Code';
            ctx.fillStyle = 'rgb(255, 255, 255)';
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

            ctx.font = '700 18px Fira Code';
            ctx.fillStyle = 'rgb(255, 255, 255)';
            ctx.fillText(enemyFormation.direction, 60, 20 + ctx.measureText(enemyFormation.direction).hangingBaseline, canvas.width);

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

    function firePlayerLaser() {
        for (let laser of playerLasers) {
            if (laser.state === STATE_INACTIVE) {
                laser.position.x = player.x + player.width * 0.5 - laser.width * 0.5;
                laser.position.y = player.y;
                laser.state = STATE_ACTIVE;
                let soundIndex = Math.round(1 + Math.random() * 1);
                assets[`laser${soundIndex}`].sound.volume(0.2);
                assets[`laser${soundIndex}`].sound.play();
                break;
            }
        }
    }

    function fireEnemyLaser(enemy) {
        for (let laser of enemyLasers) {
            if (laser.state === STATE_INACTIVE) {
                laser.position.x = enemy.position.x + enemy.width * 0.5 - laser.width * 0.5;
                laser.position.y = enemy.position.y + enemy.height + 5;
                laser.state = STATE_ACTIVE;
                let soundIndex = Math.round(1 + Math.random() * 1);
                assets[`laser${soundIndex}`].sound.volume(0.2);
                assets[`laser${soundIndex}`].sound.play();
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
            case 'Escape':
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

        let gap = 40;
        let maxWidth = enemies[0].width * COLS + gap * COLS;

        for (let i = 0; i < enemies.length; i++) {
            const enemy = enemies[i];

            let row = Math.floor(i / COLS);
            let col = i % COLS;
            let startX = canvas.width * 0.5 - (maxWidth * 0.5);
            let startY = 80;

            enemy.position.x = startX + enemy.width * col + gap * col;
            enemy.position.y = startY + enemy.height * row + gap * row;

            if (row === 0) {
                enemy.textureName = enemyTemplates.officer.textureName;
                enemy.scorePoints = enemyTemplates.officer.scorePoints;
            } else if (row > 0 && row <= 2) {
                enemy.textureName = enemyTemplates.grunt.textureName;
                enemy.scorePoints = enemyTemplates.grunt.scorePoints;
            } else if (row > 2) {
                enemy.textureName = enemyTemplates.scout.textureName;
                enemy.scorePoints = enemyTemplates.scout.scorePoints;
            }

            enemy.state = STATE_ACTIVE;
        }

        enemyFormation.direction = DIR_RIGHT;
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
        canvas.addEventListener('mousemove', mouseMove);
        canvas.addEventListener('mousedown', mouseDown);
        canvas.addEventListener('mouseup', mouseUp);
        window.addEventListener('keydown', keyDown);
    }
})();
