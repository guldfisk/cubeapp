import configparser
import os

from secretresources.paths import project_name_to_secret_dir


SECRETS_PATH = os.path.join(project_name_to_secret_dir('cubeapp'), 'settings.cfg')
CERT_PATH = os.path.join(project_name_to_secret_dir('cubeapp'), 'kpd_cert.pem')

_config_parser = configparser.ConfigParser()
_config_parser.read(SECRETS_PATH)

APPLICATION_UID = _config_parser['KPD']['application_uid']
ASPSP_NAME = _config_parser['KPD']['aspsp_name']
ASPSP_COUNTRY = _config_parser['KPD']['aspsp_country']
