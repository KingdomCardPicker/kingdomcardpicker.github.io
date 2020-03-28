"use strict"; $(() => {
    $(".drawer").on("drawer-open", () => {
        $(".drawer").trigger("drawer-close"), $(".drawer").addClass("drawer-open"), $(".drawer-fade").addClass("fade");
    }), $(".drawer").on("drawer-close", () => {
        $(".drawer").removeClass("drawer-open"), $(".drawer-fade").removeClass("fade");
    }), $(".drawer .btn-drawer-minimize").on("click", () => {
        $(".drawer").trigger("drawer-close");
    }), $(".drawer-fade").on("click", () => {
        $(".drawer").trigger("drawer-close");
    });
});
