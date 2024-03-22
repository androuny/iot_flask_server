import { io } from "https://cdn.socket.io/4.7.4/socket.io.esm.min.js";
const socket = io();
let pingpong_rtt = 0;
let pingpong_begin;
let startTime;
let lastHeartbeat = new Date().getTime();
let timeArray = [];
let RSSIarray = [];
let gateway_timestamp = 0;
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
  gateway_timestamp = response["gateway_timestamp"];
  updateReadings(Number(hum.toFixed(2)), Number(temp.toFixed(2)));
  handlePingAverage();
  handleRssiAverage(rssi);
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

function handlePacketTrace() {
    const red = "🟥";
    const green = "🟩";

    let packet_client = document.getElementById("packet_client");
    let packet_server = document.getElementById("packet_server");
    let packet_gateway = document.getElementById("packet_gateway");
    let packet_station = document.getElementById("packet_weather");

    packet_client.textContent = `${green}client (this device)`;

    setInterval(() => { // handle packet_server
        const max_heartbeat_age = 4000; // max allowed heartbeat age in milliseconds
        let heartbeat_age = new Date().getTime() - lastHeartbeat; // heartbeat age in ms
        let heartbeat_age_seconds = ( heartbeat_age / 1000 ).toFixed(1);
        if (heartbeat_age > max_heartbeat_age) { // if last heartbeat older than max allowed
            packet_server.textContent = `${red}server - last heartbeat ${heartbeat_age_seconds}s ago. RTT ${pingpong_rtt}ms`;
        } else {
            packet_server.textContent = `${green}server - last heartbeat ${heartbeat_age_seconds}s ago. RTT ${pingpong_rtt}ms`;
        }
    }, 100);

    setInterval(() => { // handle packet_gateway
        const max_gateway_timestamp_age = 6000; // max allowed timestamp age in milliseconds
        let timestamp_age = new Date().getTime() - gateway_timestamp; // gateway timestamp age in ms
        let timestamp_age_seconds = ( timestamp_age / 1000).toFixed(1);
        if (timestamp_age > max_gateway_timestamp_age) {
            packet_gateway.textContent = `${red}gateway station - last packet ${timestamp_age_seconds}s ago.`;
        } else {
            packet_gateway.textContent = `${green}gateway station - last packet ${timestamp_age_seconds}s ago.`;
        }
    }, 100);
}

let debug_button = document.getElementById("debug_checkbox");
debug_button.addEventListener("click", handleDebugToggle);

// u gotta do this otherwise some funky shit can happen :p
debug_button.click();
debug_button.click();

// call all the starting functions
serverHeartbeat();
handlePacketTrace();