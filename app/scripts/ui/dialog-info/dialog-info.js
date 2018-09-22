infoDialog = undefined;

$(function() {
    $("#Kingdom-Info").on('click', function() {
        openInfoDialog();
    });
});

function openInfoDialog() {
    if (infoDialog === undefined) {
        infoDialog = $("<div class='dialog dialog-info'></div>").appendTo($("body .main"));
        var infoDialogMiddle = $("<div class='dialog-middle'></div>").appendTo(infoDialog);
        var infoDialogContent = $("<div class='dialog-content'></div>").appendTo(infoDialogMiddle);
        var infoDialogInner = $("<div class='dialog-content-inner'></div>").appendTo(infoDialogContent);

        createDialog(infoDialog);

        // Create a title
        $("<h1>Kingdom</h1>").appendTo(infoDialogInner);
        // Add the minimize buttons
        var minimizeButton = $("<div type='cancel' class='btn-icon btn-dialog-minimize'>" +
        "<i class='material-icons'>close</i></div>").appendTo(infoDialogInner);
        minimizeButton.click(function() {
            infoDialog.trigger('dialog-close');
        });

        var infoDialogText = $("<div class='dialog-content-text'></div>").appendTo(infoDialogInner);

        // Add the about section
        $("<h2 class='subheading'>Generation</h2>").appendTo(infoDialogText);
        $("<p>" +
            "Kingdom is a companion to the Dominion card game, with the goal of generating " +
            "sets with a variety of interesting card combinations and diverse strategies " +
            "to engage both new and experienced players." +
            "</p>").appendTo(infoDialogText);

        $("<h2 class='subheading'>Sharing</h2>").appendTo(infoDialogText);
        $("<p>" +
            "Kingdom also provides a way to share generated sets with other players," +
            "so that every player can access all the information on the cards from their own device." +
            "</p>").appendTo(infoDialogText);

        // Add the copyright text
        $("<p class='legal-info'>" +
            "Created by Joel Launder" +
            "<br>" +
            "</p>").appendTo(infoDialogText);

        var canAccessStoarge = false;
        if (typeof(Storage) !== undefined) {
            try {
                localStorage.setItem("", "");
                canAccessStoarge = true;
            } catch (err) {
                console.error(err);
            }
        }

        infoDialog.one('dialog-close', function() {
            infoDialog = undefined;
        });
    }
}

function closeInfoDialog() {
    if (infoDialog !== undefined) {
        infoDialog.trigger("dialog-close");
    }
}
