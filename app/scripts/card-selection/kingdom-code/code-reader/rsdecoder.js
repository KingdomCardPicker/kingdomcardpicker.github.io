"use strict"; function ReedSolomonDecoder(e) {
    this.field=e, this.decode=function (e, i) {
        for (var r=new GF256Poly(this.field, e), t=new Array(i), o=0; o<t.length; o++)t[o]=0; let l=!0; for (o=0; o<i; o++) {
            const n=r.evaluateAt(this.field.exp(o)); t[t.length-1-o]=n, 0!=n&&(l=!1);
        } if (!l) {
            const a=new GF256Poly(this.field, t); const f=this.runEuclideanAlgorithm(this.field.buildMonomial(i, 1), a, i); const d=f[0]; const s=f[1]; const h=this.findErrorLocations(d); const u=this.findErrorMagnitudes(s, h, !1); for (o=0; o<h.length; o++) {
                const c=e.length-1-this.field.log(h[o]); if (c<0) throw "ReedSolomonException Bad error location"; e[c]=GF256.addOrSubtract(e[c], u[o]);
            }
        }
    }, this.runEuclideanAlgorithm=function (e, i, r) {
        if (e.Degree<i.Degree) {
            const t=e; e=i, i=t;
        } for (var o=e, l=i, n=this.field.One, a=this.field.Zero, f=this.field.Zero, d=this.field.One; l.Degree>=Math.floor(r/2);) {
            const s=o; const h=n; const u=f; if (n=a, f=d, (o=l).Zero) throw "r_{i-1} was zero"; l=s; for (var c=this.field.Zero, g=o.getCoefficient(o.Degree), v=this.field.inverse(g); l.Degree>=o.Degree&&!l.Zero;) {
                const m=l.Degree-o.Degree; const y=this.field.multiply(l.getCoefficient(l.Degree), v); c=c.addOrSubtract(this.field.buildMonomial(m, y)), l=l.addOrSubtract(o.multiplyByMonomial(m, y));
            }a=c.multiply1(n).addOrSubtract(h), d=c.multiply1(f).addOrSubtract(u);
        } const p=d.getCoefficient(0); if (0==p) throw "ReedSolomonException sigmaTilde(0) was zero"; const w=this.field.inverse(p); const D=d.multiply2(w); const A=l.multiply2(w); return new Array(D, A);
    }, this.findErrorLocations=function (e) {
        const i=e.Degree; if (1==i) return new Array(e.getCoefficient(1)); for (var r=new Array(i), t=0, o=1; o<256&&t<i; o++)0==e.evaluateAt(o)&&(r[t]=this.field.inverse(o), t++); if (t!=i) throw "Error locator degree does not match number of roots"; return r;
    }, this.findErrorMagnitudes=function (e, i, r) {
        for (var t=i.length, o=new Array(t), l=0; l<t; l++) {
            for (var n=this.field.inverse(i[l]), a=1, f=0; f<t; f++)l!=f&&(a=this.field.multiply(a, GF256.addOrSubtract(1, this.field.multiply(i[f], n)))); o[l]=this.field.multiply(e.evaluateAt(n), this.field.inverse(a)), r&&(o[l]=this.field.multiply(o[l], n));
        } return o;
    };
}
