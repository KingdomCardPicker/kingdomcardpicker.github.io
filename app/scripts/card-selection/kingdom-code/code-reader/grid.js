"use strict"; var GridSampler={ checkAndNudgePoints: function (r, o) {
    for (var t=qrcode.width, e=qrcode.height, a=!0, n=0; n<o.length&&a; n+=2) {
        var i=Math.floor(o[n]); var d=Math.floor(o[n+1]); if (i<-1||i>t||d<-1||d>e) throw "Error.checkAndNudgePoints "; a=!1, -1==i?(o[n]=0, a=!0):i==t&&(o[n]=t-1, a=!0), -1==d?(o[n+1]=0, a=!0):d==e&&(o[n+1]=e-1, a=!0);
    }a=!0; for (n=o.length-2; n>=0&&a; n-=2) {
        i=Math.floor(o[n]), d=Math.floor(o[n+1]); if (i<-1||i>t||d<-1||d>e) throw "Error.checkAndNudgePoints "; a=!1, -1==i?(o[n]=0, a=!0):i==t&&(o[n]=t-1, a=!0), -1==d?(o[n+1]=0, a=!0):d==e&&(o[n+1]=e-1, a=!0);
    }
}, sampleGrid3: function (r, o, t) {
    for (var e=new BitMatrix(o), a=new Array(o<<1), n=0; n<o; n++) {
        for (var i=a.length, d=n+.5, h=0; h<i; h+=2)a[h]=.5+(h>>1), a[h+1]=d; t.transformPoints1(a), GridSampler.checkAndNudgePoints(r, a); try {
            for (h=0; h<i; h+=2) {
                r[Math.floor(a[h])+qrcode.width*Math.floor(a[h+1])]&&e.set_Renamed(h>>1, n);
            }
        } catch (r) {
            throw "Error.checkAndNudgePoints";
        }
    } return e;
}, sampleGridx: function (r, o, t, e, a, n, i, d, h, c, l, f, s, u, g, m, p, v) {
    const w=PerspectiveTransform.quadrilateralToQuadrilateral(t, e, a, n, i, d, h, c, l, f, s, u, g, m, p, v); return GridSampler.sampleGrid3(r, o, w);
} };
