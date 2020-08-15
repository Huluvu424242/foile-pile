# Stencil - @State

## Benutzung

@State
: Attribute welche nicht als Properties oder Argumente der Webkomponente dienen sollen
: sondern nur einen Zustand der Komponente halten, werden mit @State annotiert

## Verhalten

Ändert sich der Wert eines mit @State annotierten Attributes, wird die View der 
Webkomponente neu gerendert. 

Ausnahme
: Wird ein Array geändert z.B. durch push so wird die View nicht neu gerendert.
: Mann muss ein neues Array erzeugen und dieses dem Attribut zuweisen.
