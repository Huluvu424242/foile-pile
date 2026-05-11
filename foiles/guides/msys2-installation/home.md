# Homeverzeichnis setzen

## HOME setzen

Windows Umgebungsvariablen (oberer Bereich = User Variablen)
> (Dieser PC/Eigenschaften/Umgebungsvariablen/)

Dort den Eintrag `%HOME%=%USERPROFILE%` vornehmen

Das bewirkt:

* Das die bash im `%USERPROFILE%` Verzeichnis startet
* ls ~ die Dateien des `%USERPROFILE%` Verzeichnisses anzeigt

## Alternative Methode 
Unter <installdir>\etc\ die Datei bash.bashrc editieren (C:\msys64\etc\bash.bashrc)
Hier in der letzten Zeile folgenden Eintrag einfügen:
`HOME=/c/Users/$USER`
Das bewirkt:

* Das `c:\Users\$USER` als Homeverzeichnis verwendet wird
* Damit liefert `ls -Flarc ~` auch die Dateien aus diesem Verzeichnis
* Die bash startet aber nicht im `%USERPROFILE%` Verzeichnis 

 
  
## Weitere Konfigurationen siehe: 

* https://www.rjh.io/blog/20190722-msys2_setup/
 