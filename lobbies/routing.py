from django.conf.urls import url

from lobbies import consumers


websocket_urlpatterns = [
    url('^ws/lobbies/(?P<room>\w+)/$', consumers.LobbyConsumer),
]