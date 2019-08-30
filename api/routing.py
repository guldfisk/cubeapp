from django.conf.urls import url
from django.urls import path

from api import consumers


websocket_urlpatterns = [
    url('^ws/distribute/(?P<pk>\d+)/$', consumers.DistributorConsumer),
]