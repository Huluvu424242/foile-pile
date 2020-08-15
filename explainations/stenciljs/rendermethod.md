# Stencil - render() Methode

## TSX Dateien und andere

*.tsx
: Dateien in denen Typescript und XML Sprachen vermischt werden dürfen

*.jsx
: Dateien in denen JavaScript und XML Sprachen vermischt werden düfen

*.ts
: Dateien der Sprache Typescript

*.js
: Dateien der Sprache JavaScript

## render() in tsx Dateien
Die Methode darf nur einen root Node zurückgeben.

```typescript tsx
render(){
    return (
        <h1>Mein Titel</h1>
    );
}
```
Mehrere root Node lassen sich als Array zurück geben.
```typescript tsx
render(){
    return [
        <h1>Mein Titel</h1>,
        <p>Mein Titel</p>
    ];
}
```
