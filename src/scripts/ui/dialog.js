function createDialog(dialog) {
    dialogBackground = $("<div class='dialog-background'></div").appendTo(dialog);

    $(dialogBackground).click(() => {
        $(dialog).trigger("dialog-close");
    });

    $(dialog).on("dialog-close", function () {
        dialogClick = $(this);
        dialogClick.addClass("dialog-closing");
        window.setTimeout(() => {
            dialogClick.remove();
        }, 500);
    });

    $(dialog).attr("tabindex", "0");
    dialog.focus();

    $(dialog).on("hover", function () {
        this.focus();
    });

    $(dialog).on("keydown", function (event) {
        if (event.key === "Escape") {
            $(this).trigger("dialog-close");
        }
    });
}
