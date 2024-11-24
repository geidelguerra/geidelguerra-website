(function () {
    const canvas = document.getElementById('canvas');
    /** @type {CanvasRenderingContext2D} */
    const ctx = canvas.getContext('2d');

    let timestamp = null;
    let frameTime = 0;
    let frame = 0;
    let fps = 0;
    let score = 0;

    let mousePos = { x: 0, y: 0 };
    let mouseMoved = false;
    let input = {
        direction: 0,
        shoot: false,
    }

    let leftEye = { centerX: 0, centerY: 0, x: 0, y: 0, size: 4 };
    let rightEye = { centerX: 0, centerY: 0, x: 0, y: 0, size: 4 };

    let ships = [];

    let shipImage = new Image(50, 50);
    shipImage.src = '/static/images/ship.png';

    let benderImage = new Image(93, 100);
    benderImage.onload = init;
    benderImage.src = '/static/images/bender_eye_tracking.png';

    let player  = {
        x: 0,
        y: 0,
        width: 93,
        height: 100,
    };

    let laser = {
        x: 0,
        y: 0,
        width: 4,
        length: 20,
        speed: 15,
        active: false,
    };

    function update(time) {
        timestamp = time;

        ctx.fillStyle = 'rgb(0, 0, 0)';
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (input.direction !== 0) {
            player.x += input.direction * 93 * 0.2;
        }

        ctx.drawImage(benderImage, player.x, player.y, player.width, player.height);

        leftEye.centerX = player.x + 35;
        leftEye.centerY = player.y + 48;

        rightEye.centerX = player.x + 55;
        rightEye.centerY = player.y + 48;

        leftEye.x = leftEye.centerX;
        leftEye.y = leftEye.centerY;
        rightEye.x = rightEye.centerX;
        rightEye.y = rightEye.centerY;

        if (input.shoot) {
            if (laser.active) {
                // do nothing
            } else {
                laser.x = player.x + player.width * 0.5 - laser.width * 0.5;
                laser.y = player.y;
                laser.active = true;
            }
        }

        if (laser.active) {
            laser.y -= laser.speed;

            if (laser.y + laser.length <= 0) {
                laser.active = false;
            } else {
                ctx.fillStyle = 'rgb(255, 0, 0)';
                ctx.fillRect(laser.x, laser.y - laser.length, laser.width, laser.length);
            }
        }

        ctx.fillStyle = 'rgba(255, 0, 0)';
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

        input.direction = 0;
        input.shoot = false;

        if (time - frameTime > 1000) {
            fps = frame;
            frame = 0;
            frameTime = time;
        } else {
            frame++;
        }

        requestAnimationFrame(update);
    }

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function keyDown(e) {
        switch (e.code) {
            case 'KeyA':
            case 'ArrowLeft':
                input.direction = -1;
                break;
            case 'KeyD':
            case 'ArrowRight':
                input.direction = 1;
                break;
        }

        if (e.code === 'Space') {
            input.shoot = true;
        }
    }

    function keyUp(e) {
        console.log(e);
    }

    function reset() {
        player.x = canvas.width / 2 - benderImage.width / 2;
        player.y = canvas.height - benderImage.height;
    }

    function init() {
        resize();
        reset();
        update();

        window.addEventListener('resize', resize);
        window.addEventListener('keydown', keyDown);
        window.addEventListener('keyup', keyUp);
    }
})();