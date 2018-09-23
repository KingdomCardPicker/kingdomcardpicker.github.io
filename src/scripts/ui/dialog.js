function createDialog(dialog) {
    hideTooltips();

    dialogBackground = $("<div class='dialog-background'></div").appendTo(dialog);

    $(dialogBackground).click(function() {
        $(dialog).trigger('dialog-close');
    });

    $(dialog).on('dialog-close', function() {
        hideTooltips();

        dialogClick = $(this);
        dialogClick.addClass("dialog-closing");
        window.setTimeout(function() {
            dialogClick.remove();
        }, 500);
    });

    $(dialog).attr("tabindex", "0");
    dialog.focus();

    $(dialog).on('hover', function() {
        this.focus();
    });

    $(dialog).on('keydown', function(event) {
        if (event.key === "Escape") {
            $(this).trigger('dialog-close');
        }
    });
}
