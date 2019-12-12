import os
import json

from distutils.util import strtobool

import configparser

from secretresources.paths import project_name_to_secret_dir


SECRETS_PATH = os.path.join(project_name_to_secret_dir('cubeapp'), 'settings.cfg')

_config_parser = configparser.ConfigParser()
_config_parser.read(SECRETS_PATH)
DATABASE_PASSWORD = _config_parser['client']['password']
DATABASE_HOST = _config_parser['client']['host']

MAILGUN_KEY = _config_parser['default']['mailgun_key']
MAILGUN_DOMAIN = _config_parser['default']['mailgun_domain']

SPACES_PUBLIC_KEY = _config_parser['default']['spaces_public_key']
SPACES_SECRET_KEY = _config_parser['default']['spaces_secret_key']

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

SECRET_KEY = _config_parser['default']['secret_key']

DEBUG = strtobool(os.environ['DEBUG'])

ALLOWED_HOSTS = json.loads(_config_parser['default']['allowed_hosts']) if not DEBUG else []
HOST = _config_parser['default']['host']


INSTALLED_APPS = [
    'channels',
    'rest_framework',
    'knox',
    'api.apps.ApiConfig',
    'lobbies.apps.ApiConfig',
    'draft.apps.ApiConfig',
    'sealed.apps.ApiConfig',
    'frontend.apps.FrontendConfig',
    # 'corsheaders',
    # 'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    # 'django.contrib.messages',
    'django.contrib.staticfiles',
]

MIDDLEWARE = [
    # 'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    # 'django.contrib.auth.middleware.AuthenticationMiddleware',
    # 'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'cubeapp.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'templates')],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'cubeapp.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'cubespoiler',
        'USER': 'phdk',
        'PASSWORD': DATABASE_PASSWORD,
        'HOST': DATABASE_HOST,
        'PORT': '3306',
        'OPTIONS': {
            'charset': 'utf8',
            'use_unicode': True,
        },
    }
}


AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = False

USE_L10N = False

USE_TZ = True


STATIC_URL = '/static/'
STATIC_ROOT = os.path.join('/', 'opt', 'services', 'cubeapp', 'static')
MEDIA_ROOT = os.path.join('/', 'opt', 'services', 'cubeapp', 'media')

STATICFILES_DIRS = [
    os.path.join(BASE_DIR, "static"),
]


REST_FRAMEWORK = {
    'DEFAULT_RENDERER_CLASSES': (
        'rest_framework.renderers.JSONRenderer',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.LimitOffsetPagination',
    'PAGE_SIZE': 50,
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'knox.auth.TokenAuthentication',
    ),
}

ASGI_APPLICATION = 'cubeapp.routing.application'

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [('redis', 6379)],
        },
    },
}

# CHANNEL_LAYERS = {
#     "default": {
#         "BACKEND": "channels_rabbitmq.core.RabbitmqChannelLayer",
#         "CONFIG": {
#             "host": f'amqp://{os.environ["RABBITMQ_USERNAME"]}:{os.environ["RABBITMQ_PASSWORD"]}@rabbitmq:5672',
#         },
#     },
# }
