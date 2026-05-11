# MSYS2 Pfade zum  Windows PATH hinzufügen

Wie zunächst die Windows Programme nicht in 
der MSYS2 Shell verfügbar waren, so sind 
auch die MSYS2 Programme nicht in 
Windowsprogrammen wie `cmd` verfügbar. 

Auswirkungen hat dies beispielsweise auf IDEs und 
der Konfiguration von git und ssh. 

## MSYS2_HOME einführen

Als Lösung führen wir eine Systemumgebungsvariable MSYS2_HOME ein.

`MSYS2_HOME mit Wert c:\msys64`

Zusätzlich erweitern wir den Windows PATH um die MSYS2 Pfade.

`PATH=%PATH%;%MSYS2_HOME%\usr\bin`

## Auswirkungen

Nun lässt sich auch die MSYS2 Installation von git 
in einer IDE wie Webstorm nutzen.

> In der IDE können beispielsweise als Programme genutzt werden:
> GIT: C:\msys64\usr\bin\git.exe
> TERMINAL:  C:\msys64\usr\bin\bash.exe