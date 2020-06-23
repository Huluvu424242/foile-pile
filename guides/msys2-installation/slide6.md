# System konfigurieren

## git für IDEs konfigurieren

Die bisherige Konfiguration lässt es noch nicht zu, 
dass IDEs wie Webstorm unter msys2 installierte Programme
wie git finden. 

Damit auch ein git pull in Webstorm in einem per ssh ausgecheckten 
Projekt funktioniert, müssen wir noch den Windows Path erweitern.

Folgende Windows Umgebungsvariablen sind anzulegen:

`MSYS2_HOME mit Wert c:\msys64`

Und die systemweite PATH Variable ist zu erweitern um:

`PATH=%PATH%;%MSYS2_HOME%\usr\bin`

In der IDE können dann als Programme genutzt werden:
GIT: C:\msys64\usr\bin\git.exe
TERMINAL:  C:\msys64\usr\bin\bash.exe