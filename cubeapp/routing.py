from channels.routing import ProtocolTypeRouter, URLRouter

from api import routing as api_routing
from lobbies import routing as lobbies_routing
from draft import routing as draft_routing


application = ProtocolTypeRouter(
    {
        'websocket': URLRouter(
            (
                api_routing.websocket_urlpatterns
                + lobbies_routing.websocket_urlpatterns
                + draft_routing.websocket_urlpatterns
            )
        ),
    }
)
