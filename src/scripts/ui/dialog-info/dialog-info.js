var CACHE_NAME = 'kingdom-cache-v1';
var isDownloadingCards = false;
infoDialog = undefined;

$(function () {
    $("#Kingdom-Info").on('click', function () {
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
        minimizeButton.click(function () {
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
            "Kingdom also provides a way to share generated sets with other players, " +
            "so that every player can access all the information on the cards from their own device." +
            "</p>").appendTo(infoDialogText);

        // Add the copyright text
        $("<p class='legal-info'>" +
            "Created by Joel Launder" +
            "<br>" +
            "</p>").appendTo(infoDialogText);

        $("<h2 class='subheading'>Use Offline</h2>").appendTo(infoDialogText);
        $("<p>" +
            "Download the card images to your device so that you can use Kingdom even when offline. " +
            "The download is about 70MB so it is recommended you complete the download while connected to a Wi-Fi network." +
            "</p>").appendTo(infoDialogText);
        var cacheCards = $("<div class='btn cache-cards'>Download Cards</div>").appendTo(infoDialogInner);
        cacheCards.on('click', function () {
            if (!isDownloadingCards) {
                isDownloadingCards = true;
                caches.open(CACHE_NAME).then(function (cache) {
                    // Read resources
                    var resourceIndex = 0;
                    var loadedResourceIndex = 0;
                    cacheCards.html(0 + "/" + kingdomResourcesCardImages.length);
                    var checkCache = window.setInterval(function () {
                        if (loadedResourceIndex >= resourceIndex) {
                            if (resourceIndex < kingdomResourcesCardImages.length) {
                                cache.add(kingdomResourcesCardImages[resourceIndex]);
                                ++resourceIndex;
                            }
                        }

                        if (loadedResourceIndex < resourceIndex) {
                            caches.match(kingdomResourcesCardImages[loadedResourceIndex]).then(function (response) {
                                if (response !== undefined && response.ok) {
                                    if (loadedResourceIndex < resourceIndex) {
                                        ++loadedResourceIndex;
                                    }
                                }
                            });

                            cacheCards.html(resourceIndex + "/" + kingdomResourcesCardImages.length);
                        }

                        if (loadedResourceIndex >= kingdomResourcesCardImages.length) {
                            cacheCards.html("Done");
                            isDownloadingCards = false;
                            window.clearInterval(checkCache);
                        }
                    }, 10);
                });
            } else {
                cacheCards.html("Download in Progress");
            }
        });

        var canAccessStoarge = false;
        if (typeof (Storage) !== undefined) {
            try {
                localStorage.setItem("", "");
                canAccessStoarge = true;
            } catch (err) {
                console.error(err);
            }
        }

        infoDialog.one('dialog-close', function () {
            infoDialog = undefined;
        });
    }
}

function closeInfoDialog() {
    if (infoDialog !== undefined) {
        infoDialog.trigger("dialog-close");
    }
}
