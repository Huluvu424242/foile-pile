# Scope - global, function, block

Der Sichtbarkeitsbereich (Scope) von Variablen ist der Bereich in dem eine Variable definiert ist.

Quelle: 
* https://dev.to/sandy8111112004/javascript-introduction-to-scope-function-scope-block-scope-d11

Folgendes Listing funktioniert in der Browser Console.
(Nicht funktionierende Teile  wurden auskommentiert)
```
var a = function(){
    global = "Ich lebe im globalen Scope";
    var func1 = "Ich lebe im Scope der Funktion a";
    if( true ) {
      var func2 = "Ich lebe auch im Scope der Funktion a";
      const block1 = "Ich lebe nur im if Block";
      let block2 = "Ich lebe auch nur im if Block";
      console.log("b"+global);
      console.log("b"+func1);
      console.log("b"+func2);
      console.log("b"+block1);
      console.log("b"+block2);
    }
    console.log("f"+global);
    console.log("f"+func1);
    console.log("f"+func2);
    //console.log("f"+block1);
    //console.log("f"+block2);
}
a();
console.log("g"+global);
//console.log("g"+func1);
//console.log("g"+func2);
//console.log("g"+block1);
//console.log("g"+block2);
```
Folgende Ausgabe wird erzeugt
```
bIch lebe im globalen Scope
bIch lebe im Scope der Funktion a
bIch lebe auch im Scope der Funktion a
bIch lebe nur im if Block
bIch lebe auch nur im if Block
fIch lebe im globalen Scope
fIch lebe im Scope der Funktion a
fIch lebe auch im Scope der Funktion a
gIch lebe im globalen Scope
undefined // Returnwert der Funktionsdeklaration von a 
```
