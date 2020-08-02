# Statische Bindung - JavaScript
var x = -9;

function addx() {
    console.log(">" + (x + 1));
    return x + 1;
}

function test() {
    var x = 1;
    addx();
    addx();
}

console.log("#" + x);
test();
console.log("#" + x);