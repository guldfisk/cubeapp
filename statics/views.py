import os
from django.http.response import HttpResponse

from cubeapp.settings import STATIC_ROOT, BASE_DIR


def static_view(request, file_path):
    f = open(os.path.join(BASE_DIR, STATIC_ROOT, file_path),'r')
    # response = HttpResponse(f.read(), content_type='application/json')
    response = HttpResponse(f.read(), content_type='application/javascript')
    # response = HttpResponse(f.read())
    return response