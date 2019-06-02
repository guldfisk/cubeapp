FROM python:3
ENV PYTHONUNBUFFERED 1
ENV cube_app_debug 0

RUN mkdir -p /code
WORKDIR /code
COPY . .

#COPY entrypoint.sh /entrypoint.sh
RUN chmod 777 entrypoint.sh

ENTRYPOINT ["entrypoint.sh"]
CMD ["python3", "manage.py", "runserver", "0.0.0.0:8000"]
