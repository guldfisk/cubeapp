FROM python:3.9
ENV PYTHONUNBUFFERED 1
ENV POETRY_VIRTUALENVS_CREATE false
ENV POETRY_NO_INTERACTION 1
ENV POETRY_CACHE_DIR '/var/cache/pypoetry'
ENV POETRY_HOME '/usr/local'

RUN mkdir -p /code
WORKDIR /code
COPY poetry.lock pyproject.toml /code/

RUN python3 -m venv penv
RUN penv/bin/pip install -U pip setuptools
RUN penv/bin/pip install poetry

RUN penv/bin/python -m poetry install
COPY . /code
#RUN pip3 install --upgrade pip
#RUN pip3 install -r /code/frozen-requirements.txt --use-deprecated=legacy-resolver --default-timeout=100

COPY ./appdirs/ /root/.local/share/

RUN apt-get update && apt-get install --yes --force-yes curl git

# RUN curl -sL https://deb.nodesource.com/setup_14.x -o /tmp/nodesource_setup.sh
# RUN bash /tmp/nodesource_setup.sh
RUN apt-get update && apt-get install npm -y
RUN npm install -g n
RUN n 14.21.3

RUN apt -y install gnupg2 postgresql-client
#RUN wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
#RUN echo "deb http://apt.postgresql.org/pub/repos/apt/ `lsb_release -cs`-pgdg main" | tee  /etc/apt/sources.list.d/pgdg.list
#RUN apt update
#RUN apt install -y postgresql-client-13

CMD ["bash", "./entrypoint.sh"]
