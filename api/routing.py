from django.conf.urls import url

from api import consumers


websocket_urlpatterns = [
    url(r"^ws/distribute/(?P<pk>\d+)/$", consumers.DistributorConsumer),
    url(r"^ws/patch_edit/(?P<pk>\d+)/$", consumers.PatchEditConsumer),
    url(r"^ws/delta_pdf_from/(?P<id_from>\d+)/to/(?P<id_to>\d+)/$", consumers.DeltaPdfConsumer),
]
