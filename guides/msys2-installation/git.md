## git Konfiguration

Methode 1

Wir nutzen das git unter msys und haben ein Problem mit den ssh credentials.

Workaround

`$ eval $(ssh-agent -s)
Agent pid 6276

$ ssh-add ~/.ssh/id_rsa
Identity added: /c/Users/pauljohn32/.ssh/id_rsa`

Methode 2

Wir deinstallieren das msys2 git mit `pacman -R git`

und installieren Git for Windows.
Download hier: https://git-scm.com/download/win

Die Checkbox für "assozieren der Files mit git bash" wird abgewählt
sonst bei der Installation die Defaults nutzen.

Ab jetzt kann die git exe in der IDE mit ssh ohne Passwort abfragen genuttz werden
