import configparser
import os

from secretresources.paths import project_name_to_secret_dir


SECRETS_PATH = os.path.join(project_name_to_secret_dir("cubeapp"), "settings.cfg")

_config_parser = configparser.ConfigParser()
_config_parser.read(SECRETS_PATH)

PRECIPITATION_MM_THRESHOLD = float(_config_parser.get("WEATHER", "precipitation_mm_threshold", fallback="5."))
PRECIPITATION_MM_DELTA_THRESHOLD = float(
    _config_parser.get("WEATHER", "precipitation_mm_delta_threshold", fallback="3.")
)
