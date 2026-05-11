# Bidirektionales Binding

Muss selbst implementiert werden!

```javascript
@State() newUmgebung: string;

onNewUmgebungChanged(event: Event) {
  this.newUmgebung = (event.target as HTMLInputElement).value;
}

<input type='text' value={this.newUmgebung}
           required={true}
           onInput={this.onNewUmgebungChanged.bind(this)}/>
```

Über das **value** Attribute wird das input Feld initialisiert.

Über **onNewUmgebungChanged** wird der im Input Feld geänderte Wert in die Zustandsvariable zurückgeschrieben. 

Das **this** in onNewUmgebungChanged(event: Event) würde sich auf das aufrufende Tag beziehen. 
Wenn das wie hier nicht gewollt ist, muss mit bind z.B. das this als Referenz auf die umgebende Klasse zugewiesen werden. 
