import { io } from "https://cdn.socket.io/4.7.4/socket.io.esm.min.js";
const socket = io();
let pingpong_rtt = 0;
let pingpong_begin;
let startTime;
let lastHeartbeat = new Date().getTime();
let timeArray = [];
let RSSIarray = [];
// god excuse me on this godawful unorganized js

socket.on("conn_response", (response) => {
  console.log("socketio connection success");
  startTime = response["last_packet_timestamp"];
});

socket.on("packet_event", (response) => {
  console.log("[packet_event] event recieved!");
  let hum = response["humidity"];
  let temp = response["temperature"];
  let rssi = response["rssi"];
  updateReadings(Number(hum.toFixed(2)), Number(temp.toFixed(2)));
  handlePingAverage();
  handleRssiAverage(rssi);
  resetStopwatch();
});

socket.on("pong", (response) => {
  //console.log("pong!");
  const currentTime = new Date().getTime();
  pingpong_rtt = new Date(currentTime - pingpong_begin).getUTCMilliseconds().toString().padStart(3, '0');
  lastHeartbeat = new Date().getTime();
});

function handlePingAverage() {
  let TimeDiff = new Date().getTime() - startTime;
  if (timeArray.length < 20) {
    timeArray.push(TimeDiff);
  } else {
    timeArray.shift();
    timeArray.push(TimeDiff);
  }

  let sum = timeArray.reduce((accumulator, currentNumber) => accumulator + currentNumber, 0);
  let average = sum / timeArray.length;
  average = Number(average.toFixed(0));

  document.getElementById('time_diff').textContent = `Average packet interval is ${average}ms (based on last 20 received packets)`;
}

function handleRssiAverage(rssi) {
  if (RSSIarray.length < 20) {
    RSSIarray.push(rssi);
  } else {
    RSSIarray.shift();
    RSSIarray.push(rssi);
  }

  let sum = RSSIarray.reduce((accumulator, currentNumber) => accumulator + currentNumber, 0);
  let average = sum / RSSIarray.length;
  average = Number(average.toFixed(0));

  document.getElementById('rssi').textContent = `Last packet RSSI was ${rssi} dBm. Average packet RSSI is ${average} dBm (based on last 20 received packets)`;
}

function startStopwatch() {
    startTime = new Date().getTime();
    updateDisplay();
    setInterval(updateDisplay, 50);
    updateHeartbeatDisplay();
    setInterval(updateHeartbeatDisplay, 50);
}

function resetStopwatch() {
  startTime = 0;
  updateDisplay();
  startStopwatch();
}

function updateDisplay() {
    const currentTime = new Date().getTime();
    const elapsed = new Date(currentTime - startTime);
    const hours = elapsed.getUTCHours().toString().padStart(2, '0');
    const minutes = elapsed.getUTCMinutes().toString().padStart(2, '0');
    const seconds = elapsed.getUTCSeconds().toString().padStart(2, '0');
    const miliseconds = elapsed.getUTCMilliseconds().toString().padStart(3, '0');
    document.getElementById('display').textContent = `Last packet received ${hours}h ${minutes}m ${seconds}s ${miliseconds}ms ago`;
    //console.log(`${hours}:${minutes}:${seconds}:${miliseconds}`);
}

function updateHeartbeatDisplay() {
    const currentTime = new Date().getTime();
    const elapsed = new Date(currentTime - lastHeartbeat);
    const hours = elapsed.getUTCHours().toString().padStart(2, '0');
    const minutes = elapsed.getUTCMinutes().toString().padStart(2, '0');
    const seconds = elapsed.getUTCSeconds().toString().padStart(2, '0');
    const miliseconds = elapsed.getUTCMilliseconds().toString().padStart(3, '0');
    document.getElementById('heartbeat').textContent = `Last server heartbeat received ${hours}h ${minutes}m ${seconds}s ${miliseconds}ms ago. RTT ${pingpong_rtt}ms`;
    //console.log(`${hours}:${minutes}:${seconds}:${miliseconds}`);
}

function updateReadings(hum, temp) {
  document.getElementById("hum").textContent = `🌊 Humidity: ${hum}%`;
  document.getElementById("temp").textContent = `🔥 Temperature: ${temp}°C`;
}


async function serverHeartbeat() { // I <3 JS
  await new Promise((resolve) => {
    setInterval(() => {
      pingpong_begin = new Date().getTime();
      socket.emit("ping"); // send a heartbeat check to the main server
    }, 2000);
  });
}

function handleDebugToggle() {
  let isDebugEnabled = !debug_button.checked;
  let all_debug_elements = document.getElementsByClassName("debug");
  if (isDebugEnabled === true) {
    for (let element of all_debug_elements) {
      element.classList.add("hidden");
    }
  } if (isDebugEnabled === false) {
    for (let element of all_debug_elements) {
      element.classList.remove("hidden");
    }
  }
}

let debug_button = document.getElementById("debug_checkbox");
debug_button.addEventListener("click", handleDebugToggle);

// u gotta do this otherwise some funky shit can happen :p
debug_button.click();
debug_button.click();

startStopwatch();
serverHeartbeat();