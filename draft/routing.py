from django.conf.urls import url

from draft import consumers


websocket_urlpatterns = [
    url('^ws/draft/(?P<draft_id>[a-f0-9-]+)/$', consumers.DraftConsumer),
]
