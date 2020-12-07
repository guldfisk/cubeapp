FROM python:3
ENV PYTHONUNBUFFERED 1

RUN mkdir -p /code
COPY . /code
RUN pip3 install --upgrade pip
RUN pip3 install -r /code/requirements.txt --use-deprecated=legacy-resolver
WORKDIR /code

COPY ./appdirs/ /root/.local/share/

RUN apt-get update && apt-get install --yes --force-yes curl git

RUN curl -sL https://deb.nodesource.com/setup_10.x -o /tmp/nodesource_setup.sh
RUN bash /tmp/nodesource_setup.sh
RUN apt-get update && apt-get install nodejs

CMD ["bash", "./entrypoint.sh"]
