$(function() {
    $(".drawer").on('drawer-open', function() {
        $(".drawer").trigger("drawer-close");
        $(".drawer").addClass("drawer-open");
        $(".drawer-fade").addClass("fade");
    });

    $(".drawer").on('drawer-close', function() {
        $(".drawer").removeClass("drawer-open");
        $(".drawer-fade").removeClass("fade");
    });

    $(".drawer .btn-drawer-minimize").on('click', function() {
        $(".drawer").trigger("drawer-close");
    });

    $(".drawer-fade").on('click', function() {
        $(".drawer").trigger("drawer-close");
    });
});
