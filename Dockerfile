FROM debian:bullseye-20240311-slim

WORKDIR /usr/src

RUN apt-get update 
RUN apt-get install -y python3 python3-pip

COPY . .

EXPOSE 5000

RUN pip install --no-cache-dir --upgrade -r requirements.txt

RUN useradd --create-home appuser
USER appuser

CMD ["gunicorn", "--worker-class", "eventlet", "-w", "4", "--bind", "0.0.0.0:5000", "wsgi:app"]