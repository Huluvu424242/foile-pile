# JavaScript - Coercion Tricks

Ich finde die Tricks nicht unbedingt gut aber
im JavaScript Umfeld werden diese benutzt als wäre es das normalste auf der Welt.

Als ich den Trick mit var a = !! b;  zum ersten Mal im Kode gelesen habe, dachte ich ich spinne.
Einfach mal Rechenzeit verschwendet oder was soll das?
Nein das hat einen Grund: Typeumwandlung!!!

Tipp 1
```javascript
// convert2boolean
var a = !! 'true';
typeof(a);
//-> "boolean"
```
Tipp 2
```javascript
// konvert2string
var a =  b +'';
typeof(a);
//-> "string"
```
Tipp 3
```javascript
// default parameter value
var a =  b || 'Default Wert';
```
Tipp 4
```javascript
// konvert2string
var a =  +'7';
typeof(a);
//-> "number"
a = + 'j';
typeof(a);
//-> "number"
a
// -> NaN
```


 
