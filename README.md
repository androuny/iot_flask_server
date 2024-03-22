## iot_flask_server

this is a server I wrote in flask cuz i wanted to build a weather station project
using raspberry pi pico and some 433mhz modules

wrote this server so i can read the temperature/humidity on computer/phone

### how to build docker image

```docker build . -t [IMAGE_NAME]```

### how to run a built docker image

```docker run -d --name [CONTAINER_NAME] -p 5000:5000 [IMAGE_NAME]```

i used port 5000 cuz idk