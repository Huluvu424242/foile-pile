# JavaScript - Coercion Tricks

Ich finde die Tricks nicht unbedingt gut aber
im JavaScript Umfeld werden diese benutzt als wäre es das normalste auf der Welt.

Als ich den Trick mit var a = !! b;  zum ersten Mal im Kode gelesen habe, dachte ich ich spinne.
Einfach mal Rechenzeit verschwendet oder was soll das?
Nein das hat einen Grund: Typeumwandlung!!!

```
var a = !! 'true';
typeof(a);
-> "boolean"
```
oder 
```
var a =  b || 'Namenlos';
```


 