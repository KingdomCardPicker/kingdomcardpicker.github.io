let isDownloadingCards = false;
infoDialog = undefined;

$(() => {
    $("#Kingdom-Info").on("click", () => {
        openInfoDialog();
    });
});

function openInfoDialog() {
    if (infoDialog === undefined) {
        infoDialog = $("<div class='dialog dialog-info'></div>").appendTo($("body .main"));
        const infoDialogMiddle = $("<div class='dialog-middle'></div>").appendTo(infoDialog);
        const infoDialogContent = $("<div class='dialog-content'></div>").appendTo(infoDialogMiddle);
        const infoDialogInner = $("<div class='dialog-content-inner'></div>").appendTo(infoDialogContent);

        createDialog(infoDialog);

        // Create a title
        $("<h1>Kingdom</h1>").appendTo(infoDialogInner);
        // Add the minimize buttons
        const minimizeButton = $("<div type='cancel' class='btn-icon btn-dialog-minimize'>" +
            "<i class='material-icons'>close</i></div>").appendTo(infoDialogInner);
        minimizeButton.click(() => {
            infoDialog.trigger("dialog-close");
        });

        const infoDialogText = $("<div class='dialog-content-text'></div>").appendTo(infoDialogInner);

        // Add the about section
        $("<div class='subheading'>Generation</div>").appendTo(infoDialogText);
        $("<p>" +
            "Kingdom is a companion to the Dominion card game, with the goal of generating " +
            "sets with a variety of interesting card combinations and diverse strategies " +
            "to engage both new and experienced players." +
            "</p>").appendTo(infoDialogText);

        $("<div class='subheading'>Sharing</div>").appendTo(infoDialogText);
        $("<p>" +
            "Kingdom also provides a way to share generated sets with other players, " +
            "so that every player can access all the information on the cards from their own device." +
            "</p>").appendTo(infoDialogText);

        // Add the copyright text
        $("<p class='legal-info'>" +
            "Created by Joel Launder" +
            "<br>" +
            "</p>").appendTo(infoDialogText);

        if ("serviceWorker" in navigator) {
            $("<div class='subheading'>Use Offline</div>").appendTo(infoDialogText);
            $("<p>" +
                "Download the card images to your device so that you can use Kingdom even when offline. " +
                "The download is about 70MB so it is recommended you complete the download while connected to a Wi-Fi network." +
                "</p>").appendTo(infoDialogText);
            const cacheCards = $("<div class='btn cache-cards progress-button'>Download Cards</div>").appendTo(infoDialogInner);
            cacheCards.on("click", () => {
                if (!isDownloadingCards) {
                    isDownloadingCards = true;
                    caches.open(CACHE_NAME).then((cache) => {
                        // Read resources
                        let resourceIndex = 0;
                        let loadedResourceIndex = 0;
                        cacheCards.html(`${0 }/${ kingdomResourcesCardImages.length}`);
                        cacheCards.addClass("progress");
                        var checkCache = window.setInterval(() => {
                            if (loadedResourceIndex >= resourceIndex) {
                                if (resourceIndex < kingdomResourcesCardImages.length) {
                                    cache.add(kingdomResourcesCardImages[resourceIndex]);
                                    ++resourceIndex;
                                }
                            }

                            if (loadedResourceIndex < resourceIndex) {
                                caches.match(kingdomResourcesCardImages[loadedResourceIndex]).then((response) => {
                                    if (response !== undefined && response.ok) {
                                        if (loadedResourceIndex < resourceIndex) {
                                            ++loadedResourceIndex;
                                        }
                                    }
                                });

                                cacheCards.html(`${resourceIndex }/${ kingdomResourcesCardImages.length}`);
                            }

                            if (loadedResourceIndex >= kingdomResourcesCardImages.length) {
                                cacheCards.html("Done");
                                cacheCards.removeClass("progress");
                                isDownloadingCards = false;
                                window.clearInterval(checkCache);
                            }
                        }, 10);
                    });
                } else {
                    cacheCards.html("Download in Progress");
                }
            });
        }

        let canAccessStoarge = false;
        if (typeof (Storage) !== undefined) {
            try {
                localStorage.setItem("", "");
                canAccessStoarge = true;
            } catch (err) {
                console.error(err);
            }
        }

        infoDialog.one("dialog-close", () => {
            infoDialog = undefined;
        });
    }
}

function closeInfoDialog() {
    if (infoDialog !== undefined) {
        infoDialog.trigger("dialog-close");
    }
}
