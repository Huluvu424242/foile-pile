# JSON 

## Begriff
~ steht für Javascript Object Notation

## JSON Syntax als Schienendiagramm
[![Syntaxdiagram](img/jsonsyntax.svg)](img/jsonsyntax.svg)

Datentypen für value
* string
* number
* boolean

Kommentare im JSON sind nicht erlaubt

## Diagrammbeschreibung für [1]
~~~lisp 
 Diagram(
   Choice(0,
     Sequence( Terminal('{'),     
               ZeroOrMore(Sequence(NonTerminal('string'),
                                  Terminal(':'),
                                  NonTerminal('value'))
                         ,','),
               Terminal('}')
     ),  
     Sequence(Terminal('['),
              ZeroOrMore( NonTerminal('value'),','),
              Terminal(']'),
     )
   )
 )
~~~ 

[1] `https://tabatkins.github.io/railroad-diagrams/generator.html#Diagram(%0A%20%20Optional('%2B'%2C%20'skip')%2C%0A%20%20Choice(0%2C%0A%20%20%20%20NonTerminal('name-start%20char')%2C%0A%20%20%20%20NonTerminal('escape'))%2C%0A%20%20ZeroOrMore(%0A%20%20%20%20Choice(0%2C%0A%20%20%20%20%20%20NonTerminal('name%20char')%2C%0A%20%20%20%20%20%20NonTerminal('escape')))))`

   