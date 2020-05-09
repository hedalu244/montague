"use strict";
const a = (w) => ["t", w[1] === "a"];
// g_[x/d]
function assign(g, variable, value) {
    return v => v.name === variable.name ? value : g(v);
}
function isTruthME(me) {
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
function valuation(me, m, w, g) {
    switch (me.sort) {
        case "constant": return me.interpretation(w);
        case "variable": return g(me);
        case "λ":
            return (d) => valuation(me.expr, m, w, assign(g, me.variable, d));
            ;
        case "apply": return valuation(me.left, m, w, g)(valuation(me.right, m, w, g));
        case "＝": return ["t", valuation(me.left, m, w, g) === valuation(me.right, m, w, g)];
        case "￢": return ["t", !valuation(me.expr, m, w, g)[1]];
        case "∧": return ["t", valuation(me.left, m, w, g)[1] && valuation(me.right, m, w, g)[1]];
        case "∨": return ["t", valuation(me.left, m, w, g)[1] || valuation(me.right, m, w, g)[1]];
        case "⇒": return ["t", !valuation(me.left, m, w, g)[1] || valuation(me.right, m, w, g)[1]];
        case "⇔": return ["t", valuation(me.left, m, w, g) === valuation(me.right, m, w, g)];
        case "∃": return ["t", Array.from(m.domein).some(value => valuation(me.expr, m, w, assign(g, me.variable, value)))];
        case "∀": return ["t", Array.from(m.domein).every(value => valuation(me.expr, m, w, assign(g, me.variable, value)))];
        case "◇": return ["t", Array.from(m.worlds).every(_w => valuation(me.expr, m, _w, g))];
        case "□": return ["t", Array.from(m.worlds).some(_w => valuation(me.expr, m, _w, g))];
        case "↑": return (_w) => valuation(me.expr, m, _w, g);
        case "↓": return valuation(me.expr, m, w, g)(w);
        // 網羅チェック
        default: return me;
    }
}
