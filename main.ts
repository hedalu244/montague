class Truth {
    readonly type = "t";
    readonly value: boolean;
    constructor(value: boolean) {
        this.value = value;
    }
};
class Entity {
    readonly type = "e";
    readonly id: string;
    constructor(id: string) {
        this.id = id;
    }
};
class Situation {
    readonly type = "s";
    readonly id: string;
    constructor(id: string) {
        this.id = id;
    }
};
class ComplexValue<A extends Type, B extends Type> {
    readonly type: [A, B];
    readonly value: (_: TypeValue<A>) => TypeValue<B>;
    constructor(type: [A, B], value: (_: TypeValue<A>) => TypeValue<B>) {
        this.type = type;
        this.value = value;
    }
}

type Type = "t" | "e" | "s" | [Type, Type];

type TypeValue<T extends Type> =
    T extends "t" ? Truth :
    T extends "e" ? Entity :
    T extends "s" ? Situation :
    T extends [Type, Type] ? ComplexValue<T[0], T[1]> :
    never;

type Assignment = <B extends Type>(_: Variable<B>) => TypeValue<B>;

// g_[x/d]
function assign<A extends Type>(
    g: Assignment,
    variable: Variable<A>,
    value: TypeValue<A>): Assignment {
    return v => v.name === variable.name ? value : g(v);
}

class Model {
    readonly domain: Entity[];
    readonly worlds: Situation[];
    constructor(domain: Entity[], worlds: Situation[]) {
        this.domain = domain;
        this.worlds = worlds;
    }
    interpretationDomain<A extends Type>(type: A): TypeValue<A>[] {
        if (type === "t") return [new Truth(true), new Truth(false)];
        if (type === "e") return [...this.domain];
        if (type === "s") return [...this.worlds];

        const aa: TypeValue<A[0]>[] = this.interpretationDomain(type[0]);
        const bb: TypeValue<A[1]>[] = this.interpretationDomain(type[1]);

        // bbのaa.lengthタプル（全組み合わせ）の配列を作る
        const table: TypeValue<A[1]>[][] = aa.reduce((prev: TypeValue<A[1]>[][]) => bb.map(b => prev.map(t => [b, ...t, b])).reduce((a, b) => a.concat(b), []), [[]]);

        return table.map(t => new ComplexValue(type, (x: TypeValue<A[0]>): TypeValue<A[1]> => t[aa.findIndex(y => equals(x, y))]));
    }
}

interface Formula<A extends Type> {
    type: Type;
    valuation(m: Model, w: Situation, g: Assignment): TypeValue<A>;
    // 自由変数の列挙
    freeVariables(): Variable<Type>[];
    // 指定の変数を探して指定の置き換え式を代入する
    replace<B extends Type>(search: Variable<B>, replacer: Formula<B>): Formula<A>;
    // λ簡約、↓↑打ち消し
    reduction(): Formula<A>;
}

class Variable<A extends Type> implements Formula<A> {
    readonly sort = "variable";
    readonly name: string;
    readonly type: A;
    constructor(name: string, type: A) {
        this.name = name;
        this.type = type;
    };
    valuation(m: Model, w: Situation, g: Assignment): TypeValue<A> {
        return g(this);
    };
    freeVariables(): Variable<Type>[] {
        return [this];
    }
    replace<B extends Type>(search: Variable<B>, replacer: Formula<B>): Formula<A> {
        if (this.name === search.name) return replacer;
        else return this;
    }
    reduction(): Formula<A> {
        return this;
    }
    toString() {
        return this.name;
    };
}
class Constant<A extends Type> implements Formula<A> {
    readonly sort = "constant";
    readonly name: string;
    readonly type: A;
    interpretation: (w: Situation) => TypeValue<A>;
    constructor(name: string, type: A, interpretation: (w: Situation) => TypeValue<A>) {
        this.name = name;
        this.type = type;
        this.interpretation = interpretation;
    };
    valuation(m: Model, w: Situation, g: Assignment): TypeValue<A> {
        return this.interpretation(w);
    }
    freeVariables(): Variable<Type>[] {
        return [];
    }
    replace<B extends Type>(search: Variable<B>, replacer: Formula<B>): Formula<A> {
        return this;
    }
    reduction(): Formula<A> {
        return this;
    }
    toString() {
        return this.name;
    };
}
class Not implements Formula<"t"> {
    readonly sort = "￢";
    readonly type = "t";
    readonly formula: Formula<"t">;
    constructor(formula: Formula<"t">) {
        this.formula = formula;
    };
    valuation(m: Model, w: Situation, g: Assignment): Truth {
        return new Truth(!this.formula.valuation(m, w, g).value);
    };
    freeVariables(): Variable<Type>[] {
        return this.formula.freeVariables();
    }
    replace<A extends Type>(search: Variable<A>, replacer: Formula<A>): Formula<"t"> {
        return new Not(this.formula.replace(search, replacer));
    }
    reduction(): Formula<"t"> {
        return new Not(this.formula);
    }
    toString() {
        return "￢" + this.formula.toString();
    }
}
class And implements Formula<"t"> {
    readonly sort = "∧";
    readonly type = "t";
    readonly formula0: Formula<"t">;
    readonly formula1: Formula<"t">;
    constructor(formula0: Formula<"t">, formula1: Formula<"t">) {
        this.formula0 = formula0;
        this.formula1 = formula1;
    };
    valuation(m: Model, w: Situation, g: Assignment): Truth {
        return new Truth(this.formula0.valuation(m, w, g).value && this.formula1.valuation(m, w, g).value);
    };
    freeVariables(): Variable<Type>[] {
        return [...this.formula0.freeVariables(), ...this.formula1.freeVariables()];
    }
    replace<A extends Type>(search: Variable<A>, replacer: Formula<A>): Formula<"t"> {
        return new And(this.formula0.replace(search, replacer), this.formula1.replace(search, replacer));
    }
    reduction(): Formula<"t"> {
        return new And(this.formula0, this.formula1);
    }
    toString() {
        return this.formula0.toString() + "∧" + this.formula1.toString();
    };
}
class Or implements Formula<"t"> {
    readonly sort = "∨";
    readonly type = "t";
    readonly formula0: Formula<"t">;
    readonly formula1: Formula<"t">;
    constructor(formula0: Formula<"t">, formula1: Formula<"t">) {
        this.formula0 = formula0;
        this.formula1 = formula1;
    };
    valuation(m: Model, w: Situation, g: Assignment): Truth {
        return new Truth(this.formula0.valuation(m, w, g).value || this.formula1.valuation(m, w, g).value);
    };
    freeVariables(): Variable<Type>[] {
        return [...this.formula0.freeVariables(), ...this.formula1.freeVariables()];
    }
    replace<A extends Type>(search: Variable<A>, replacer: Formula<A>): Formula<"t"> {
        return new Or(this.formula0.replace(search, replacer), this.formula1.replace(search, replacer));
    }
    reduction(): Formula<"t"> {
        return new Or(this.formula0, this.formula1);
    }
    toString() {
        return this.formula0.toString() + "∨" + this.formula1.toString();
    };
}
class If implements Formula<"t"> {
    readonly sort = "⇒";
    readonly type = "t";
    readonly formula0: Formula<"t">;
    readonly formula1: Formula<"t">;
    constructor(formula0: Formula<"t">, formula1: Formula<"t">) {
        this.formula0 = formula0;
        this.formula1 = formula1;
    };
    valuation(m: Model, w: Situation, g: Assignment): Truth {
        return new Truth(!this.formula0.valuation(m, w, g).value || this.formula1.valuation(m, w, g).value);
    };
    freeVariables(): Variable<Type>[] {
        return [...this.formula0.freeVariables(), ...this.formula1.freeVariables()];
    }
    replace<A extends Type>(search: Variable<A>, replacer: Formula<A>): Formula<"t"> {
        return new If(this.formula0.replace(search, replacer), this.formula1.replace(search, replacer));
    }
    reduction(): Formula<"t"> {
        return new If(this.formula0, this.formula1);
    }
    toString() {
        return this.formula0.toString() + "⇒" + this.formula1.toString();
    };
}
class Iff implements Formula<"t"> {
    readonly sort = "⇔";
    readonly type = "t";
    readonly formula0: Formula<"t">;
    readonly formula1: Formula<"t">;
    constructor(formula0: Formula<"t">, formula1: Formula<"t">) {
        this.formula0 = formula0;
        this.formula1 = formula1;
    };
    valuation(m: Model, w: Situation, g: Assignment): Truth {
        return new Truth(this.formula0.valuation(m, w, g).value == this.formula1.valuation(m, w, g).value);
    };
    freeVariables(): Variable<Type>[] {
        return [...this.formula0.freeVariables(), ...this.formula1.freeVariables()];
    }
    replace<A extends Type>(search: Variable<A>, replacer: Formula<A>): Formula<"t"> {
        return new Iff(this.formula0.replace(search, replacer), this.formula1.replace(search, replacer));
    }
    reduction(): Formula<"t"> {
        return new Iff(this.formula0, this.formula1);
    }
    toString() {
        return this.formula0.toString() + "⇔" + this.formula1.toString();
    };
}
class Equal<A extends Type> implements Formula<"t"> {
    readonly sort = "＝";
    readonly type = "t";
    readonly formula0: Formula<A>;
    readonly formula1: Formula<A>;
    constructor(formula0: Formula<A>, formula1: Formula<A>) {
        this.formula0 = formula0;
        this.formula1 = formula1;
    };
    valuation(m: Model, w: Situation, g: Assignment): Truth {
        return new Truth(equals(this.formula0.valuation(m, w, g), this.formula0.valuation(m, w, g)));
    }
    freeVariables(): Variable<Type>[] {
        return [...this.formula0.freeVariables(), ...this.formula1.freeVariables()];
    }
    replace<A extends Type>(search: Variable<A>, replacer: Formula<A>): Formula<"t"> {
        return new Equal(this.formula0.replace(search, replacer), this.formula1.replace(search, replacer));
    }
    reduction(): Formula<"t"> {
        return new Equal(this.formula0, this.formula1);
    }
    toString() {
        return this.formula0.toString() + "＝" + this.formula1.toString();
    };
}
class Exist<A extends Type> implements Formula<"t"> {
    readonly sort = "∃";
    readonly type = "t";
    readonly variable: Variable<A>;
    readonly formula: Formula<"t">;
    constructor(variable: Variable<A>, formula: Formula<"t">) {
        this.variable = variable;
        this.formula = formula;
    };
    valuation(m: Model, w: Situation, g: Assignment): Truth {
        return new Truth(m.interpretationDomain(this.variable.type).some(value => this.formula.valuation(m, w, assign(g, this.variable, value)).value));
    };
    freeVariables(): Variable<Type>[] {
        return this.formula.freeVariables().filter(x => x.name !== this.variable.name);
    }
    replace<A extends Type>(search: Variable<A>, replacer: Formula<A>): Formula<"t"> {
        // 置き換えたいののなかの自由出現と束縛変数の名前が衝突してたら
        if (replacer.freeVariables().some(x => x.name === this.variable.name)) {
            //衝突しない名前を模索して
            let alt = "_" + this.variable.name;
            while (replacer.freeVariables().some(x => x.name === this.variable.name)) alt = "_" + alt;
            //置き換える
            return new Exist(
                new Variable(alt, this.variable.type),
                this.formula.replace(this.variable, new Variable(alt, this.variable.type)).replace(search, replacer)
            );
        }
        //問題なければそのまま再帰
        return new Exist(this.variable, this.formula.replace(search, replacer));
    }
    reduction(): Formula<"t"> {
        return new Exist(this.variable, this.formula);
    }
    toString() {
        return "∃" + this.variable.toString() + "." + this.formula.toString();
    };
}
class All<A extends Type> implements Formula<"t"> {
    readonly sort = "∀";
    readonly type = "t";
    readonly variable: Variable<A>;
    readonly formula: Formula<"t">;
    constructor(variable: Variable<A>, formula: Formula<"t">) {
        this.variable = variable;
        this.formula = formula;
    };
    valuation(m: Model, w: Situation, g: Assignment): Truth {
        return new Truth(m.interpretationDomain(this.variable.type).every(value => this.formula.valuation(m, w, assign(g, this.variable, value)).value));
    };
    freeVariables(): Variable<Type>[] {
        return this.formula.freeVariables().filter(x => x.name !== this.variable.name);
    }
    replace<A extends Type>(search: Variable<A>, replacer: Formula<A>): Formula<"t"> {
        // 置き換えたいののなかの自由出現と束縛変数の名前が衝突してたら
        if (replacer.freeVariables().some(x => x.name === this.variable.name)) {
            //衝突しない名前を模索して
            let alt = "_" + this.variable.name;
            while (replacer.freeVariables().some(x => x.name === this.variable.name)) alt = "_" + alt;
            //置き換える
            return new All(
                new Variable(alt, this.variable.type),
                this.formula.replace(this.variable, new Variable(alt, this.variable.type)).replace(search, replacer)
            );
        }
        //問題なければそのまま再帰
        return new All(this.variable, this.formula.replace(search, replacer));
    }
    reduction(): Formula<"t"> {
        return new All(this.variable, this.formula);
    }
    toString() {
        return "∀" + this.variable.toString() + "." + this.formula.toString();
    };
}
class Must implements Formula<"t"> {
    readonly sort = "□";
    readonly type = "t";
    readonly formula: Formula<"t">;
    constructor(formula: Formula<"t">) {
        this.formula = formula;
    }
    valuation(m: Model, w: Situation, g: Assignment): Truth {
        return new Truth(m.worlds.every(_w => this.formula.valuation(m, _w, g).value));
    }
    freeVariables(): Variable<Type>[] {
        return this.formula.freeVariables();
    }
    replace<A extends Type>(search: Variable<A>, replacer: Formula<A>): Formula<"t"> {
        return new Must(this.formula.replace(search, replacer));
    }
    reduction(): Formula<"t"> {
        return new Must(this.formula);
    }
    toString() {
        return "□" + this.formula.toString();
    };
}
class May implements Formula<"t"> {
    readonly sort = "◇";
    readonly type = "t";
    readonly formula: Formula<"t">;
    constructor(formula: Formula<"t">) {
        this.formula = formula;
    }
    valuation(m: Model, w: Situation, g: Assignment): Truth {
        return new Truth(m.worlds.some(_w => this.formula.valuation(m, _w, g).value));
    }
    freeVariables(): Variable<Type>[] {
        return this.formula.freeVariables();
    }
    replace<A extends Type>(search: Variable<A>, replacer: Formula<A>): Formula<"t"> {
        return new May(this.formula.replace(search, replacer));
    }
    reduction(): Formula<"t"> {
        return new May(this.formula);
    }
    toString() {
        return "◇" + this.formula.toString();
    };
}
class Up<A extends Type> implements Formula<["s", A]> {
    readonly sort = "↑";
    readonly type: ["s", A];
    readonly formula: Formula<A>;
    constructor(formula: Formula<A>, type: ["s", A]) {
        this.type = type;
        this.formula = formula;
    }
    valuation(m: Model, w: Situation, g: Assignment): TypeValue<["s", A]> {
        return new ComplexValue(this.type, _w => this.formula.valuation(m, _w, g));
    }
    freeVariables(): Variable<Type>[] {
        return this.formula.freeVariables();
    }
    replace<B extends Type>(search: Variable<B>, replacer: Formula<B>): Formula<["s", A]> {
        return new Up(this.formula.replace(search, replacer), this.type);
    }
    reduction(): Formula<["s", A]> {
        return new Up(this.formula, this.type);
    }
    toString() {
        return "↑" + this.formula.toString();
    };
}
class Down<A extends Type> implements Formula<A> {
    readonly sort = "↓";
    readonly type: A;
    readonly formula: Formula<["s", A]>;
    constructor(formula: Formula<["s", A]>, type: A) {
        this.type = type;
        this.formula = formula;
    }
    valuation(m: Model, w: Situation, g: Assignment): TypeValue<A> {
        return this.formula.valuation(m, w, g).value(w);
    }
    freeVariables(): Variable<Type>[] {
        return this.formula.freeVariables();
    }
    replace<B extends Type>(search: Variable<B>, replacer: Formula<B>): Formula<A> {
        return new Down(this.formula.replace(search, replacer), this.type);
    }
    reduction(): Formula<A> {
        // 簡約して、アップになったら消す
        let formula = this.formula.reduction();
        if (formula instanceof Up) 
            return formula.formula;
        return new Down(formula, this.type);
    }
    toString() {
        return "↓" + this.formula.toString();
    };
}
class Lambda<A extends Type, B extends Type> implements Formula<[A, B]> {
    readonly sort = "λ";
    readonly type: [A, B];
    readonly variable: Variable<A>;
    readonly formula: Formula<B>;
    constructor(variable: Variable<A>, formula: Formula<B>, type: [A, B]) {
        this.variable = variable;
        this.type = type;
        this.formula = formula;
    };
    valuation(m: Model, w: Situation, g: Assignment): TypeValue<[A, B]> {
        return new ComplexValue(this.type, d => this.formula.valuation(m, w, assign(g, this.variable, d)));
    }
    freeVariables(): Variable<Type>[] {
        return this.formula.freeVariables().filter(x => x.name !== this.variable.name);
    }
    replace<C extends Type>(search: Variable<C>, replacer: Formula<C>): Formula<[A, B]> {
        // 置き換えたいののなかの自由出現と束縛変数の名前が衝突してたら
        if (replacer.freeVariables().some(x => x.name === this.variable.name)) {
            //衝突しない名前を模索して
            let alt = "_" + this.variable.name;
            while (replacer.freeVariables().some(x => x.name === this.variable.name)) alt = "_" + alt;
            //置き換える
            return new Lambda(
                new Variable(alt, this.variable.type),
                this.formula.replace(this.variable, new Variable(alt, this.variable.type)).replace(search, replacer),
                this.type
            );
        }
        //問題なければそのまま再帰
        return new Lambda(this.variable, this.formula.replace(search, replacer), this.type);
    }
    reduction(): Formula<[A, B]> {
        return new Lambda(this.variable, this.formula, this.type);
    }
    toString() {
        return "λ" + this.variable.toString() + "." + this.formula.toString();
    };
}
class Apply<A extends Type, B extends Type> implements Formula<B> {
    readonly sort = "apply";
    readonly type: B;
    readonly formula0: Formula<[A, B]>;
    readonly formula1: Formula<A>;
    constructor(formula0: Formula<[A, B]>, formula1: Formula<A>, type: B) {
        this.formula0 = formula0;
        this.formula1 = formula1;
        this.type = type;
    }
    valuation(m: Model, w: Situation, g: Assignment): TypeValue<B> {
        return this.formula0.valuation(m, w, g).value((this.formula1.valuation(m, w, g)));
    }
    freeVariables(): Variable<Type>[] {
        return [...this.formula0.freeVariables(), ...this.formula1.freeVariables()];
    }
    replace<A extends Type>(search: Variable<A>, replacer: Formula<A>): Formula<B> {
        return new Apply(this.formula0.replace(search, replacer), this.formula1.replace(search, replacer), this.type);
    }
    reduction(): Formula<B> {
        // 関数側を簡約して、ラムダになったら置き換えして、また簡約
        let formula0 = this.formula0.reduction();
        if (formula0 instanceof Lambda) 
            return formula0.formula.replace(formula0.variable, this.formula1).reduction();
        return new Apply(formula0, this.formula1.reduction(), this.type);
    }
    toString() {
        return this.formula0.toString() + "(" + this.formula1.toString() + ")";
    };
}

function equals(a: TypeValue<Type>, b: TypeValue<Type>): boolean {
    if (a.type === "t")
        return b.type === "t" && a.value === b.value;
    if (a.type === "e")
        return b.type === "e" && a.id === b.id;
    if (a.type === "s")
        return b.type === "s" && a.id === b.id;

    if (b.type === "t" || b.type === "e" || b.type === "s") return false;

    throw new Error("関数同士の比較は未対応（モデルを見なきゃいけないので面倒）");
    //return m.interpretationDomain(a.type[0]).every(x => equals(m, apply(a, x), apply(b, x)));
}


interface Expression<Categoly extends string, T extends Type> {
    translate: () => Formula<T>;
    readonly categoly: Categoly;
}

class ProperNoun implements Expression<"T", [["s", ["e", "t"]], "t"]> {
    readonly constant: Constant<"e">;
    readonly literal: string;
    readonly categoly = "T";
    constructor(literal: string, constant: Constant<"e">) {
        this.literal = literal;
        this.constant = constant;
    }
    translate() {
        // λX.(↓X)(constant)
        return new Lambda(
            new Variable("X", ["s", ["e", "t"]]),
            new Apply(
                new Down(
                    new Variable("X", ["s", ["e", "t"]]),
                    ["e", "t"]),
                this.constant,
                "t"),
            [["s", ["e", "t"]], "t"]
        );
    }
    toString() {
        return this.literal;
    }
}

class CommonNoun implements Expression<"CN", ["e", "t"]> {
    readonly constant: Constant<["e", "t"]>;
    readonly literal: string;
    readonly categoly = "CN";
    constructor(literal: string, constant: Constant<["e", "t"]>) {
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

class Intransitive implements Expression<"IV", ["e", "t"]> {
    readonly constant: Constant<["e", "t"]>;
    readonly literal: string;
    readonly categoly = "IV";
    constructor(literal: string, constant: Constant<["e", "t"]>) {
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
class SubjectIntransitive implements Expression<"t", "t"> {
    readonly subject: Expression<"T", [["s", ["e", "t"]], "t"]>;
    readonly intransitive: Expression<"IV", ["e", "t"]>;
    readonly categoly = "t";
    constructor(subject: Expression<"T", [["s", ["e", "t"]], "t"]>, intransitive: Expression<"IV", ["e", "t"]>) {
        this.subject = subject;
        this.intransitive = intransitive;
    }
    translate() {
        //α (↑δ)
        return new Apply(
            this.subject.translate(),
            new Up(this.intransitive.translate(), ["s", ["e", "t"]]),
            "t");
    }
    toString() {
        return this.subject.toString() + "が" + this.intransitive.toString();
    }
}

//T_oは省略
class ObjectTransitive implements Expression<"IV", ["e", "t"]> {
    readonly object: Expression<"T", [["s", ["e", "t"]], "t"]>;
    readonly transitive: Expression<"IV/T", [["s", [["s", ["e", "t"]], "t"]], ["e", "t"]]>;
    readonly categoly = "IV";
    constructor(object: Expression<"T", [["s", ["e", "t"]], "t"]>, transitive: Expression<"IV/T", [["s", [["s", ["e", "t"]], "t"]], ["e", "t"]]>) {
        this.object = object;
        this.transitive = transitive;
    }
    translate() {
        //δ (↑β)
        return new Apply(
            this.transitive.translate(),
            new Up(this.object.translate(), ["s", [["s", ["e", "t"]], "t"]]),
            ["e", "t"]);
    }
    toString() {
        return this.object.toString() + "を" + this.transitive.toString();
    }
}

class Every implements Expression<"T", [["s", ["e", "t"]], "t"]> {
    readonly commonNoun: Expression<"CN", ["e", "t"]>;
    readonly categoly = "T";
    constructor(literal: string, commonNoun: Expression<"CN", ["e", "t"]>) {
        this.commonNoun = commonNoun;
    }
    translate() {
        // λX ∀x (commonNoun.translate(x)⇒↓X(x))
        return new Lambda(
            new Variable("X", ["s", ["e", "t"]]),
            new All(
                new Variable("x", "e"),
                new If(
                    new Apply(
                        this.commonNoun.translate(),
                        new Variable("x", "e"),
                        "t"),
                    new Apply(
                        new Down(
                            new Variable("X", ["s", ["e", "t"]]),
                            ["e", "t"]),
                        new Variable("x", "e"),
                        "t"))),
            [["s", ["e", "t"]], "t"]);
    }
    toString() {
        return "すべての" + this.commonNoun.toString();
    }
}

const j = new Entity("j");
const m = new Entity("g");
const w0 = new Situation("w0");
//適当な割り当て
const g: Assignment = (v) => model.interpretationDomain(v.type)[0];

const model = new Model([j, m], [new Situation("w0")]);

const john = new ProperNoun("ジョン", new Constant("j", "e", w => j));

const hashiru = new Intransitive("走る", new Constant("RUN", ["e", "t"], (w => new ComplexValue(["e", "t"], (e) => new Truth(equals(e, j))))));

const JohnGaHashiru = new SubjectIntransitive(john, hashiru);

console.log(JohnGaHashiru.toString()); //ジョンが走る

console.log(JohnGaHashiru.translate().toString()); // λX.↓X(j)(↑RUN)

console.log(JohnGaHashiru.translate().reduction().toString()); // RUN(j)

console.log(JohnGaHashiru.translate().valuation(model, w0, g)); // Truth {type: "t", value: true}