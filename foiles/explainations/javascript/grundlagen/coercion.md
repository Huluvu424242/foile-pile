# JavaScript - Coercion

Coercion heißt Zwang. 
JavaScript versucht bei Operationen verschiedene Datentypen
auf einen Datentypen zu bringen. 
Das kann zu unerwarteten Ergebnissen führen. 

```
console.log(3+4);
-> 7 
```
aber
```
console.log(3+"4");
-> 34
```
und dann auch noch 
```
console.log(7+3+"4");
-> 104 
```

Die Regeln dazu gibts hier:
[https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Operators/Operator_Precedence](https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Operators/Operator_Precedence)