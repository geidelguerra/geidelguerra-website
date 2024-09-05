(function () {
    const bender = document.getElementById('bender')
    if (!bender) return
    const leftEye = bender.querySelector('.left_eye')
    if (!leftEye) return
    const rightEye = bender.querySelector('.right_eye')
    if (!rightEye) return

    const leftEyeCenter = {x: 36, y: 50}
    const leftEyeCenterAbsolute = {
        x: bender.offsetLeft - (bender.offsetWidth / 2) + leftEyeCenter.x + (leftEye.offsetWidth / 2),
        y: bender.offsetTop + bender.offsetHeight + 13 + leftEyeCenter.y
    }
    const rightEyeCenter = {x: 58, y: 50}
    const rightEyeCenterAbsolute = {
        x: bender.offsetLeft - (bender.offsetWidth / 2) + rightEyeCenter.x + (rightEye.offsetWidth / 2),
        y: bender.offsetTop + bender.offsetHeight + 13 + rightEyeCenter.y
    }
    const eyeRadius = 5
    let mousePosition = null

    function updateEyes() {
        if (mousePosition) {
            let leftAngle = -Math.atan2(mousePosition.y - leftEyeCenterAbsolute.y, mousePosition.x - leftEyeCenterAbsolute.x) * -1;
            let leftX = leftEyeCenter.x + Math.cos(leftAngle) * eyeRadius;
            let leftY = leftEyeCenter.y + Math.sin(leftAngle) * eyeRadius;
            leftEye.style.left = `${leftX}px`
            leftEye.style.top = `${leftY}px`

            let rightAngle = -Math.atan2(mousePosition.y - rightEyeCenterAbsolute.y, mousePosition.x - rightEyeCenterAbsolute.x) * -1;
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
        mousePosition = {x: e.screenX, y: e.screenY}
        updateEyes()
    }

    window.addEventListener('mousemove', onMouseMove)
    updateEyes()
})()