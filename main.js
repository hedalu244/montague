"use strict";
class Truth {
    constructor(value) {
        this.type = "t";
        this.value = value;
    }
}
;
class Entity {
    constructor(id) {
        this.type = "e";
        this.id = id;
    }
}
;
class Situation {
    constructor(id) {
        this.type = "s";
        this.id = id;
    }
}
;
class ComplexValue {
    constructor(type, value) {
        this.type = type;
        this.value = value;
    }
}
class Variable {
    constructor(name, type) {
        this.sort = "variable";
        this.name = name;
        this.type = type;
    }
    ;
    valuation(m, w, g) {
        return g(this);
    }
    ;
    toString() {
        return this.name;
    }
    ;
}
class Constant {
    constructor(name, type, interpretation) {
        this.sort = "constant";
        this.name = name;
        this.type = type;
        this.interpretation = interpretation;
    }
    ;
    valuation(m, w, g) {
        return this.interpretation(w);
    }
    toString() {
        return this.name;
    }
    ;
}
class Not {
    constructor(expr) {
        this.sort = "￢";
        this.type = "t";
        this.expr = expr;
    }
    ;
    valuation(m, w, g) {
        return new Truth(!this.expr.valuation(m, w, g).value);
    }
    ;
    toString() {
        return "￢" + this.expr.toString();
    }
}
class And {
    constructor(left, right) {
        this.sort = "∧";
        this.type = "t";
        this.left = left;
        this.right = right;
    }
    ;
    valuation(m, w, g) {
        return new Truth(this.left.valuation(m, w, g).value && this.right.valuation(m, w, g).value);
    }
    ;
    toString() {
        return this.left.toString() + "∧" + this.right.toString();
    }
    ;
}
class Or {
    constructor(left, right) {
        this.sort = "∨";
        this.type = "t";
        this.left = left;
        this.right = right;
    }
    ;
    valuation(m, w, g) {
        return new Truth(this.left.valuation(m, w, g).value || this.right.valuation(m, w, g).value);
    }
    ;
    toString() {
        return this.left.toString() + "∨" + this.right.toString();
    }
    ;
}
class If {
    constructor(left, right) {
        this.sort = "⇒";
        this.type = "t";
        this.left = left;
        this.right = right;
    }
    ;
    valuation(m, w, g) {
        return new Truth(!this.left.valuation(m, w, g).value || this.right.valuation(m, w, g).value);
    }
    ;
    toString() {
        return this.left.toString() + "⇒" + this.right.toString();
    }
    ;
}
class Iff {
    constructor(left, right) {
        this.sort = "⇔";
        this.type = "t";
        this.left = left;
        this.right = right;
    }
    ;
    valuation(m, w, g) {
        return new Truth(this.left.valuation(m, w, g).value == this.right.valuation(m, w, g).value);
    }
    ;
    toString() {
        return this.left.toString() + "⇔" + this.right.toString();
    }
    ;
}
class Exist {
    constructor(variable, expr) {
        this.sort = "∃";
        this.type = "t";
        this.variable = variable;
        this.expr = expr;
    }
    ;
    valuation(m, w, g) {
        return new Truth(m.interpretationDomain(this.variable.type).some(value => this.expr.valuation(m, w, assign(g, this.variable, value)).value));
    }
    ;
    toString() {
        return "∃" + this.variable.toString() + "." + this.expr.toString();
    }
    ;
}
class All {
    constructor(variable, expr) {
        this.sort = "∀";
        this.type = "t";
        this.variable = variable;
        this.expr = expr;
    }
    ;
    valuation(m, w, g) {
        return new Truth(m.interpretationDomain(this.variable.type).every(value => this.expr.valuation(m, w, assign(g, this.variable, value)).value));
    }
    ;
    toString() {
        return "∀" + this.variable.toString() + "." + this.expr.toString();
    }
    ;
}
class Equal {
    constructor(left, right) {
        this.sort = "＝";
        this.type = "t";
        this.left = left;
        this.right = right;
    }
    ;
    valuation(m, w, g) {
        return new Truth(equals(m, this.left.valuation(m, w, g), this.left.valuation(m, w, g)));
    }
    toString() {
        return this.left.toString() + "＝" + this.right.toString();
    }
    ;
}
class Must {
    constructor(expr) {
        this.sort = "□";
        this.type = "t";
        this.expr = expr;
    }
    valuation(m, w, g) {
        return new Truth(m.worlds.every(_w => this.expr.valuation(m, _w, g).value));
    }
    toString() {
        return "□" + this.expr.toString();
    }
    ;
}
class May {
    constructor(expr) {
        this.sort = "◇";
        this.type = "t";
        this.expr = expr;
    }
    valuation(m, w, g) {
        return new Truth(m.worlds.some(_w => this.expr.valuation(m, _w, g).value));
    }
    toString() {
        return "◇" + this.expr.toString();
    }
    ;
}
class Up {
    constructor(expr, type) {
        this.sort = "↑";
        this.type = type;
        this.expr = expr;
    }
    valuation(m, w, g) {
        return new ComplexValue(this.type, _w => this.expr.valuation(m, _w, g));
    }
    toString() {
        return "↑" + this.expr.toString();
    }
    ;
}
class Down {
    constructor(expr, type) {
        this.sort = "↓";
        this.type = type;
        this.expr = expr;
    }
    valuation(m, w, g) {
        return apply(this.expr.valuation(m, w, g), w);
    }
    toString() {
        return "↓" + this.expr.toString();
    }
    ;
}
class Lambda {
    constructor(variable, expr, type) {
        this.sort = "λ";
        this.variable = variable;
        this.type = type;
        this.expr = expr;
    }
    ;
    valuation(m, w, g) {
        return new ComplexValue(this.type, d => this.expr.valuation(m, w, assign(g, this.variable, d)));
    }
    toString() {
        return "λ" + this.variable.toString() + "." + this.expr.toString();
    }
    ;
}
class Apply {
    constructor(left, right, type) {
        this.sort = "apply";
        this.left = left;
        this.right = right;
        this.type = type;
    }
    valuation(m, w, g) {
        return apply(this.left.valuation(m, w, g), (this.right.valuation(m, w, g)));
    }
    toString() {
        return this.left.toString() + "(" + this.right.toString() + ")";
    }
    ;
}
function equals(m, a, b) {
    if (a.type === "t")
        return b.type === "t" && a.value === b.value;
    if (a.type === "e")
        return b.type === "e" && a.id === b.id;
    if (a.type === "s")
        return b.type === "s" && a.id === b.id;
    if (b.type === "t" || b.type === "e" || b.type === "s")
        return false;
    return m.interpretationDomain(a.type[0]).every(x => equals(m, apply(a, x), apply(b, x)));
}
function apply(func, x) {
    return func.value(x);
}
class Model {
    constructor(domain, worlds) {
        this.domain = domain;
        this.worlds = worlds;
    }
    interpretationDomain(type) {
        if (type === "t")
            return [new Truth(true), new Truth(false)];
        if (type === "e")
            return [...this.domain];
        if (type === "s")
            return [...this.worlds];
        const aa = this.interpretationDomain(type[0]);
        const bb = this.interpretationDomain(type[1]);
        // bbのaa.lengthタプル（全組み合わせ）の配列を作る
        const table = aa.reduce((prev) => bb.map(b => prev.map(t => [b, ...t, b])).reduce((a, b) => a.concat(b), []), [[]]);
        return table.map(t => new ComplexValue(type, (x) => t[aa.findIndex(y => equals(this, x, y))]));
    }
}
// g_[x/d]
function assign(g, variable, value) {
    return v => v.name === variable.name ? value : g(v);
}
class ProperNoun {
    constructor(literal, constant) {
        this.literal = literal;
        this.constant = constant;
    }
    transrate() {
        // λX.(↓X)(constant)
        return new Lambda(new Variable("X", ["s", ["e", "t"]]), new Apply(new Down(new Variable("X", ["s", ["e", "t"]]), ["e", "t"]), this.constant, "t"), [["s", ["e", "t"]], "t"]);
    }
    toString() {
        return this.name;
    }
}
const j = new Entity("j");
const m = new Entity("g");
const w0 = new Situation("w0");
//適当な割り当て
const g = (v) => model.interpretationDomain(v.type)[0];
const model = new Model([j, m], [new Situation("w0")]);
const run = new Up(new Constant("run", ["e", "t"], (w => new ComplexValue(["e", "t"], (e) => new Truth(equals(model, e, j))))), ["s", ["e", "t"]]);
const john = new ProperNoun("john", new Constant("j", "e", w => j));
console.log(new Apply(john.transrate(), run, "t").valuation(model, w0, g));
