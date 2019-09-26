from channels.routing import ProtocolTypeRouter, URLRouter

from api import routing


application = ProtocolTypeRouter(
    {
        'websocket': URLRouter(
            routing.websocket_urlpatterns
        ),
    }
)
