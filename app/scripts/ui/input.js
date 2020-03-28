"use strict"; $(() => {
    $(".input-number").each(function () {
        const t=$(this); const e=(t.find(".input-number-value"), t.find(".input-number-add")); const n=t.find(".input-number-subtract"); e.click(() => {
            t.trigger("input-add");
        }), n.click(() => {
            t.trigger("input-subtract");
        });
    }), $(".input-number").on("input-add", function () {
        const t=$(this).find(".input-number-value"); t.removeClass("value-in-left"), t.removeClass("value-in-right"), t.addClass("value-out-left"), window.setTimeout(() => {
            t.removeClass("value-out-left"), t.addClass("value-in-right"); const e=parseInt(t.text(), 10); if (e>=1) {
                const n=e+1; t.text(n), t.trigger("input-value-change");
            } else t.text("2"), t.trigger("input-value-change");
        }, 100);
    }), $(".input-number").on("input-subtract", function () {
        const t=$(this).find(".input-number-value"); parseInt(t.text(), 10)>1?(t.removeClass("value-in-left"), t.removeClass("value-in-right"), t.addClass("value-out-right"), window.setTimeout(() => {
            t.removeClass("value-out-right"), t.addClass("value-in-left"); const e=parseInt(t.text(), 10); if (e>=1) {
                const n=e-1; t.text(n), t.trigger("input-value-change");
            } else t.text("2"), t.trigger("input-value-change");
        }, 100)):(t.text("1"), t.trigger("input-value-change"));
    }), $("button, .btn, .btn-icon, .btn-toolbar, .btn-fab").hover(function () {
        $(this).addClass("tooltip-hover");
    }, function () {
        $(this).removeClass("tooltip-hover");
    }), $("button, .btn, .btn-icon, .btn-toolbar, .btn-fab").on("click", function () {
        $(this).removeClass("tooltip-hover");
    });
});
