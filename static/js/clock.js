const clock = document.getElementById('clock');
const hoursHand = clock.querySelector('.hours-hand');
const minutesHand = clock.querySelector('.minutes-hand');
const secondsHand = clock.querySelector('.seconds-hand');

function updateClock() {
    const time = new Date();
    const hours = time.getHours();
    const minutes = time.getMinutes();
    const seconds = time.getSeconds();

    const secondsAngle = (seconds / 60 * 360);
    const minutesAngle = minutes / 60 * 360;
    const hoursAngle = (hours - 12) / 12 * 360;

    secondsHand.style.transform = `rotate(${secondsAngle}deg)`;
    minutesHand.style.transform = `rotate(${minutesAngle}deg)`;
    hoursHand.style.transform = `rotate(${hoursAngle}deg)`;
}

updateClock();
setInterval(updateClock, 1000);