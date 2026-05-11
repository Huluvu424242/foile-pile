# Konzept - Dynamic Typing

In der browser Console zeilenweise eingeben (ohne Kommentare) und jede Zeile mit Enter bestätigen:
```
var test; // -> undefined
test=1; 
typeof(test); // -> number
test='#';
typeof(test); // -> string
test = true;
typeof(test) // -> boolean
test = [];
typeof(test) // -> object
test = {};
typeof(test) // -> object
test = function(){ return 3; };
typeof(test) // -> function
```