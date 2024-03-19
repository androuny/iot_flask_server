from flask import Flask, render_template, request, send_from_directory
from flask_socketio import SocketIO, emit
from flask_minify import Minify
import time

app = Flask(__name__)
Minify(app=app, html=True, js=True, cssless=True)
app.config['SECRET_KEY'] = '2e9ue8u39hugt4hu9grn9uf2n9u31eniu31duinfenuigr2475'
socketio = SocketIO(app)

last_packet_timestamp = 0

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/schema")
def api_schema():
    return {"temperature":21.5,"humidity":10.2}

@app.route("/api/submit", methods=["POST"])
def api_submit():
    if request.method == "POST":
        global last_packet_timestamp

        last_packet_timestamp = time.time() * 1000 # because js timestamps are in miliseconds not in seconds lol
        print(request.data)
        temp = request.json["temperature"]
        hum = request.json["humidity"]
        rssi = request.json["rssi"]
        socketio.emit("packet_event", {"temperature":temp,"humidity":hum,"rssi":rssi})
        return "good"
    else:
        return 400

@socketio.on('connect')
def test_connect(auth):
    print(f'Websocket client connected: {request.remote_addr}')
    emit('conn_response', {'data': 'Connected',"last_packet_timestamp":last_packet_timestamp})

@socketio.on('disconnect')
def test_disconnect():
    print(f'Websocket client disconnected: {request.remote_addr}')

@socketio.on('ping')
def ping_pong():
    emit('pong')

if __name__ == '__main__':
    socketio.run(app, host="0.0.0.0", debug=False)