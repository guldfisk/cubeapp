import os
import re
from django.http.response import HttpResponse

from cubeapp.settings import STATIC_ROOT, BASE_DIR

_PATTERN = re.compile('static/(.*)')
def static_view(request, file_path):
    # sub_path = _PATTERN.search(file_path).groups()[0]
    f = open(os.path.join(BASE_DIR, STATIC_ROOT, file_path),'r')
    # response = HttpResponse(f.read(), content_type='application/javascript')
    response = HttpResponse(f.read())
    return response