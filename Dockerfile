FROM python:alpine

WORKDIR /usr/src

COPY requirements.txt .

RUN pip install --no-cache-dir --upgrade -r requirements.txt

COPY . .

EXPOSE 5000

RUN adduser appuser --disabled-password
USER appuser

CMD ["gunicorn","--worker-class","geventwebsocket.gunicorn.workers.GeventWebSocketWorker","-w","1","--bind","0.0.0.0:5000", "wsgi:app"]