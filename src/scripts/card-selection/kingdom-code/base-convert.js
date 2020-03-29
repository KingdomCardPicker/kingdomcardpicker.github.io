function baseConvert(src, from_base, to_base, src_symbol_table, dest_symbol_table) {
    // From: convert.js: http://rot47.net/_js/convert.js
    //	http://rot47.net
    //	http://helloacm.com
    //	http://codingforspeed.com
    //	Dr Zhihua Lai
    //
    // Modified by MLM to work with BigInteger: https://github.com/peterolson/BigInteger.js
    // This is able to convert extremely large numbers; At any base equal to or less than the symbol table length

    // Default the symbol table to a nice default table that supports up to base 96
    src_symbol_table = src_symbol_table
        ? src_symbol_table
        : base_symbols;
    // Default the desttable equal to the srctable if it isn't defined
    dest_symbol_table = dest_symbol_table
        ? dest_symbol_table
        : src_symbol_table;

    // Make sure we are not trying to convert out of the symbol table range
    if (from_base > src_symbol_table.length || to_base > dest_symbol_table.length) {
        console.warn("Can't convert", src, "to base", to_base, "greater than symbol table length. src-table:", src_symbol_table.length, "dest-table:", dest_symbol_table.length);
        return false;
    }

    // First convert to base 10
    var val = bigInt(0);
    for (var i = 0; i < src.length; i++) {
        val = val.multiply(from_base).add(src_symbol_table.indexOf(src.charAt(i)));
    }
    if (val.lesser(0)) {
        return 0;
    }

    // Then covert to any base
    var r = val.mod(to_base);
    var res = dest_symbol_table.charAt(r);
    var q = val.divide(to_base);
    while (!q.equals(0)) {
        r = q.mod(to_base);
        q = q.divide(to_base);
        res = dest_symbol_table.charAt(r) + res;
    }

    return res;
}
