type Truth = ["t", boolean];
type Entity = ["e", string];
type Situation = ["s", string];

type Type = "t" | "e" | "s" | [Type, Type];

const a: TypeValue<["s", "t"]> = (w: Situation) => ["t", w[1]==="a"];

type ME<A extends Type> = 
    (A extends "t" ? Not : never) |
    (A extends "t" ? And : never) |
    (A extends "t" ? Or : never) |
    (A extends "t" ? If : never) |
    (A extends "t" ? Iff : never) |
    (A extends "t" ? Exist<Type> : never) |
    (A extends "t" ? All<Type> : never) |
    (A extends "t" ? Equal<Type> : never) |
    (A extends "t" ? Must : never) |
    (A extends "t" ? May : never) |
    (A extends ["s", Type] ? Up<A[1]> : never) |
    (A extends [Type, Type] ? Lamda<A[0], A[1]> : never)
    | Variable<A> | Constant<A>| Apply<Type, A> | Down<A>;

interface Variable<A extends Type> { sort: "variable"; name: string; type: A }
interface Constant<A extends Type> { sort: "constant"; name: string; interpretation: (w: Situation) => TypeValue<A>; }
interface Not { sort: "￢"; expr: ME<"t">; }
interface And { sort: "∧"; left: ME<"t">; right: ME<"t">; }
interface Or { sort: "∨"; left: ME<"t">; right: ME<"t">; }
interface If { sort: "⇒"; left: ME<"t">; right: ME<"t">; }
interface Iff { sort: "⇔"; left: ME<"t">; right: ME<"t">; }
interface Exist<A extends Type> { sort: "∃"; variable: Variable<A>; expr: ME<"t">; }
interface All<A extends Type> { sort: "∀"; variable: Variable<A>; expr: ME<"t">; }
interface Equal<A extends Type> { sort: "＝"; left: ME<A>; right: ME<A>; }
interface Must { sort: "□"; expr: ME<"t">; }
interface May { sort: "◇"; expr: ME<"t">; }
interface Up<A extends Type> { sort: "↑"; expr: ME<A>; }
interface Down<A extends Type> { sort: "↓"; expr: ME<["s", A]>; }
interface Lamda<A extends Type, B extends Type> { sort: "λ"; variable: Variable<A>, expr: ME<B>; }
interface Apply<A extends Type, B extends Type> { sort: "apply"; left: ME<[A, B]>; right: ME<A>; }

interface Model {
    domein: Set<Entity>;
    worlds: Set<Situation>;
}


// g_[x/d]
function assign<A extends Type>(
    g: <B extends Type>(_: Variable<B>) => TypeValue<B>,
    variable: Variable<A>,
    value: TypeValue<A>): <B extends Type>(_: Variable<B>) => TypeValue<B> {
    return v => v.name === variable.name ? value : g(v);
}

function isTruthME(me: ME<Type>): me is ME<"t"> {
    return me.sort === "￢" || me.sort === "∧" || me.sort === "∨";
    /* Or ? Truth : 
    T extends If ? Truth : 
    T extends Iff ? Truth : 
    T extends Exist<Type> ? Truth :
    T extends All<Type> ? Truth :
    T extends Equal<Type> ? Truth :
    T extends Must ? Truth :
    T extends May ? Truth :;*/
} 

type TypeValue<T extends Type> =
    T extends "t" ? Truth : 
    T extends "e" ? Entity : 
    T extends "s" ? Situation : 
    T extends [Type, Type] ? (_:TypeValue<T[0]>)=>TypeValue<T[1]> : 
    never;

function valuation<A extends Type>(me: ME<A>, m: Model, w: Situation, g: <B extends Type>(_: Variable<B>) => TypeValue<B>): TypeValue<A> {
    switch (me.sort) {
        case "constant": return me.interpretation(w);
        case "variable": return g(me);
        case "λ": return (d) => valuation(me.expr, m, w, assign(g, me.variable, d));;
        case "apply": return valuation(me.left, m, w, g)(valuation(me.right, m, w, g));
        case "＝": return ["t", valuation<B>(me.left, m, w, g) === valuation<B>(me.right, m, w, g)];
        case "￢": return ["t", !valuation<"t">(me.expr, m, w, g)[1]];
        case "∧": return ["t", valuation<"t">(me.left, m, w, g)[1] && valuation<"t">(me.right, m, w, g)[1]];
        case "∨": return ["t", valuation<"t">(me.left, m, w, g)[1] || valuation<"t">(me.right, m, w, g)[1]];
        case "⇒": return ["t", !valuation<"t">(me.left, m, w, g)[1] || valuation<"t">(me.right, m, w, g)[1]];
        case "⇔": return ["t", valuation<"t">(me.left, m, w, g) === valuation<"t">(me.right, m, w, g)];
        case "∃": return ["t", Array.from(m.domein).some(value => valuation<"t">(me.expr, m, w, assign(g, me.variable, value)))];
        case "∀": return ["t", Array.from(m.domein).every(value => valuation<"t">(me.expr, m, w, assign(g, me.variable, value)))];
        case "◇": return ["t", Array.from(m.worlds).every(_w => valuation<"t">(me.expr, m, _w, g))];
        case "□": return ["t", Array.from(m.worlds).some(_w => valuation<"t">(me.expr, m, _w, g))];
        case "↑": return (_w:Situation) => valuation(me.expr, m, _w, g);
        case "↓": return valuation(me.expr, m, w, g)(w);
        // 網羅チェック
        default: return me;
    }
}