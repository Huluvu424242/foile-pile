# Dynamische Bindung - in Common Lisp

```
(defvar x -9)      ; x deklariert und auf -9 gesetzt
     
(defun addx ()
   (setq x (1+ x)))  ; return x+1 wobei x zum Aufrufzeitpunkt der Funktion gilt
     
(let ((x 1))
  (addx) ; bezogen auf x aus let mit initial Wert 1
  (addx) ; bezogen auf x aus let bereits auf 2 erhöht
)

⇒ 3 
       
(addx)
    
⇒ -8
```