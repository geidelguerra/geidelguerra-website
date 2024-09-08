(function () {
    const bender = document.getElementById('bender')
    if (!bender) return
    const leftEye = bender.querySelector('.left_eye')
    if (!leftEye) return
    const rightEye = bender.querySelector('.right_eye')
    if (!rightEye) return
    const ship = document.querySelector('#ship')

    const leftEyeCenter = {x: 36, y: 50}
    const rightEyeCenter = {x: 58, y: 50}
    const eyeRadius = 5
    let targetPosition = null
    let shipPosition = {
        x:0,
        y: 10 + Math.random() * window.visualViewport.height - 20
    }
    let shipVelocity = {x:1, y:0}
    let lastTimeMouseMove = null

    function updateEyes() {
        if (targetPosition) {
            const leftEyeCenterAbsolute = {
                x: bender.offsetLeft - (bender.offsetWidth / 2) + leftEyeCenter.x + (leftEye.offsetWidth / 2),
                y: bender.offsetTop + leftEyeCenter.y
            }
            let leftAngle = -Math.atan2(targetPosition.y - leftEyeCenterAbsolute.y, targetPosition.x - leftEyeCenterAbsolute.x) * -1;
            let leftX = leftEyeCenter.x + Math.cos(leftAngle) * eyeRadius;
            let leftY = leftEyeCenter.y + Math.sin(leftAngle) * eyeRadius;
            leftEye.style.left = `${leftX}px`
            leftEye.style.top = `${leftY}px`

            const rightEyeCenterAbsolute = {
                x: bender.offsetLeft - (bender.offsetWidth / 2) + rightEyeCenter.x + (rightEye.offsetWidth / 2),
                y: bender.offsetTop + rightEyeCenter.y
            }

            let rightAngle = -Math.atan2(targetPosition.y - rightEyeCenterAbsolute.y, targetPosition.x - rightEyeCenterAbsolute.x) * -1;
            let rightX = rightEyeCenter.x + Math.cos(rightAngle) * eyeRadius;
            let rightY = rightEyeCenter.y + Math.sin(rightAngle) * eyeRadius;
            rightEye.style.left = `${rightX}px`
            rightEye.style.top = `${rightY}px`
        } else {
            leftEye.style.left = `${leftEyeCenter.x}px`
            leftEye.style.top = `${leftEyeCenter.y}px`
            rightEye.style.left = `${rightEyeCenter.x}px`
            rightEye.style.top = `${rightEyeCenter.y}px`
        }
    }

    function onMouseMove(e) {
        targetPosition = {x: e.clientX, y: e.clientY}
        lastTimeMouseMove = Date.now()
        updateEyes()
    }

    function updateShip(time) {
        shipPosition.x += shipVelocity.x
        shipPosition.y += Math.sin(time * 0.01) * 1

        if (shipPosition.x >= window.screen.availWidth) {
            shipVelocity.x *= -1
            shipPosition.y = 10 + Math.random() * window.visualViewport.height - 20
        } else if (shipPosition.x <= 0) {
            shipVelocity.x *= -1
            shipPosition.y = 10 + Math.random() * window.visualViewport.height - 20
        }

        if (shipVelocity.x < 0) {
            ship.style.transform = 'translate(-50%, -50%) scaleX(-1)'
        } else if (shipVelocity.x > 0) {
            ship.style.transform = 'translate(-50%, -50%) scaleX(1)'
        }

        if (shipPosition) {
            ship.style.left = `${shipPosition.x}px`
            ship.style.top = `${shipPosition.y}px`
        }

        if (!lastTimeMouseMove || Date.now() - lastTimeMouseMove > 2000) {
            targetPosition = {...shipPosition}
            updateEyes()
        }

        requestAnimationFrame(updateShip)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mousedown', onMouseMove)
    updateEyes()

    if (ship) {
        requestAnimationFrame(updateShip)
    }
})()