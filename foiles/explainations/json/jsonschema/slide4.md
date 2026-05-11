# JSON 

Steht für JavaScript Object Notation

JSON Schema
• Validierung von Instanzen
• Erzeugung von Mock Daten aus Schema
• Erzeugung von Schema aus Instanzen

Was kann per JSON Schema überprüft werden:
• Nur die Payload der Requests oder der Response kann geprüft werden
• Folgenden Eigenschaften der Payload sind prüfbar:
   • Struktur (Attributnamen)
   • Datentypen (JavaScript typen + Länge, format und andere Zusätze)
Was fehlt dabei für CDC (Unterschied zu PACT):
• Die API selbst (Endpointname (Methodenname), Operation (PUT, GET, ...) 
• Zustand der API 