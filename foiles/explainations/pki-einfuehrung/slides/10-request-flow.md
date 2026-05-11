# Verbindungsaufnahme über den Proxy

![Request Flow](assets/05-request-flow.svg)

Wichtig: Die Zertifikate der echten Webseite sieht der Browser bei TLS-Inspection nicht direkt.  
Er sieht ein vom Proxy erzeugtes Zertifikat für die Ziel-Domain.
