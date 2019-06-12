FROM python:3
ENV PYTHONUNBUFFERED 1
ENV cube_app_debug 0

RUN mkdir -p /code
WORKDIR /code
COPY . .

COPY appdirs/* /root/.local/share/

RUN apt-get update && apt-get install curl git

RUN pip3 install -r requirements.txt

RUN python3 -m mtgorp.db.init
#RUN chmod 777 entrypoint.sh

RUN curl -sL https://deb.nodesource.com/setup_10.x -o /tmp/nodesource_setup.sh
RUN bash /tmp/nodesource_setup.sh
RUN apt-get update && apt-get install nodejs

RUN npm install dev
RUN npm run dev

RUN python3 manage.py migrate
RUN python3 manage.py populatecubes
RUN python3 manage.py collectstatic --noinput


#ENTRYPOINT ["entrypoint.sh"]
CMD ["python3", "manage.py", "runserver", "0.0.0.0:8000"]
