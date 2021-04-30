# Tag Referenzen

## Zum Host Element

Das Host Element ist der Tag welcher durch die Webkomponente realisiert wird. 

```javascript
@Element() hostElement: HTMLElement;
```

## Zu einem Input Element

Stencil bietet für jedes Tag ein *ref* Attribut an. Diesem kann eine Funktion zugewiesen werdne welche ein HTMLElement entgegen nimmt.
Das ist die Referenz auf das aktuelle Tag. Diese kann in einer Variablen abgelegt werden. 
Es folgt ein Beispiel

```javascript
textInputElement: HTMLInputElement;

render(){
  return(
    <input type="text" ref={(el) => this.textInputElement = el as HTMLInputElement}/>
  );
}
```
