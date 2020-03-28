"use strict"; function ErrorCorrectionLevel(r, e, t) {
    this.ordinal_Renamed_Field=r, this.bits=e, this.name=t, this.__defineGetter__("Bits", function () {
        return this.bits;
    }), this.__defineGetter__("Name", function () {
        return this.name;
    }), this.ordinal=function () {
        return this.ordinal_Renamed_Field;
    };
}ErrorCorrectionLevel.forBits=function (r) {
    if (r<0||r>=FOR_BITS.length) throw "ArgumentException"; return FOR_BITS[r];
}; const L=new ErrorCorrectionLevel(0, 1, "L"); const M=new ErrorCorrectionLevel(1, 0, "M"); const Q=new ErrorCorrectionLevel(2, 3, "Q"); const H=new ErrorCorrectionLevel(3, 2, "H"); var FOR_BITS=new Array(M, L, H, Q);
