# Windows PATH verfügbar machen

Nach der Installation findet die bash nur Programme 
aus dem msys2 Universum und keine aus dem 
Windows PATH.

## MSYS2_PATH setzen

Eine einfache Lösung besteht darin, in der Datei `msys2.ini`
folgenden Eintrag aufzunehmen oder zu aktivieren. 

`MSYS2_PATH_TYPE=inherit`