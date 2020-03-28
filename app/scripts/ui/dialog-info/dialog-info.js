"use strict"; let isDownloadingCards=!1; function openInfoDialog() {
    if (void 0===infoDialog) {
        infoDialog=$("<div class='dialog dialog-info'></div>").appendTo($("body .main")); const o=$("<div class='dialog-middle'></div>").appendTo(infoDialog); const e=$("<div class='dialog-content'></div>").appendTo(o); const i=$("<div class='dialog-content-inner'></div>").appendTo(e); createDialog(infoDialog), $("<h1>Kingdom</h1>").appendTo(i), $("<div type='cancel' class='btn-icon btn-dialog-minimize'><i class='material-icons'>close</i></div>").appendTo(i).click(() => {
            infoDialog.trigger("dialog-close");
        }); const n=$("<div class='dialog-content-text'></div>").appendTo(i); if ($("<div class='subheading'>Generation</div>").appendTo(n), $("<p>Kingdom is a companion to the Dominion card game, with the goal of generating sets with a variety of interesting card combinations and diverse strategies to engage both new and experienced players.</p>").appendTo(n), $("<div class='subheading'>Sharing</div>").appendTo(n), $("<p>Kingdom also provides a way to share generated sets with other players, so that every player can access all the information on the cards from their own device.</p>").appendTo(n), $("<p class='legal-info'>Created by Joel Launder<br></p>").appendTo(n), "serviceWorker"in navigator) {
            $("<div class='subheading'>Use Offline</div>").appendTo(n), $("<p>Download the card images to your device so that you can use Kingdom even when offline. The download is about 70MB so it is recommended you complete the download while connected to a Wi-Fi network.</p>").appendTo(n); const a=$("<div class='btn cache-cards progress-button'>Download Cards</div>").appendTo(i); a.on("click", () => {
                isDownloadingCards?a.html("Download in Progress"):(isDownloadingCards=!0, caches.open(CACHE_NAME).then((o) => {
                    let e=0; let i=0; a.html(`0/${kingdomResourcesCardImages.length}`), a.addClass("progress"); var n=window.setInterval(() => {
                        i>=e&&e<kingdomResourcesCardImages.length&&(o.add(kingdomResourcesCardImages[e]), ++e), i<e&&(caches.match(kingdomResourcesCardImages[i]).then((o) => {
                            void 0!==o&&o.ok&&i<e&&++i;
                        }), a.html(`${e}/${kingdomResourcesCardImages.length}`)), i>=kingdomResourcesCardImages.length&&(a.html("Done"), a.removeClass("progress"), isDownloadingCards=!1, window.clearInterval(n));
                    }, 10);
                }));
            });
        } if (void 0!==typeof Storage) {
            try {
                localStorage.setItem("", ""), !0;
            } catch (o) {
                console.error(o);
            }
        }infoDialog.one("dialog-close", () => {
            infoDialog=void 0;
        });
    }
} function closeInfoDialog() {
    void 0!==infoDialog&&infoDialog.trigger("dialog-close");
}infoDialog=void 0, $(() => {
    $("#Kingdom-Info").on("click", () => {
        openInfoDialog();
    });
});
