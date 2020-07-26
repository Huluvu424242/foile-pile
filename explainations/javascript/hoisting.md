# Begriffe - Hoisting

Quelle: https://developer.mozilla.org/de/docs/Glossary/Hoisting


Öffnen Sie den Chrome, drücken Sie F12 und geben sie folgenden Text in die Console ein:
```
x = 1
console.log(x + ' # ' + y );
var x,y =2; 
```

Das Ergebnis ist: 1 # undefined

