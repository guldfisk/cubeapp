import datetime
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

OWNER_EMAIL = _config_parser['default']['owner_email']

SPACES_PUBLIC_KEY = _config_parser['default']['spaces_public_key']
SPACES_SECRET_KEY = _config_parser['default']['spaces_secret_key']

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

SECRET_KEY = _config_parser['default']['secret_key']

DEBUG = strtobool(os.environ['DEBUG'])

USE_PICKLE_DB = strtobool(os.environ.get('USE_PICKLE_DB', '0'))

IMAGE_CACHE_SIZE = int(os.environ.get('IMAGE_CACHE_SIZE', 0))

ALLOWED_HOSTS = json.loads(_config_parser['default']['allowed_hosts'])
HOST = _config_parser['default']['host']

SHELL_PLUS = "ipython"

INSTALLED_APPS = [
    'channels',
    'rest_framework',
    'knox',
    'django_extensions',
    'django_celery_beat',
    'debug_toolbar',
    'webpack_loader',

    'api.apps.ApiConfig',
    'lobbies.apps.ApiConfig',
    'draft.apps.DraftConfig',
    'sealed.apps.SealedConfig',
    'frontend.apps.FrontendConfig',
    'wishlist.apps.WishListConfig',
    'limited.apps.LimitedConfig',
    'rating.apps.RatingConfig',
    'tournaments.apps.TournamentsConfig',
    'league.apps.LeagueConfig',

    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.staticfiles',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'debug_toolbar.middleware.DebugToolbarMiddleware',
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
    os.path.join(BASE_DIR, "assets"),
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

CELERY_TIMEZONE = TIME_ZONE

BEAT_SCHEDULER = 'django_celery_beat.schedulers:DatabaseScheduler'

INTERNAL_IPS = [
    '127.0.0.1',
]

if DEBUG:
    DEBUG_TOOLBAR_CONFIG = {
        'SHOW_TOOLBAR_CALLBACK': lambda _: False,
        'RESULTS_CACHE_SIZE': 40,
    }

DEBUG_TOOLBAR_PANELS = [
    'ddt_request_history.panels.request_history.RequestHistoryPanel',
    'debug_toolbar.panels.timer.TimerPanel',
    'debug_toolbar.panels.headers.HeadersPanel',
    'debug_toolbar.panels.request.RequestPanel',
    'debug_toolbar.panels.sql.SQLPanel',
    'debug_toolbar.panels.cache.CachePanel',
    'debug_toolbar.panels.logging.LoggingPanel',
]

WEBPACK_LOADER = {
    'DEFAULT': {
        'CACHE': not DEBUG,
        'BUNDLE_DIR_NAME': 'bundles/',
        'STATS_FILE': os.path.join(BASE_DIR, 'webpack-stats.json'),
        'POLL_INTERVAL': 0.1,
        'TIMEOUT': None,
        'IGNORE': [r'.+\.hot-update.js', r'.+\.map'],
        'LOADER_CLASS': 'webpack_loader.loader.WebpackLoader',
    }
}
