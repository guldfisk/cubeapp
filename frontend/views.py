from django.template import Context, Template
from django.shortcuts import render


def index(request):
    return render(request, 'frontend/index.html')


def cube_view(request, cube_id: int):
    context = {
        'cube_id': cube_id
    }
    return render(request, 'frontend/cubeview.html', context)
