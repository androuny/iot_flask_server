FROM python:alpine

WORKDIR /usr/src

COPY . .

EXPOSE 5000

RUN python -m venv env
RUN source env/bin/activate

RUN pip install --no-cache-dir --upgrade -r requirements.txt

RUN adduser appuser --disabled-password
USER appuser

CMD ["gunicorn","--worker-class","geventwebsocket.gunicorn.workers.GeventWebSocketWorker","-w","1","--bind","0.0.0.0:5000", "wsgi:app"]