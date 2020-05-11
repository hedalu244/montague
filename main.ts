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

interface ME<A extends Type> {
    type: Type;
    valuation: (m: Model, w: Situation, g: Assignment) => TypeValue<A>;
}

class Variable<A extends Type> implements ME<A> {
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
    toString() {
        return this.name;
    };
}
class Constant<A extends Type> implements ME<A> {
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
    toString() {
        return this.name;
    };
}
class Not implements ME<"t"> {
    readonly sort = "￢";
    readonly type = "t";
    readonly expr: ME<"t">;
    constructor(expr: ME<"t">) {
        this.expr = expr;
    };
    valuation(m: Model, w: Situation, g: Assignment): Truth {
        return new Truth(!this.expr.valuation(m, w, g).value);
    };
    toString() {
        return "￢" + this.expr.toString();
    }
}
class And implements ME<"t"> {
    readonly sort = "∧";
    readonly type = "t";
    readonly left: ME<"t">;
    readonly right: ME<"t">;
    constructor(left: ME<"t">, right: ME<"t">) {
        this.left = left;
        this.right = right;
    };
    valuation(m: Model, w: Situation, g: Assignment): Truth {
        return new Truth(this.left.valuation(m, w, g).value && this.right.valuation(m, w, g).value);
    };
    toString() {
        return this.left.toString() + "∧" + this.right.toString();
    };
}
class Or implements ME<"t"> {
    readonly sort = "∨";
    readonly type = "t";
    readonly left: ME<"t">;
    readonly right: ME<"t">;
    constructor(left: ME<"t">, right: ME<"t">) {
        this.left = left;
        this.right = right;
    };
    valuation(m: Model, w: Situation, g: Assignment): Truth {
        return new Truth(this.left.valuation(m, w, g).value || this.right.valuation(m, w, g).value);
    };
    toString() {
        return this.left.toString() + "∨" + this.right.toString();
    };
}
class If implements ME<"t"> {
    readonly sort = "⇒";
    readonly type = "t";
    readonly left: ME<"t">;
    readonly right: ME<"t">;
    constructor(left: ME<"t">, right: ME<"t">) {
        this.left = left;
        this.right = right;
    };
    valuation(m: Model, w: Situation, g: Assignment): Truth {
        return new Truth(!this.left.valuation(m, w, g).value || this.right.valuation(m, w, g).value);
    };
    toString() {
        return this.left.toString() + "⇒" + this.right.toString();
    };
}
class Iff implements ME<"t"> {
    readonly sort = "⇔";
    readonly type = "t";
    readonly left: ME<"t">;
    readonly right: ME<"t">;
    constructor(left: ME<"t">, right: ME<"t">) {
        this.left = left;
        this.right = right;
    };
    valuation(m: Model, w: Situation, g: Assignment): Truth {
        return new Truth(this.left.valuation(m, w, g).value == this.right.valuation(m, w, g).value);
    };
    toString() {
        return this.left.toString() + "⇔" + this.right.toString();
    };
}
class Exist<A extends Type> implements ME<"t"> {
    readonly sort = "∃";
    readonly type = "t";
    readonly variable: Variable<A>;
    readonly expr: ME<"t">;
    constructor(variable: Variable<A>, expr: ME<"t">) {
        this.variable = variable;
        this.expr = expr;
    };
    valuation(m: Model, w: Situation, g: Assignment): Truth {
        return new Truth(m.interpretationDomain(this.variable.type).some(value => this.expr.valuation(m, w, assign(g, this.variable, value)).value));
    };
    toString() {
        return "∃" + this.variable.toString() + "." + this.expr.toString();
    };
}
class All<A extends Type> implements ME<"t"> {
    readonly sort = "∀";
    readonly type = "t";
    readonly variable: Variable<A>;
    readonly expr: ME<"t">;
    constructor(variable: Variable<A>, expr: ME<"t">) {
        this.variable = variable;
        this.expr = expr;
    };
    valuation(m: Model, w: Situation, g: Assignment): Truth {
        return new Truth(m.interpretationDomain(this.variable.type).every(value => this.expr.valuation(m, w, assign(g, this.variable, value)).value));
    };
    toString() {
        return "∀" + this.variable.toString() + "." + this.expr.toString();
    };
}
class Equal<A extends Type> implements ME<"t"> {
    readonly sort = "＝";
    readonly type = "t";
    readonly left: ME<A>;
    readonly right: ME<A>;
    constructor(left: ME<A>, right: ME<A>) {
        this.left = left;
        this.right = right;
    };
    valuation(m: Model, w: Situation, g: Assignment): Truth {
        return new Truth(equals(m, this.left.valuation(m, w, g), this.left.valuation(m, w, g)));
    }
    toString() {
        return this.left.toString() + "＝" + this.right.toString();
    };
}
class Must implements ME<"t"> {
    readonly sort = "□";
    readonly type = "t";
    readonly expr: ME<"t">;
    constructor(expr: ME<"t">) {
        this.expr = expr;
    }
    valuation(m: Model, w: Situation, g: Assignment): Truth {
        return new Truth(m.worlds.every(_w => this.expr.valuation(m, _w, g).value));
    }
    toString() {
        return "□" + this.expr.toString();
    };
}
class May implements ME<"t"> {
    readonly sort = "◇";
    readonly type = "t";
    readonly expr: ME<"t">;
    constructor(expr: ME<"t">) {
        this.expr = expr;
    }
    valuation(m: Model, w: Situation, g: Assignment): Truth {
        return new Truth(m.worlds.some(_w => this.expr.valuation(m, _w, g).value));
    }
    toString() {
        return "◇" + this.expr.toString();
    };
}
class Up<A extends Type> implements ME<["s", A]> {
    readonly sort = "↑";
    readonly type: ["s", A];
    readonly expr: ME<A>;
    constructor(expr: ME<A>, type: ["s", A]) {
        this.type = type;
        this.expr = expr;
    }
    valuation(m: Model, w: Situation, g: Assignment): TypeValue<["s", A]> {
        return new ComplexValue(this.type, _w => this.expr.valuation(m, _w, g));
    }
    toString() {
        return "↑" + this.expr.toString();
    };
}
class Down<A extends Type> implements ME<A> {
    readonly sort = "↓";
    readonly type: A;
    readonly expr: ME<["s", A]>;
    constructor(expr: ME<["s", A]>, type: A) {
        this.type = type;
        this.expr = expr;
    }
    valuation(m: Model, w: Situation, g: Assignment): TypeValue<A> {
        return apply(this.expr.valuation(m, w, g), w);
    }
    toString() {
        return "↓" + this.expr.toString();
    };
}
class Lambda<A extends Type, B extends Type> implements ME<[A, B]> {
    readonly sort = "λ";
    readonly type: [A, B];
    readonly variable: Variable<A>;
    readonly expr: ME<B>;
    constructor(variable: Variable<A>, expr: ME<B>, type: [A, B]) {
        this.variable = variable;
        this.type = type;
        this.expr = expr;
    };
    valuation(m: Model, w: Situation, g: Assignment): TypeValue<[A, B]> {
        return new ComplexValue(this.type, d => this.expr.valuation(m, w, assign(g, this.variable, d)));
    }
    toString() {
        return "λ" + this.variable.toString() + "." + this.expr.toString();
    };
}
class Apply<A extends Type, B extends Type> implements ME<B> {
    readonly sort = "apply";
    readonly type: B;
    readonly left: ME<[A, B]>;
    readonly right: ME<A>;
    constructor(left: ME<[A, B]>, right: ME<A>, type: B) {
        this.left = left;
        this.right = right;
        this.type = type;
    }
    valuation(m: Model, w: Situation, g: Assignment): TypeValue<B> {
        return apply(this.left.valuation(m, w, g), (this.right.valuation(m, w, g)));
    }
    toString() {
        return this.left.toString() + "(" + this.right.toString() + ")";
    };
}

function equals(m: Model, a: TypeValue<Type>, b: TypeValue<Type>): boolean {
    if (a.type === "t")
        return b.type === "t" && a.value === b.value;
    if (a.type === "e")
        return b.type === "e" && a.id === b.id;
    if (a.type === "s")
        return b.type === "s" && a.id === b.id;

    if (b.type === "t" || b.type === "e" || b.type === "s") return false;

    return m.interpretationDomain(a.type[0]).every(x => equals(m, apply(a, x), apply(b, x)));
}

function apply<A extends Type, B extends Type>(func: ComplexValue<A, B>, x: TypeValue<A>) {
    return func.value(x);
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

        return table.map(t => new ComplexValue(type, (x: TypeValue<A[0]>): TypeValue<A[1]> => t[aa.findIndex(y => equals(this, x, y))]));
    }
}

// g_[x/d]
function assign<A extends Type>(
    g: Assignment,
    variable: Variable<A>,
    value: TypeValue<A>): Assignment {
    return v => v.name === variable.name ? value : g(v);
}

const j = new Entity("j");
const m = new Entity("g");
const w0 = new Situation("w0");
//適当な割り当て
const g: Assignment = (v) => model.interpretationDomain(v.type)[0];

const model = new Model([j, m], [new Situation("w0")])

const run = new Up(new Constant("run", ["e", "t"], (w => new ComplexValue(["e", "t"], (e) => new Truth(equals(model, e, j)) ))), ["s", ["e", "t"]]);

const john = new Lambda(new Variable("X", ["s", ["e", "t"]]), new Apply(new Down(new Variable("X", ["s", ["e", "t"]]), ["e", "t"]), new Constant("j", "e", w=>j), "t"), [["s", ["e", "t"]], "t"]);

console.log(new Apply(john, run, "t").valuation(model, w0, g));