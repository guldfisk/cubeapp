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

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

SECRET_KEY = _config_parser['default']['secret_key']

DEBUG = strtobool(os.environ['DEBUG'])

ALLOWED_HOSTS = json.loads(_config_parser['default']['allowed_hosts']) if not DEBUG else []


# Application definition

INSTALLED_APPS = [
    'rest_framework',
    'knox',
    'api.apps.ApiConfig',
    # 'statics.apps.StaticsConfig',
    'frontend.apps.FrontendConfig',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
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


# Database
# https://docs.djangoproject.com/en/2.1/ref/settings/#databases

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


# Password validation
# https://docs.djangoproject.com/en/2.1/ref/settings/#auth-password-validators

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


# Internationalization
# https://docs.djangoproject.com/en/2.1/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_L10N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/2.1/howto/static-files/

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