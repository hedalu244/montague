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
    freeVariables() {
        return [this];
    }
    replace(search, replacer) {
        if (this.name === search.name)
            return replacer;
        else
            return this;
    }
    reduction() {
        return this;
    }
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
    freeVariables() {
        return [];
    }
    replace(search, replacer) {
        return this;
    }
    reduction() {
        return this;
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
    freeVariables() {
        return this.formula.freeVariables();
    }
    replace(search, replacer) {
        return new Not(this.formula.replace(search, replacer));
    }
    reduction() {
        return new Not(this.formula);
    }
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
    freeVariables() {
        return [...this.formula0.freeVariables(), ...this.formula1.freeVariables()];
    }
    replace(search, replacer) {
        return new And(this.formula0.replace(search, replacer), this.formula1.replace(search, replacer));
    }
    reduction() {
        return new And(this.formula0, this.formula1);
    }
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
    freeVariables() {
        return [...this.formula0.freeVariables(), ...this.formula1.freeVariables()];
    }
    replace(search, replacer) {
        return new Or(this.formula0.replace(search, replacer), this.formula1.replace(search, replacer));
    }
    reduction() {
        return new Or(this.formula0, this.formula1);
    }
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
    freeVariables() {
        return [...this.formula0.freeVariables(), ...this.formula1.freeVariables()];
    }
    replace(search, replacer) {
        return new If(this.formula0.replace(search, replacer), this.formula1.replace(search, replacer));
    }
    reduction() {
        return new If(this.formula0, this.formula1);
    }
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
    freeVariables() {
        return [...this.formula0.freeVariables(), ...this.formula1.freeVariables()];
    }
    replace(search, replacer) {
        return new Iff(this.formula0.replace(search, replacer), this.formula1.replace(search, replacer));
    }
    reduction() {
        return new Iff(this.formula0, this.formula1);
    }
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
    freeVariables() {
        return this.formula.freeVariables().filter(x => x.name !== this.variable.name);
    }
    replace(search, replacer) {
        // 置き換えたいののなかの自由出現と束縛変数の名前が衝突してたら
        if (replacer.freeVariables().some(x => x.name === this.variable.name)) {
            //衝突しない名前を模索して
            let alt = "_" + this.variable.name;
            while (replacer.freeVariables().some(x => x.name === this.variable.name))
                alt = "_" + alt;
            //置き換える
            return new Exist(new Variable(alt, this.variable.type), this.formula.replace(this.variable, new Variable(alt, this.variable.type)).replace(search, replacer));
        }
        //問題なければそのまま再帰
        return new Exist(this.variable, this.formula.replace(search, replacer));
    }
    reduction() {
        return new Exist(this.variable, this.formula);
    }
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
    freeVariables() {
        return this.formula.freeVariables().filter(x => x.name !== this.variable.name);
    }
    replace(search, replacer) {
        // 置き換えたいののなかの自由出現と束縛変数の名前が衝突してたら
        if (replacer.freeVariables().some(x => x.name === this.variable.name)) {
            //衝突しない名前を模索して
            let alt = "_" + this.variable.name;
            while (replacer.freeVariables().some(x => x.name === this.variable.name))
                alt = "_" + alt;
            //置き換える
            return new All(new Variable(alt, this.variable.type), this.formula.replace(this.variable, new Variable(alt, this.variable.type)).replace(search, replacer));
        }
        //問題なければそのまま再帰
        return new All(this.variable, this.formula.replace(search, replacer));
    }
    reduction() {
        return new All(this.variable, this.formula);
    }
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
        return new Truth(equals(this.formula0.valuation(m, w, g), this.formula0.valuation(m, w, g)));
    }
    freeVariables() {
        return [...this.formula0.freeVariables(), ...this.formula1.freeVariables()];
    }
    replace(search, replacer) {
        return new Equal(this.formula0.replace(search, replacer), this.formula1.replace(search, replacer));
    }
    reduction() {
        return new Equal(this.formula0, this.formula1);
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
    freeVariables() {
        return this.formula.freeVariables();
    }
    replace(search, replacer) {
        return new Must(this.formula.replace(search, replacer));
    }
    reduction() {
        return new Must(this.formula);
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
    freeVariables() {
        return this.formula.freeVariables();
    }
    replace(search, replacer) {
        return new May(this.formula.replace(search, replacer));
    }
    reduction() {
        return new May(this.formula);
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
    freeVariables() {
        return this.formula.freeVariables();
    }
    replace(search, replacer) {
        return new Up(this.formula.replace(search, replacer), this.type);
    }
    reduction() {
        return new Up(this.formula, this.type);
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
    freeVariables() {
        return this.formula.freeVariables();
    }
    replace(search, replacer) {
        return new Down(this.formula.replace(search, replacer), this.type);
    }
    reduction() {
        // 簡約して、アップになったら消す
        let formula = this.formula.reduction();
        if (formula instanceof Up)
            return formula.formula;
        return new Down(formula, this.type);
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
    freeVariables() {
        return this.formula.freeVariables().filter(x => x.name !== this.variable.name);
    }
    replace(search, replacer) {
        // 置き換えたいののなかの自由出現と束縛変数の名前が衝突してたら
        if (replacer.freeVariables().some(x => x.name === this.variable.name)) {
            //衝突しない名前を模索して
            let alt = "_" + this.variable.name;
            while (replacer.freeVariables().some(x => x.name === this.variable.name))
                alt = "_" + alt;
            //置き換える
            return new Lambda(new Variable(alt, this.variable.type), this.formula.replace(this.variable, new Variable(alt, this.variable.type)).replace(search, replacer), this.type);
        }
        //問題なければそのまま再帰
        return new Lambda(this.variable, this.formula.replace(search, replacer), this.type);
    }
    reduction() {
        return new Lambda(this.variable, this.formula, this.type);
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
    freeVariables() {
        return [...this.formula0.freeVariables(), ...this.formula1.freeVariables()];
    }
    replace(search, replacer) {
        return new Apply(this.formula0.replace(search, replacer), this.formula1.replace(search, replacer), this.type);
    }
    reduction() {
        // 関数側を簡約して、ラムダになったら置き換えして、また簡約
        let formula0 = this.formula0.reduction();
        if (formula0 instanceof Lambda)
            return formula0.formula.replace(formula0.variable, this.formula1).reduction();
        return new Apply(formula0, this.formula1.reduction(), this.type);
    }
    toString() {
        return this.formula0.toString() + "(" + this.formula1.toString() + ")";
    }
    ;
}
function equals(a, b) {
    if (a.type === "t")
        return b.type === "t" && a.value === b.value;
    if (a.type === "e")
        return b.type === "e" && a.id === b.id;
    if (a.type === "s")
        return b.type === "s" && a.id === b.id;
    if (b.type === "t" || b.type === "e" || b.type === "s")
        return false;
    throw new Error("関数同士の比較は未対応（モデルを見なきゃいけないので面倒）");
    //return m.interpretationDomain(a.type[0]).every(x => equals(m, apply(a, x), apply(b, x)));
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
        return table.map(t => new ComplexValue(type, (x) => t[aa.findIndex(y => equals(x, y))]));
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
    translate() {
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
    translate() {
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
    translate() {
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
    translate() {
        //α (↑δ)
        return new Apply(this.subject.translate(), new Up(this.intransitive.translate(), ["s", ["e", "t"]]), "t");
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
    translate() {
        //δ (↑β)
        return new Apply(this.transitive.translate(), new Up(this.object.translate(), ["s", [["s", ["e", "t"]], "t"]]), ["e", "t"]);
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
    translate() {
        // λX ∀x (commonNoun.translate(x)⇒↓X(x))
        return new Lambda(new Variable("X", ["s", ["e", "t"]]), new All(new Variable("x", "e"), new If(new Apply(this.commonNoun.translate(), new Variable("x", "e"), "t"), new Apply(new Down(new Variable("X", ["s", ["e", "t"]]), ["e", "t"]), new Variable("x", "e"), "t"))), [["s", ["e", "t"]], "t"]);
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
const hashiru = new Intransitive("走る", new Constant("RUN", ["e", "t"], (w => new ComplexValue(["e", "t"], (e) => new Truth(equals(e, j))))));
const JohnGaHashiru = new SubjectIntransitive(john, hashiru);
console.log(">JohnGaHashiru.toString()");
console.log(JohnGaHashiru.toString()); //ジョンが走る
console.log(">JohnGaHashiru.translate().toString()");
console.log(JohnGaHashiru.translate().toString()); // λX.↓X(j)(↑RUN)
console.log(">JohnGaHashiru.translate().reduction().toString()");
console.log(JohnGaHashiru.translate().reduction().toString()); // λX.↓X(j)(↑RUN)
console.log(">JohnGaHashiru.translate().valuation(model, w0, g))");
console.log(JohnGaHashiru.translate().valuation(model, w0, g)); // Truth {type: "t", value: true}
