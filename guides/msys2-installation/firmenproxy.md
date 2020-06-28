# Update hinter Firmenproxy

Nicht in jedem Firmennetzwerk dürfen Mitarbeiter einfach Programme aus dem Internet installieren.
Wenn überhaupt erlaubt, muss meist ein Proxy für den Download konfiguriert werden.

## /etc/pacman.conf
Eine Möglichkeit die Paketaktualisierung über einen Proxy zu realisieren ist folgender Eintrag:

> `XferCommand = /usr/bin/wget -nv --timeout=20 --tries=3 -c -e use_proxy=yes -e http_proxy=msys2-proxy.meinefirma.de:port -e https_proxy=msys2-proxy.meinefirma.de:port -O %o %u`

Das bewirkt:

* Sämtliche Zugriffe von Pacman erfolgen über den eingestellten Proxy.

## Einschränken der Repositories

In den Dateien `mirrorlist.*` unter /etc/pacman.d/ sind die Quellrepositories hinterlegt.
Firmenproxies lassen nicht immer alle Repositories für den Download zu.
In diesen mirrorlist.* Dateien können die nicht verbotenen auskommentiert werden mit #. 

