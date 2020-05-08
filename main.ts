interface Entity {
    id: string;
}
interface Situation {
    id: string;
}
type Type = "t" | "e" | "s" | [Type, Type];
type ME<A extends Type> =
    (A extends "t" ? Not | And | Or | If | Iff | Exist<Type> | All<Type> | Equal<Type> | Must | May : never) |
    (A extends ["s", Type] ? Up<A[1]> : never) |
    Variable<A> | Constant<A> | Apply<Type, A> | Down<A>;

interface Variable<A extends Type> { sort: "variable"; name: string; }
interface Constant<A extends Type> { sort: "constant"; name: string; }
interface Not { sotr: "￢"; expr: ME<"t">; }
interface And { sort: "∧"; left: ME<"t">; right: ME<"t">; }
interface Or { sort: "∨"; left: ME<"t">; right: ME<"t">; }
interface If { sotr: "⇒"; left: ME<"t">; right: ME<"t">; }
interface Iff { sort: "⇔"; left: ME<"t">; right: ME<"t">; }
interface Exist<A extends Type> { sort: "∃"; variable: Variable<A>; expr: ME<"t">; }
interface All<A extends Type> { sort: "∀"; variable: Variable<A>; expr: ME<"t">; }
interface Equal<A extends Type> { type: "equal"; left: ME<A>; light: ME<A>; }
interface Must { sort: "□"; expr: ME<"t">; }
interface May { sort: "◇"; expr: ME<"t">; }
interface Up<A extends Type> { sort: "↑"; expr: ME<A>; }
interface Down<A extends Type> { sort: "↓"; expr: ME<["s", A]>; }
interface Lamda<A extends Type, B extends Type> { sort: "λ"; variable: Variable<B>, expr: ME<A>; }
interface Apply<A extends Type, B extends Type> { sort: "apply"; left: ME<[A, B]>; right: ME<A>; }

type Evaluate<T extends Type> =
    T extends "t" ? boolean :
    T extends "e" ? Entity :
    T extends "s" ? Situation :
    T extends [Type, Type] ? (_: Evaluate<T[0]>) => Evaluate<T[1]> :
    never;
