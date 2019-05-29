from django.shortcuts import render


def index(request):
    return render(request, 'frontend/index.html')

def cube_view(request):
    return render(request, 'frontend/cubeview.html')