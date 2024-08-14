const canvas = document.getElementById('canvas');

const numbOfBlocks = 100;
const minBlockSize = 5;
const maxBlockSize = 10;
const tailSegmentMaxWidth = maxBlockSize * 0.2;
const tailSegmentMinWidth = 2;

let minSpeed = 5;
let maxSpeed = 10;
let maxForce = maxSpeed * 0.5;
let tailMaxLength = 10;
let tailSegmentLength = 30;
let composite = 'exclude';
let isRunning = false;
let simulationDuration = 5000;

if (canvas) {
    let time = 0;
    let startPosition = { x: 0, y: 0 };
    let ctx = canvas.getContext('2d', { antialias: true });
    let blocks = Array(numbOfBlocks).fill();

    function init() {
        for (let i = 0; i < blocks.length; i++) {
            let width = minBlockSize + Math.random() * maxBlockSize;
            let height = width;
            let position = { x: startPosition.x - width / 2, y: startPosition.y - height / 2 };
            let velocity = {
                x: minSpeed * Math.random() * maxSpeed,
                y: minSpeed + Math.random() * maxSpeed
            };
            let acceleration = { x: 0, y: 0 };
            let r = Math.round(200 + Math.random() * 255);
            let g = Math.round(200 + Math.random() * 255);
            let b = Math.round(200 + Math.random() * 255);
            let a = 1;
            let color = { r, g, b, a };
            let tail = [];
            let perceptionRadius = width;

            blocks[i] = { position, width, height, perceptionRadius, velocity, acceleration, color, tail };
        }
    }

    function update() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (!isRunning) {
            return;
        }

        let elapsed = Date.now() - time;

        if (elapsed >= simulationDuration) {
            stopSimulation();
            elapsed = simulationDuration;
        }

        let simulationDecay = (1.0 - (elapsed / simulationDuration));

        for (let block of blocks) {
            let separateForce = { x: 0, y: 0 };
            // let alignForce = { x: 0, y: 0 };
            // let cohesionForce = { x: 0, y: 0 };
            let count = 0;

            for (let other of blocks) {
                if (other === block) {
                    continue;
                }

                let distance = vdistance(block.position, other.position);

                if (distance > 0 && distance < block.perceptionRadius) {
                    let delta = vsub(block.position, other.position);
                    vnormalize(delta);
                    delta.x /= distance;
                    delta.y /= distance;
                    separateForce.x += delta.x;
                    separateForce.y += delta.y;
                    count++;
                }
            }

            if (count > 0) {
                separateForce.x /= count;
                separateForce.y /= count;
            }

            if (vmagnitude(separateForce) > 0) {
                vnormalize(separateForce);
                separateForce.x *= maxForce;
                separateForce.y *= maxForce;
                separateForce = vsub(separateForce, block.velocity);
            }

            block.acceleration.x += separateForce.x;
            block.acceleration.y += separateForce.y;

            if (block.position.y + block.height / 2 >= canvas.height || block.position.y - block.height / 2 < 0) {
                block.velocity.y *= -1;
            }

            if (block.position.x + block.width / 2 >= canvas.width || block.position.x - block.width / 2 < 0) {
                block.velocity.x *= -1;
            }

            block.velocity.x += block.acceleration.x;
            block.velocity.y += block.acceleration.y;

            let position = { x: block.position.x, y: block.position.y };

            block.position.x += block.velocity.x;
            block.position.y += block.velocity.y;
            block.color.a = simulationDecay;

            if (block.tail.length === 0 || Math.abs(vdistance(position, block.tail[0])) >= tailSegmentLength) {
                block.tail.unshift(position);
            }

            if (block.tail.length > tailMaxLength) {
                block.tail.pop();
            }

            block.acceleration.x = 0;
            block.acceleration.y = 0;
            block.color.a = 1 * simulationDecay;

            ctx.globalCompositeOperation = composite;

            ctx.beginPath();
            ctx.moveTo(block.position.x + block.width / 2, block.position.y + block.height / 2);

            for (let i = 0; i < block.tail.length; i++) {
                let point = block.tail[i];
                let alpha = (block.color.a / (i + 1));
                ctx.lineWidth = tailSegmentMinWidth + (tailSegmentMaxWidth / (i + 1)) * 2;
                ctx.strokeStyle = `rgba(${block.color.r}, ${block.color.g}, ${block.color.b}, ${alpha})`;
                ctx.lineTo(point.x + block.width / 2, point.y + block.height / 2);
                ctx.stroke();
            }

            ctx.fillStyle = `rgba(${block.color.r}, ${block.color.g}, ${block.color.b}, ${block.color.a})`;
            ctx.beginPath();
            ctx.roundRect(block.position.x, block.position.y, block.width, block.height, block.width);
            ctx.fill();
        }

        requestAnimationFrame(update);
    }

    /**
     * @param {MouseEvent} event
     * @param {HTMLCanvasElement}
     */
    function onMouseUp(event) {
        startPosition.x = event.clientX;
        startPosition.y = event.clientY;

        init();
        startSimulation();
    }

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        startPosition.x = (canvas.width / 2);
        startPosition.y = (canvas.height / 2);
    }

    function startSimulation() {
        if (isRunning) {
            return;
        }

        isRunning = true;
        time = Date.now();
        requestAnimationFrame(update);
        console.log('simulation started');
    }

    function stopSimulation() {
        if (!isRunning) {
            return;
        }

        isRunning = false;
        console.log('simulation stopped');
    }

    window.addEventListener('resize', resize);
    window.addEventListener('mouseup', onMouseUp);

    resize();
}

/**
 *
 * @param {{x: number, y: number}} v1
 * @param {{x: number, y: number}} v2
 * @returns {number}
 */
function vdistance(v1, v2) {
    let dx = v1.x - v2.x;
    let dy = v1.y - v2.y;

    return Math.sqrt(dx * dx + dy * dy);
}

/**
 *
 * @param {{x: number, y: number}} v
 * @returns {number}
 */
function vmagnitude(v) {
    return Math.sqrt(v.x * v.x + v.y * v.y);
}

/**
 * @param {{x: number, y: number}} v1
 * @param {{x: number, y: number}} v2
 * @returns {{x: number, y: number}}
 */
function vsub(v1, v2) {
    return { x: v1.x - v2.x, y: v1.y - v2.y };
}

/**
 * @param {{x: number, y: number}} v
 */
function vnormalize(v) {
    let mag = vmagnitude(v);
    v.x /= mag;
    v.y /= mag;
}
