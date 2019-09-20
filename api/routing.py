from django.conf.urls import url
# from django.urls import path

from api import consumers


websocket_urlpatterns = [
    url('^ws/distribute/(?P<pk>\d+)/$', consumers.DistributorConsumer),
    url('^ws/patch_edit/(?P<pk>\d+)/$', consumers.PatchEditConsumer),
    url('^ws/delta_pdf_from/(?P<id_from>\d+)/to/(?P<id_to>\d+)/$', consumers.DeltaPdfConsumer),
]