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
    constructor(formula) {
        this.sort = "￢";
        this.type = "t";
        this.formula = formula;
    }
    ;
    valuation(m, w, g) {
        return new Truth(!this.formula.valuation(m, w, g).value);
    }
    ;
    toString() {
        return "￢" + this.formula.toString();
    }
}
class And {
    constructor(formula0, formula1) {
        this.sort = "∧";
        this.type = "t";
        this.formula0 = formula0;
        this.formula1 = formula1;
    }
    ;
    valuation(m, w, g) {
        return new Truth(this.formula0.valuation(m, w, g).value && this.formula1.valuation(m, w, g).value);
    }
    ;
    toString() {
        return this.formula0.toString() + "∧" + this.formula1.toString();
    }
    ;
}
class Or {
    constructor(formula0, formula1) {
        this.sort = "∨";
        this.type = "t";
        this.formula0 = formula0;
        this.formula1 = formula1;
    }
    ;
    valuation(m, w, g) {
        return new Truth(this.formula0.valuation(m, w, g).value || this.formula1.valuation(m, w, g).value);
    }
    ;
    toString() {
        return this.formula0.toString() + "∨" + this.formula1.toString();
    }
    ;
}
class If {
    constructor(formula0, formula1) {
        this.sort = "⇒";
        this.type = "t";
        this.formula0 = formula0;
        this.formula1 = formula1;
    }
    ;
    valuation(m, w, g) {
        return new Truth(!this.formula0.valuation(m, w, g).value || this.formula1.valuation(m, w, g).value);
    }
    ;
    toString() {
        return this.formula0.toString() + "⇒" + this.formula1.toString();
    }
    ;
}
class Iff {
    constructor(formula0, formula1) {
        this.sort = "⇔";
        this.type = "t";
        this.formula0 = formula0;
        this.formula1 = formula1;
    }
    ;
    valuation(m, w, g) {
        return new Truth(this.formula0.valuation(m, w, g).value == this.formula1.valuation(m, w, g).value);
    }
    ;
    toString() {
        return this.formula0.toString() + "⇔" + this.formula1.toString();
    }
    ;
}
class Exist {
    constructor(variable, formula) {
        this.sort = "∃";
        this.type = "t";
        this.variable = variable;
        this.formula = formula;
    }
    ;
    valuation(m, w, g) {
        return new Truth(m.interpretationDomain(this.variable.type).some(value => this.formula.valuation(m, w, assign(g, this.variable, value)).value));
    }
    ;
    toString() {
        return "∃" + this.variable.toString() + "." + this.formula.toString();
    }
    ;
}
class All {
    constructor(variable, formula) {
        this.sort = "∀";
        this.type = "t";
        this.variable = variable;
        this.formula = formula;
    }
    ;
    valuation(m, w, g) {
        return new Truth(m.interpretationDomain(this.variable.type).every(value => this.formula.valuation(m, w, assign(g, this.variable, value)).value));
    }
    ;
    toString() {
        return "∀" + this.variable.toString() + "." + this.formula.toString();
    }
    ;
}
class Equal {
    constructor(formula0, formula1) {
        this.sort = "＝";
        this.type = "t";
        this.formula0 = formula0;
        this.formula1 = formula1;
    }
    ;
    valuation(m, w, g) {
        return new Truth(equals(m, this.formula0.valuation(m, w, g), this.formula0.valuation(m, w, g)));
    }
    toString() {
        return this.formula0.toString() + "＝" + this.formula1.toString();
    }
    ;
}
class Must {
    constructor(formula) {
        this.sort = "□";
        this.type = "t";
        this.formula = formula;
    }
    valuation(m, w, g) {
        return new Truth(m.worlds.every(_w => this.formula.valuation(m, _w, g).value));
    }
    toString() {
        return "□" + this.formula.toString();
    }
    ;
}
class May {
    constructor(formula) {
        this.sort = "◇";
        this.type = "t";
        this.formula = formula;
    }
    valuation(m, w, g) {
        return new Truth(m.worlds.some(_w => this.formula.valuation(m, _w, g).value));
    }
    toString() {
        return "◇" + this.formula.toString();
    }
    ;
}
class Up {
    constructor(formula, type) {
        this.sort = "↑";
        this.type = type;
        this.formula = formula;
    }
    valuation(m, w, g) {
        return new ComplexValue(this.type, _w => this.formula.valuation(m, _w, g));
    }
    toString() {
        return "↑" + this.formula.toString();
    }
    ;
}
class Down {
    constructor(formula, type) {
        this.sort = "↓";
        this.type = type;
        this.formula = formula;
    }
    valuation(m, w, g) {
        return apply(this.formula.valuation(m, w, g), w);
    }
    toString() {
        return "↓" + this.formula.toString();
    }
    ;
}
class Lambda {
    constructor(variable, formula, type) {
        this.sort = "λ";
        this.variable = variable;
        this.type = type;
        this.formula = formula;
    }
    ;
    valuation(m, w, g) {
        return new ComplexValue(this.type, d => this.formula.valuation(m, w, assign(g, this.variable, d)));
    }
    toString() {
        return "λ" + this.variable.toString() + "." + this.formula.toString();
    }
    ;
}
class Apply {
    constructor(formula0, formula1, type) {
        this.sort = "apply";
        this.formula0 = formula0;
        this.formula1 = formula1;
        this.type = type;
    }
    valuation(m, w, g) {
        return apply(this.formula0.valuation(m, w, g), (this.formula1.valuation(m, w, g)));
    }
    toString() {
        return this.formula0.toString() + "(" + this.formula1.toString() + ")";
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
        this.categoly = "T";
        this.literal = literal;
        this.constant = constant;
    }
    transrate() {
        // λX.(↓X)(constant)
        return new Lambda(new Variable("X", ["s", ["e", "t"]]), new Apply(new Down(new Variable("X", ["s", ["e", "t"]]), ["e", "t"]), this.constant, "t"), [["s", ["e", "t"]], "t"]);
    }
    toString() {
        return this.literal;
    }
}
class CommonNoun {
    constructor(literal, constant) {
        this.categoly = "CN";
        this.literal = literal;
        this.constant = constant;
    }
    transrate() {
        return this.constant;
    }
    toString() {
        return this.literal;
    }
}
class Intransitive {
    constructor(literal, constant) {
        this.categoly = "IV";
        this.literal = literal;
        this.constant = constant;
    }
    transrate() {
        return this.constant;
    }
    toString() {
        return this.literal;
    }
}
//T_gaは面倒なので省略
class SubjectIntransitive {
    constructor(subject, intransitive) {
        this.categoly = "t";
        this.subject = subject;
        this.intransitive = intransitive;
    }
    transrate() {
        //α (↑δ)
        return new Apply(this.subject.transrate(), new Up(this.intransitive.transrate(), ["s", ["e", "t"]]), "t");
    }
    toString() {
        return this.subject.toString() + "が" + this.intransitive.toString();
    }
}
//T_oは省略
class ObjectTransitive {
    constructor(object, transitive) {
        this.categoly = "IV";
        this.object = object;
        this.transitive = transitive;
    }
    transrate() {
        //δ (↑β)
        return new Apply(this.transitive.transrate(), new Up(this.object.transrate(), ["s", [["s", ["e", "t"]], "t"]]), ["e", "t"]);
    }
    toString() {
        return this.object.toString() + "を" + this.transitive.toString();
    }
}
class Every {
    constructor(literal, commonNoun) {
        this.categoly = "T";
        this.commonNoun = commonNoun;
    }
    transrate() {
        // λX ∀x (commonNoun.transrate(x)⇒↓X(x))
        return new Lambda(new Variable("X", ["s", ["e", "t"]]), new All(new Variable("x", "e"), new If(new Apply(this.commonNoun.transrate(), new Variable("x", "e"), "t"), new Apply(new Down(new Variable("X", ["s", ["e", "t"]]), ["e", "t"]), new Variable("x", "e"), "t"))), [["s", ["e", "t"]], "t"]);
    }
    toString() {
        return "すべての" + this.commonNoun.toString();
    }
}
const j = new Entity("j");
const m = new Entity("g");
const w0 = new Situation("w0");
//適当な割り当て
const g = (v) => model.interpretationDomain(v.type)[0];
const model = new Model([j, m], [new Situation("w0")]);
const john = new ProperNoun("ジョン", new Constant("j", "e", w => j));
const hashiru = new Intransitive("走る", new Constant("RUN", ["e", "t"], (w => new ComplexValue(["e", "t"], (e) => new Truth(equals(model, e, j))))));
const JohnGaHashiru = new SubjectIntransitive(john, hashiru);
console.log(JohnGaHashiru.toString()); //ジョンが走る
console.log(JohnGaHashiru.transrate().toString()); // λX.↓X(j)(↑RUN)
console.log(JohnGaHashiru.transrate().valuation(model, w0, g)); // Truth {type: "t", value: true}
