var currentSetsCheckboxes = [];

var currentKingdom = {};
var isGenerating = false;
var isGeneratingFromCode = false;
var loadedCards = 0;

var gamesPlayed = 0;
var cardCounts = {};

var cardWorker = undefined;
var removeCardsTimeout = undefined;

const WIKI_PREFIX = "http://wiki.dominionstrategy.com/index.php/";

// "cards", "counts", or "all"
const DEBUG = 'cards';
const REPEAT = false;
const REPEAT_MAX = 50;

var totalSets = {
    "Dominion": 0,
    "Intrigue": 1,
    "Seaside": 2,
    "Alchemy": 3,
    "Prosperity": 4,
    "Cornucopia": 5,
    "Hinterlands": 6,
    "Dark Ages": 7,
    "Guilds": 8,
    "Adventures": 9,
    "Empires": 10
};

$(window).bind('hashchange', function (e) {
    var code = window.location.hash.replace("#", "");
    if (code != undefined && code != null && code != "") {
        if (code != currentKingdom.kingdomCode) {
            loadKingdomFromCode(code);
        }
    } else {
        clearKingdom();
    }
});

$(function () {
    // Generate from code (if available)
    var code = window.location.hash;
    if (code !== undefined && code !== null && code !== "") {
        loadKingdomFromCode(code.substring(1));
    }

    if (typeof (Storage) !== undefined) {
        var ownedSetsCount = 0;
        for (setName in totalSets) {
            var sId = "Sets-Selection-" + setName + setName;
            if (localStorage.getItem(sId) === "on") {
                ownedSetsCount += 1;
            }
        }

        if (ownedSetsCount === 0) {
            $(".cards-table-state").addClass("state-sets");
            $(".cards-table-state").removeClass("state-empty");

            if (code === "") {
                openSetDialog(true);
            }
        } else {
            $(".cards-table-state").removeClass("state-sets");
            $(".cards-table-state").addClass("state-empty");
        }
    }

    // Setup checkboxes
    for (s of $(".checkbox-switch")) {
        createCheckboxSwitch(s);
    }

    setupGeneratorOptions();

    $("#Generate-Button-Fab .btn-fab-btn").on('click', function () {
        hideTooltips();
        $("#Onboarding-Generate").removeClass('open');

        if (setupSwitches()) {
            $("#Generate-Drawer").trigger("drawer-open");
        } else {
            openSetDialog();
        }

        window.setTimeout(function () {
            hideTooltips();
        }, 500);
    });

    $("#Generate-Drawer-Sets-SelectAll").on('click', function () {
        hideTooltips();
        selectAllSwitches();

        window.setTimeout(function () {
            hideTooltips();
        }, 500);
    });

    $("#Generate-Drawer-Sets-DeselectAll").on('click', function () {
        hideTooltips();
        deselectAllSwitches();

        window.setTimeout(function () {
            hideTooltips();
        }, 500);
    });

    $("#Generate-Drawer-Randomize").on('click', function () {
        hideTooltips();
        randomizeSwitches();

        window.setTimeout(function () {
            hideTooltips();
        }, 500);
    });

    $("#Generate-Button-New").on('click', function () {
        hideTooltips();
        generateNewKingdom();
    });

    $("#Generate-Button-Shuffle").on('click', function () {
        hideTooltips();
        generateNewKingdom();
    });

    $("#Generate-Button-Clear").on('click', function () {
        hideTooltips();
        clearKingdom();
    });

    $("#Generate-Button-CodeScan").on('click', function () {
        openScanDialog();
    });

    $("#Generate-Button-Code").on('click', function () {
        openCodeDialog();
    });

    // Enable tooltips
    $('[data-toggle="tooltip"]').tooltip({
        container: $(".main"),
        trigger: 'manual',
        constraints: [
            {
                to: "window",
                pin: true
            }
        ]
    });

    /*$('[data-toggle="tooltip"]').on('touchstart mouseover focus', function (e) {
        if (e.type == 'touchstart') {
            e.stopImmediatePropagation();
            e.preventDefault();
            $(this).trigger("click");
        } else {
            $(this).tooltip("show");
        }
    });

    $('[data-toggle="tooltip"]').on('mouseleave click', function (e) {
        $(this).tooltip("hide");
    });*/

    window.setTimeout(function () {
        $('[data-toggle="tooltip"]').tooltip('show');

        window.setTimeout(function () {
            $('[data-toggle="tooltip"]').tooltip('hide');
        }, 100);
    }, 10);
});

function hideTooltips() {
    window.setTimeout(function () {
        $('[data-toggle="tooltip"]').tooltip('hide');
    }, 10);
}

function generateNewKingdom() {
    if (!isGenerating && !isGeneratingFromCode && cardWorker === undefined) {
        isGenerating = true;
        isGeneratingFromCode = false;

        // Clear the current cards
        if (currentKingdom.kingdomCards) {
            animateCardsOut();
        } else {
            // Remove any error message
            $(".error-msg").removeClass("error-visible");
        }

        // Close the drawer
        var isDrawerOpen = $("#Generate-Drawer").hasClass("drawer-open");
        $("#Generate-Drawer").trigger('drawer-close');

        setLoadingProgress(0);
        // Start the loading
        $("#LoadingIndicator").addClass("loading");
        $("#LoadingIndicator").addClass("animating");

        // Stop the toolbar buttons from being pressed
        $(".toolbar-cards").prop("disabled", true);
        $(".toolbar-shuffle").prop("disabled", true);

        if (typeof (Worker) !== "undefined") {
            if (cardWorker === undefined) {
                cardWorker = new Worker("./scripts/card-selection/card-selector/card-selector.w.js");

                selectedSets = [];
                for (setCheckbox of currentSetsCheckboxes) {
                    if (setCheckbox.prop("checked")) {
                        selectedSets.push(setCheckbox.attr("value"));
                    }
                }

                var d1e = "off";
                var d2e = "off";
                var i1e = "off";
                var i2e = "off";

                var clusterPotions = "off";
                var distributeSets = "off";

                if (typeof (Storage) !== undefined) {
                    d1e = localStorage.getItem("Sets-Selection-Dominion1st Edition");
                    d2e = localStorage.getItem("Sets-Selection-Dominion2nd Edition");
                    i1e = localStorage.getItem("Sets-Selection-Intrigue1st Edition");
                    i2e = localStorage.getItem("Sets-Selection-Intrigue2nd Edition");

                    clusterPotions = localStorage.getItem("Generate-Drawer-ClusterPotions") === "on";
                    distributeSets = localStorage.getItem("Generate-Drawer-DistributeSets") === "on";
                }

                var parameters = {
                    debug: DEBUG,
                    sets: selectedSets,
                    "Dominion1st Edition": d1e,
                    "Dominion2nd Edition": d2e,
                    "Intrigue1st Edition": i1e,
                    "Intrigue2nd Edition": i2e,
                    clusterPotions: clusterPotions,
                    distributeSets: distributeSets,
                    appDir: absolutePath(window.location.href, "/"),
                    randomness: 10
                };

                // Hide the fab
                $("#Generate-Button-Fab").addClass("hidden");
                // Show the empty state
                $(".cards-table-state").removeClass("state-open");

                // Start the worker
                cardWorker.postMessage(parameters);

                // Setup return message
                cardWorker.onmessage = function (event) {
                    // Find the data
                    data = event.data;
                    if (data.result === "success") {
                        // Terminate the worker
                        cardWorker.terminate();
                        cardWorker = undefined;

                        setLoadingProgress(17);

                        window.setTimeout(function () {
                            setKingdomCards(data);
                        }, 500);
                    } else if (data.result === "progress") {
                        setLoadingProgress(data.progress);
                    } else if (data.result === "error") {
                        // Terminate the worker
                        cardWorker.terminate();
                        cardWorker = undefined;

                        showError(data.message);
                    }
                }

                // Setup error message
                cardWorker.onerror = function (err) {
                    if (cardWorker !== undefined) {
                        // Terminate the worker
                        cardWorker.terminate();
                        cardWorker = undefined;
                    }

                    // Show an error
                    showError("There was a problem generating the Kingdom");
                    console.error(err.message + "\nAt line: " + err.lineno + " in " + err.filename);
                }
            }
        } else {
            // There is no web worker support in this browser
            showError("Sorry, Kingdom cannot run in your browser");
        }
    }
}

function absolutePath(base, relative) {
    var stack = base.split("/"),
        parts = relative.split("/");
    stack.pop(); // remove current file name (or empty string)
    // (omit if "base" is the current folder without trailing slash)
    for (var i = 0; i < parts.length; i++) {
        if (parts[i] == ".")
            continue;
        if (parts[i] == "..")
            stack.pop();
        else
            stack.push(parts[i]);
    }
    return stack.join("/");
}

function setupSwitches() {
    var c = $("#Generate-Drawer-Sets");
    c.empty();

    currentSetsCheckboxes = [];

    if (typeof (Storage) !== undefined) {
        for (setName in totalSets) {
            var sId = "Sets-Selection-" + setName + setName;
            if (localStorage.getItem(sId) === "on") {
                // Generate the switch
                var switchContainer = $("<div class='checkbox-check'></div>").appendTo(c);

                // Generate the text
                $("<p>" + setName + "</p>").appendTo(switchContainer);
                // Add the input
                var checkbox = $("<input type='checkbox' id='Generate-Sets-" + sId + "" +
                    "' name='sets-" + setName + "' value='" + setName + "'/>").appendTo(switchContainer);
                currentSetsCheckboxes.push(checkbox);
                // Add the label
                var switchLabel = $("<label for='Generate-Sets-" + sId + "" +
                    "' class='check-" + setName.toLowerCase().replace(' ', '') + "'>").appendTo(switchContainer);

                createCheckboxSwitch(switchContainer);

                // Setup a listener for the checkbox
                checkbox.change(function () {
                    if (typeof (Storage) !== undefined) {
                        if ($(this).prop("checked")) {
                            localStorage.setItem($(this).attr("id"), "on");
                        } else {
                            localStorage.setItem($(this).attr("id"), "off");
                        }
                    } else {
                        console.log("Local storage not supported");
                    }
                });

                // Set the main switch to the previous value
                var value = localStorage.getItem(checkbox.attr("id"));
                checkbox.prop("checked", value === "on");
                checkbox.trigger('change');
            }
        }
    }

    if (currentSetsCheckboxes.length === 0) {
        return false;
        $("<p>Add your Dominion expansions from the toolbar to begin</p>").appendTo(c);
    }

    return true;
}

function selectAllSwitches() {
    // Turn all sets on
    for (setCheckbox of currentSetsCheckboxes) {
        setCheckbox.prop("checked", true);
        setCheckbox.trigger('change');
    }

}

function deselectAllSwitches() {
    // Turn all sets off
    for (setCheckbox of currentSetsCheckboxes) {
        setCheckbox.prop("checked", false);
        setCheckbox.trigger('change');
    }

}

function randomizeSwitches() {
    // Turn all sets off
    for (setCheckbox of currentSetsCheckboxes) {
        setCheckbox.prop("checked", false);
        setCheckbox.trigger('change');
    }

    // Find how many switches to turn on
    var randomSwitches = parseInt($("#Generate-Drawer-RandomizeValue").text());
    var availableSwitches = [];
    for (var si = 0; si < currentSetsCheckboxes.length; ++si) {
        availableSwitches.push(si);
    }

    // Choose the switches to turn on
    var selectedSwitches = [];
    while (selectedSwitches.length < randomSwitches && availableSwitches.length > 0) {
        var nextSwitchIndex = Math.floor(Math.random() * availableSwitches.length);
        selectedSwitches.push(availableSwitches[nextSwitchIndex]);
        availableSwitches.splice(nextSwitchIndex, 1);
    }

    for (i of selectedSwitches) {
        currentSetsCheckboxes[i].prop("checked", true);
        currentSetsCheckboxes[i].trigger('change');
    }

    hideTooltips();
}

function setupGeneratorOptions() {
    if (typeof (Storage) !== undefined) {
        // Randomize sets input
        var randomizeSetsNumber = $("#Generate-Drawer-RandomizeInput");
        var randomizeSetsValue = $("#Generate-Drawer-RandomizeValue");
        var saveRandomizeNumber = function () {
            var v = randomizeSetsValue.text();
            localStorage.setItem("Generate-Drawer-RandomizeValue", v);
        };

        randomizeSetsNumber.on("input-value-change", saveRandomizeNumber);

        var v = localStorage.getItem("Generate-Drawer-RandomizeValue");
        if (v !== undefined) {
            if (parseInt(v, 10) >= 1) {
                randomizeSetsValue.text(v);
                randomizeSetsNumber.trigger("input-value-change");
            } else {
                randomizeSetsValue.text("2");
                randomizeSetsNumber.trigger("input-value-change");
            }
        } else {
            randomizeSetsValue.text("2");
            randomizeSetsNumber.trigger("input-value-change");
        }

        // Potion clustering checkbox
        setupGeneratorCheckbox("Generate-Drawer-ClusterPotions");
        setupGeneratorCheckbox("Generate-Drawer-DistributeSets");
    }
}

function setupGeneratorCheckbox(identifier, defaultValue = true) {
    var checkbox = $("#" + identifier);
    var checkboxOn = localStorage.getItem(identifier);
    if (checkboxOn !== null) {
        checkbox.prop("checked", checkboxOn === "on");
    } else {
        checkbox.prop("checked", defaultValue);
    }

    checkbox.change(function () {
        if ($(this).prop("checked")) {
            localStorage.setItem(identifier, "on");
        } else {
            localStorage.setItem(identifier, "off");
        }
    });
}

function showError(msg) {
    clearCards();
    hideLoadingIndicator();

    isGenerating = false;
    isGeneratingFromCode = false;
    // Show the fab
    $("#Generate-Button-Fab").removeClass("hidden");
    // Hide the empty state
    $(".cards-table-state").removeClass("state-open");
    // Hide the toolbar
    $(".toolbar-cards").addClass("hidden");
    $(".toolbar-shuffle").addClass("hidden");

    $(".error-msg").text(msg);
    $(".error-msg").addClass("error-visible");
}

function clearKingdom() {
    animateCardsOut();

    isGenerating = false;
    isGeneratingFromCode = false;
    // Show the fab
    $("#Generate-Button-Fab").removeClass("hidden");
    // Hide the toolbar
    $(".toolbar-cards").addClass("hidden");
    $(".toolbar-shuffle").addClass("hidden");

    window.setTimeout(function () {
        // Show the empty state
        $(".cards-table-state").addClass("state-open");
    }, 500);
}

function clearCards() {
    $("#CardsRow1").empty();
    $("#CardsRow2").empty();
    $("#CardsTablePortrait").empty();
    $(".cards-table-basic").empty();
    $(".cards-table-specialcards").empty();
    currentKingdom = {};

    loadedCards = 0;
}

function animateCardsOut() {
    $(".cards-table").removeClass("cards-animate-in");
    $(".cards-table-basic").removeClass("cards-animate-in");
    $(".cards-table-specialcards").removeClass("cards-animate-in");
    // Remove any error message
    $(".error-msg").removeClass("error-visible");

    currentKingdom = {};
    loadedCards = 0;

    if (!isGenerating) {
        removeHash();
    }

    removeCardsTimeout = window.setTimeout(function () {
        clearCards();
    }, 1000);
}

function removeHash() {
    if (window.location.hash != "") {
        history.pushState("", document.title, window.location.pathname + window.location.search);
    }
}

function setKingdomCards(kingdomData) {
    var kingdomCards = kingdomData.kingdomCards;
    var extraSupplyCards = kingdomData.supplyCards;

    var baneCard = kingdomData.baneCard;
    var obeliskCard = kingdomData.obeliskCard;

    clearCards();
    clearTimeout(removeCardsTimeout);

    // Sort the current cards
    kingdomCards.sort(function (a, b) {
        if (a.cardType === "Event" || a.cardType === "Landmark") {
            if (b.cardType !== "Event" && b.cardType !== "Landmark") {
                return 1;
            }
        } else if (b.cardType === "Event" || b.cardType === "Landmark") {
            if (a.cardType !== "Event" && a.cardType !== "Landmark") {
                return -1;
            }
        }

        if (a.cost < b.cost) {
            return -1;
        } else if (a.cost > b.cost) {
            return 1;
        }

        if (b.altCost === "potion" && a.altCost !== "potion") {
            return -1;
        } else if (a.altCost === "potion" && b.altCost !== "potion") {
            return 1;
        }

        if (a.costDebt < b.costDebt) {
            return -1;
        } else if (a.costDebt > b.costDebt) {
            return 1;
        }

        if (a.cardName < b.cardName) {
            return -1;
        } else if (a.cardName > b.cardName) {
            return 1;
        }

        return 0;
    });

    var supplyCards = [];

    // Check for potion-cost cards
    var usePotion = false;
    for (kingdomCard of kingdomCards) {
        if (kingdomCard.altCost === "potion") {
            usePotion = true;
        }
    }

    if (usePotion) {
        supplyCards.push("Potion");
    }

    // Add extra kingdom cards
    for (extraSupplyCard of extraSupplyCards) {
        supplyCards.push(extraSupplyCard);
    }

    // Set the current cards
    currentKingdom = {
        kingdomCards: kingdomCards,
        extraSupplyCards: extraSupplyCards,
        supplyCards: supplyCards,
        obeliskCard: obeliskCard,
        baneCard: baneCard
    };

    // Add the cards to the counter
    for (card of currentKingdom.kingdomCards) {
        if (cardCounts[card.cardName] === undefined) {
            cardCounts[card.cardName] = 0;
        }

        cardCounts[card.cardName] += 1;
    }

    kingdomCardCount = [];
    for (c in cardCounts) {
        kingdomCardCount.push({ cardName: c, count: cardCounts[c] });
    }

    kingdomCardCount.sort(function (a, b) {
        if (a.count - b.count < 0) {
            return 1;
        } else if (a.count - b.count > 0) {
            return -1;
        }

        if (a.cardName < b.cardName) {
            return -1;
        } else if (a.cardName > b.cardName) {
            return 1;
        }

        return 0;
    });

    output = "";
    for (c of kingdomCardCount) {
        output += c.cardName + ": " + c.count + "\n";
    }

    gamesPlayed += 1;

    if (DEBUG === "counts" || DEBUG === "all") {
        console.log("Games Played: " + gamesPlayed);
        console.log(output);
    }

    var supplyKingdomCards = 0;

    // Create the rows for each card
    var costRows = {};
    var cardCostsCount = 0;
    var maxCardsInRow = 0;
    for (kingdomCard of currentKingdom.kingdomCards) {
        if (kingdomCard.cardType !== "Event" && kingdomCard.cardType !== "Landmark") {
            if (costRows[kingdomCard.cost] === undefined) {
                var costRowId = "CardsRowCost" + kingdomCard.cost;
                var costRow = $("<tr class='cards-table-row-outer'></tr>").appendTo($("#CardsTablePortrait"))[0];
                var cardRow = $("<div id='" + costRowId + "' class='cards-table-row'></div>");
                costRows[kingdomCard.cost] = {
                    row: cardRow.appendTo(costRow)[0],
                    cards: 1
                };

                cardCostsCount += 1;
            } else {
                costRows[kingdomCard.cost].cards += 1;
                if (costRows[kingdomCard.cost].cards > maxCardsInRow) {
                    maxCardsInRow = costRows[kingdomCard.cost].cards;
                }
            }

            supplyKingdomCards += 1;
        }
    }

    for (costRow in costRows) {
        var cardPercent = costRows[costRow].cards / maxCardsInRow;
        var maxWidth = (cardPercent * 100) + "%";
        $(costRows[costRow].row).css("max-width", maxWidth);
        $(costRows[costRow].row).parent().css("height", (100 / cardCostsCount) + "%");
    }

    var kh = Math.floor(supplyKingdomCards / 2);

    $(".cards-table").removeClass("cards-table-supply-special");
    $(".cards-table-basic").removeClass("cards-table-supply-special");

    var r1Cards = 0;
    var r2Cards = 0;
    // Add the sorted cards to the first row
    for (i = 0; i < currentKingdom.kingdomCards.length; ++i) {
        var nextCard = currentKingdom.kingdomCards[i];

        if (nextCard.cardType !== "Event" && nextCard.cardType !== "Landmark") {
            var row = i < kh
                ? 1
                : 2;
            var animIndex = row === 1
                ? i
                : i - 4;

            var isBane = nextCard === baneCard;
            var isObelisk = nextCard === obeliskCard;

            var cardRelationships = {
                isBane: isBane,
                isObelisk: isObelisk
            }

            addCard(nextCard, cardRelationships, row, animIndex);

            if (row === 1) {
                r1Cards += 1;
            } else if (row === 2) {
                r2Cards += 1;
            }
        } else {
            $(".cards-table").addClass("cards-table-supply-special");
            $(".cards-table-basic").addClass("cards-table-supply-special");
            addSpecialCard(nextCard);
        }
    }

    // Set the widths for the card rows
    if (r1Cards > r2Cards) {
        $("#CardsRow1").css("max-width", "100%");
        $("#CardsRow2").css("max-width", "83.3%");
    } else if (r2Cards > r1Cards) {
        $("#CardsRow1").css("max-width", "83.3%");
        $("#CardsRow2").css("max-width", "100%");
    } else {
        $("#CardsRow1").css("max-width", "100%");
        $("#CardsRow2").css("max-width", "100%");
    }

    $("#CardsRow1").parent().css("height", "50%");
    $("#CardsRow2").parent().css("height", "50%");

    var useSupplyPane = false;
    if (currentKingdom.supplyCards !== undefined && currentKingdom.supplyCards.length > 0) {
        useSupplyPane = true;
    }

    // Add the supply cards
    if (useSupplyPane) {
        var basicCards = $(".cards-table-basic");
        $(".cards-table").addClass("cards-table-supply");
        $(".cards-table-specialcards").addClass("cards-table-supply");
        if (currentKingdom.supplyCards !== undefined) {
            for (supplyCard of currentKingdom.supplyCards) {
                addSupplyCard(supplyCard);
            }
        }
    } else {
        $(".cards-table").removeClass("cards-table-supply");
        $(".cards-table-specialcards").removeClass("cards-table-supply");
    }

    // Update the url with the kingdom code
    updateUrlKingdomCode();

    if (REPEAT && gamesPlayed < REPEAT_MAX) {
        window.setTimeout(function () {
            generateNewKingdom();
        }, 1000);
    }
}

function updateUrlKingdomCode() {
    if (currentKingdom.kingdomCards) {
        // Generate the code
        if (typeof (Worker) !== "undefined") {
            var codeWorker = new Worker("./scripts/card-selection/kingdom-code/kingdom-code.w.js");
            var parameters = {
                request: 'cards-to-code',
                kingdomCards: currentKingdom.kingdomCards,
                supplyCards: currentKingdom.extraSupplyCards,
                obeliskCard: currentKingdom.obeliskCard,
                baneCard: currentKingdom.baneCard,

                appDir: absolutePath(window.location.href, "/"),
                totalSets: totalSets
            }

            // Start the worker
            codeWorker.postMessage(parameters);
            // Setup return message
            codeWorker.onmessage = function (event) {
                // Terminate the worker
                codeWorker.terminate();
                codeWorker = undefined;
                // Find the data
                var data = event.data;
                if (data.result === "success") {
                    // Update the url search
                    currentKingdom.kingdomCode = data.kingdomCode;
                    window.location.hash = data.kingdomCode;
                } else if (data.result === "error") {
                    console.error("Error");
                }
            }

            // Setup error message
            codeWorker.onerror = function (err) {
                // Terminate the worker
                codeWorker.terminate();
                codeWorker = undefined;
                // Show an error
                console.error(err.message + "\nAt line: " + err.lineno + " in " + err.filename);
            }
        }
    }
}

function cardNameToFilename(cardName) {
    var filename = cardName.split(" ").join("_");
    filename = filename.split("/").join("_");
    return filename + ".jpg";
}

function cardNameToUrl(cardName) {
    var filename = cardName.split(" ").join("_");
    filename = filename.split("'").join("%27");
    return filename;
}

function addCard(kingdomCard, cardRelationships, row, animIndex) {
    var rowSelector = "#CardsRow" + row;
    var costRowSelector = "#CardsRowCost" + kingdomCard.cost;
    var rowCard = $(rowSelector);
    var rowCardCost = $(costRowSelector);

    // Create a card
    var transitionStyle = "style='transition-delay: " + (animIndex * 50) + "ms'";
    var cardHtml = "<div class='cards-table-card' " + transitionStyle + "></div>";
    var cardRow = $(cardHtml).appendTo(rowCard)[0];
    var cardRowInner = $("<div class='cards-table-card-inner'></div>").appendTo(cardRow)[0];
    var cardCost = $(cardHtml).appendTo(rowCardCost)[0];
    var cardCostInner = $("<div class='cards-table-card-inner'></div>").appendTo(cardCost)[0];

    if (cardRelationships.isBane) {
        $(cardRow).addClass("card-bane");
        $(cardCost).addClass("card-bane");
    }

    if (cardRelationships.isObelisk) {
        $(cardRow).addClass("card-obelisk");
        $(cardCost).addClass("card-obelisk");
    }

    var imageDir = "./img/cards-small/";
    var cardImageDir = imageDir + kingdomCard.cardSet.toLowerCase().replace(' ', '');

    // Find the image for the card
    var cardSet = kingdomCard.set;
    var cardName = kingdomCard.cardName;
    var filename = cardNameToFilename(cardName);
    var imageUrl = cardImageDir + "/" + filename;
    // Add the image
    var cardImageHtml = "<img src=\"" + imageUrl + "\"/>";
    var cardImageRow = $(cardImageHtml).appendTo(cardRowInner)[0];
    var cardImageCost = $(cardImageHtml).appendTo(cardCostInner)[0];
    // Add the close icon
    $("<i class='material-icons'>zoom_in</i>").appendTo(cardRow);
    $("<i class='material-icons'>zoom_in</i>").appendTo(cardCost);

    // Animate in on load
    $(cardImageRow).one('load', function () {
        incrementCardLoaded();
    });

    if ($(cardImageRow).complete) {
        $(cardImageRow).load();
    }

    // Add an error callback
    $(cardImageRow).one('error', function () {
        showError("There was a problem loading the cards");
    });

    // Show a dialog when a card is clicked
    $(cardRow).on('click', function () {
        $(cardRow).trigger("mouseup");
        $(cardRow).trigger("mouseleave");
        createDialogForCard(cardImageDir, kingdomCard);
    });

    $(cardCost).on('click', function () {
        $(cardCost).trigger("mouseup");
        $(cardCost).trigger("mouseleave");
        createDialogForCard(cardImageDir, kingdomCard);
    });

    // Handle hover and active
    $(cardRow).hover(function () {
        $(cardRow).addClass("hover");
    }, function () {
        $(cardRow).removeClass("hover");
    });

    $(cardCost).hover(function () {
        $(cardCost).addClass("hover");
    }, function () {
        $(cardCost).removeClass("hover");
    });
}

function addSupplyCard(cardName) {
    var basicCards = $(".cards-table-basic");
    // Create a card
    var card = $("<div class='cards-table-card'></div>").appendTo(basicCards);
    // Find the image for the card
    var filename = cardNameToFilename(cardName);
    var imageDir = "./img/supply/";
    var imageUrl = imageDir + filename;
    // Add the image
    var cardImage = $("<img src='" + imageUrl + "'/>").appendTo(card);
    // Add the close icon
    $("<i class='material-icons'>zoom_in</i>").appendTo(card);

    // Animate in on load
    cardImage.one('load', function () {
        incrementCardLoaded();
    });

    // Add an error callback
    cardImage.one('error', function () {
        showError("There was a problem loading the cards");
    });

    // Show a dialog when a card is clicked
    card.on('click', function () {
        createDialogForCard(imageDir, { cardName: cardName });
    });

    if (cardImage.complete) {
        cardImage.load();
    }

    // Handle hover and active
    $(card).hover(function () {
        $(card).addClass("hover");
    }, function () {
        $(card).removeClass("hover");
    });
}

function addSpecialCard(kingdomCard) {
    var specialCards = $(".cards-table-specialcards");
    // Create a card
    var card = $("<div class='cards-table-card'></div>").appendTo(specialCards);

    var imageDir = "./img/cards-small/";
    if (kingdomCard.cardType === "Event") {
        imageDir = "./img/events/";
    } else if (kingdomCard.cardType === "Landmark") {
        imageDir = "./img/landmarks/";
    }

    var cardImageDir = imageDir + kingdomCard.cardSet.toLowerCase().replace(' ', '');

    // Find the image for the card
    var cardSet = kingdomCard.set;
    var cardName = kingdomCard.cardName;
    var filename = cardNameToFilename(cardName);
    var imageUrl = cardImageDir + "/" + filename;
    // Add the image
    var cardImage = $("<img src='" + imageUrl + "'/>").appendTo(card);
    // Add the close icon
    $("<i class='material-icons'>zoom_in</i>").appendTo(card);

    // Animate in on load
    cardImage.one('load', function () {
        incrementCardLoaded();
    });

    if (cardImage.complete) {
        cardImage.load();
    }

    // Add an error callback
    cardImage.one('error', function () {
        showError("There was a problem loading the cards");
    });

    // Show a dialog when a card is clicked
    card.on('click', function () {
        createDialogForCard(cardImageDir, kingdomCard);
    });

    // Handle hover and active
    $(card).hover(function () {
        $(card).addClass("hover");
    }, function () {
        $(card).removeClass("hover");
    });
}

function createDialogForCard(imageDir, kingdomCard) {
    var cardName = kingdomCard.cardName;

    var cardDetailDialog = $("<div class='dialog dialog-card-detail'></div>").appendTo($("body .main"));
    var cardDetailDialogMiddle = $("<div class='dialog-middle'></div>").appendTo(cardDetailDialog);
    var cardDetailDialogContent = $("<div class='dialog-content'></div>").appendTo(cardDetailDialogMiddle);
    var cardDetailDialogInner = $("<div class='dialog-content-inner'></div>").appendTo(cardDetailDialogContent);

    if (kingdomCard.cardType === "Event" || kingdomCard.cardType === "Landmark") {
        cardDetailDialog.addClass('dialog-card-detail-landscape');
    }

    createDialog(cardDetailDialog);

    var filename = cardNameToFilename(cardName);
    var imgSrc = imageDir + "/" + filename;
    var cardImageContainer = $("<div class='card-image-container'></div>").appendTo(cardDetailDialogInner);
    // Add the image
    cardImage = $("<img class='card-image-loading' src=\"" + imgSrc + "\">").appendTo(cardImageContainer);
    // Add the close icon
    $("<i class='material-icons'>zoom_out</i>").appendTo(cardImageContainer);

    cardImage.one('load', function () {
        cardImage.removeClass("card-image-loading");
    });

    if (cardImage.complete) {
        cardImage.load();
    }

    var cardImageToolbar = $("<div class='card-toolbar'></div>").appendTo(cardDetailDialogInner);
    // Add the close button
    var cardCloseButton = $("<button class='btn-toolbar'>").appendTo(cardImageToolbar);
    $("<i class='material-icons'>close</i>").appendTo(cardCloseButton);
    cardCloseButton.on('click', function () {
        cardDetailDialog.trigger('dialog-close');
    });

    // Add the faq button
    var cardFaqButton = $("<button class='btn-toolbar'>").appendTo(cardImageToolbar);
    $("<i class='material-icons'>public</i>").appendTo(cardFaqButton);

    cardFaqButton.attr('data-toggle', 'tooltip');
    cardFaqButton.attr('data-placement', 'right');
    cardFaqButton.attr('title', "Wiki Page");

    var cardFaq = $("<div class='card-faq'></div>").appendTo(cardDetailDialogInner);
    // Loading info for the card faq
    var url = WIKI_PREFIX + cardNameToUrl(cardName);
    var cardFaqLoading = $("<div class='card-faq-loading'></div>").appendTo(cardFaq);
    var loadingDots = $("<div class='loading-indeterminate-dots'></div>").appendTo(cardFaqLoading);
    $("<span></span><span></span><span></span>").appendTo(loadingDots);
    $("<p class='loading-heading'>Loading</p>").appendTo(cardFaqLoading);
    var cardFaqLoadingText = $("<p class='loading-text'></p>").appendTo(cardFaqLoading);
    cardFaqLoadingText.text(cardName);

    cardFaqButton.on('click', function () {
        hideTooltips();

        cardDetailDialogContent.addClass("faq-visible");

        window.setTimeout(function () {
            // Load the iframe
            var faqFrame = $("<iframe src=\"" + url + "\"></iframe>").appendTo(cardFaq);
            // Animate the iframe in on load
            faqFrame.on('load', function () {
                faqFrame.addClass("card-faq-animate-in");
            });
        }, 1000);
    });

    // Add the option for split pile card
    var hasSplitCards = kingdomCard.splitCards !== undefined && kingdomCard.splitCards.length > 0;
    var isSplitPile = kingdomCard.cardType === "Split Pile";
    if (isSplitPile || hasSplitCards) {
        if (isSplitPile) {
            var cardRandomizerButton = $("<button class='btn-toolbar'>").appendTo(cardImageToolbar);
            $("<i class='material-icons'>account_balance</i>").appendTo(cardRandomizerButton);

            cardRandomizerButton.attr('data-toggle', 'tooltip');
            cardRandomizerButton.attr('data-placement', 'right');
            cardRandomizerButton.attr('title', "Kingdom Card");

            cardRandomizerButton.click(function () {
                hideTooltips();

                cardRandomizerButton.addClass("hidden");

                if (currentIndex >= 0) {
                    cardImage.addClass("split-fade-out");

                    window.setTimeout(function () {
                        hideTooltips();

                        currentIndex = -1;
                        cardImage.attr("src", imgSrc);

                        // Update the URL
                        url = WIKI_PREFIX + cardNameToUrl(cardName);
                        cardFaqLoadingText.text(cardName);

                        cardImage.one('load', function () {
                            window.setTimeout(function () {
                                cardImage.removeClass("split-fade-out");
                            }, 125);
                        });

                        if (cardImage.complete) {
                            cardImage.load();
                        }
                    }, 125);
                }
            });
        }

        var cardSplitButtonHtml = "<button class='btn-toolbar' style='margin-top: 5px'>";
        var cardSplitButton = $(cardSplitButtonHtml).appendTo(cardImageToolbar);

        // Find all the cards in the split pile
        var splitCards = [];
        var isMultiCard = false;

        if (!isSplitPile) {
            splitCards.push(cardName);
        }

        if (hasSplitCards) {
            for (splitCard of kingdomCard.splitCards) {
                splitCards.push(splitCard);
            }

            $("<i class='material-icons'>navigate_next</i>").appendTo(cardSplitButton);
            isMultiCard = true;

            cardSplitButton.attr('data-toggle', 'tooltip');
            cardSplitButton.attr('data-placement', 'right');
            cardSplitButton.attr('title', "Next Card");
        } else {
            for (splitCard of cardName.split("/")) {
                console.log(splitCard);
                splitCards.push(splitCard);
            }

            $("<i class='material-icons'>flip</i>").appendTo(cardSplitButton);

            cardSplitButton.attr('data-toggle', 'tooltip');
            cardSplitButton.attr('data-placement', 'right');
            cardSplitButton.attr('title', "Split Card");
        }

        console.log(splitCards);

        var splitFilename = cardNameToFilename(splitCards[0]);
        var splitImgSrc = imageDir + "/split/" + splitFilename;
        if (!isSplitPile) {
            splitImgSrc = imageDir + "/" + splitFilename;
        }

        cardImage.attr("src", splitImgSrc);

        // Update the URL
        url = WIKI_PREFIX + cardNameToUrl(splitCards[0]);
        cardFaqLoadingText.text(splitCards[0]);

        var currentIndex = 0;
        cardSplitButton.click(function () {
            hideTooltips();

            if (isMultiCard) {
                cardImage.addClass("multi-fade-out");
            } else {
                cardImage.addClass("split-fade-out");
            }

            if (isSplitPile) {
                cardRandomizerButton.removeClass("hidden");
            }

            window.setTimeout(function () {
                hideTooltips();

                currentIndex = (currentIndex + 1) % splitCards.length;
                var splitFilename = cardNameToFilename(splitCards[currentIndex]);
                var splitImgSrc = imageDir + "/split/" + splitFilename;
                if (!isSplitPile && currentIndex === 0) {
                    splitImgSrc = imageDir + "/" + splitFilename;
                }

                cardImage.attr("src", splitImgSrc);

                // Update the URL
                url = WIKI_PREFIX + cardNameToUrl(splitCards[currentIndex]);
                cardFaqLoadingText.text(splitCards[currentIndex]);

                if (isMultiCard) {
                    cardImage.addClass("multi-fade-in");
                }

                cardImage.one('load', function () {
                    window.setTimeout(function () {
                        hideTooltips();

                        cardImage.removeClass("split-fade-out");
                        cardImage.removeClass("multi-fade-out");
                        cardImage.removeClass("multi-fade-in");
                    }, 125);
                });

                if (cardImage.complete) {
                    cardImage.load();
                }
            }, 125);
        });
    }

    // Add the close button for the faq
    var minimizeButton = $("<div type='cancel' class='btn-icon btn-dialog-minimize'>" +
        "<i class='material-icons'>close</i></div>").appendTo(cardDetailDialogInner);
    minimizeButton.click(function () {
        cardDetailDialog.trigger('dialog-close');
    });

    cardImageContainer.on('click', function () {
        cardDetailDialog.trigger('dialog-close');
    });

    $(cardDetailDialog).find('[data-toggle="tooltip"]').tooltip({
        container: $(".main"),
        trigger: 'manual',
        constraints: [
            {
                to: "window",
                pin: true
            }
        ]
    });

    window.setTimeout(function () {
        $(cardDetailDialog).find('[data-toggle="tooltip"]').tooltip('show');

        window.setTimeout(function () {
            $(cardDetailDialog).find('[data-toggle="tooltip"]').tooltip('hide');
        }, 100);
    }, 10);
}

function incrementCardLoaded() {
    ++loadedCards;
    if (loadedCards >= currentKingdom.kingdomCards.length + currentKingdom.supplyCards.length) {
        window.setTimeout(function () {
            $(".cards-table").addClass("cards-animate-in");
            $(".cards-table-basic").addClass("cards-animate-in");
            $(".cards-table-specialcards").addClass("cards-animate-in");
            // Hide the loading indicator
            hideLoadingIndicator();
            // Show the toolbar
            $(".toolbar-cards").removeClass("hidden");
            $(".toolbar-cards").prop("disabled", false);

            if (!isGeneratingFromCode) {
                $(".toolbar-shuffle").removeClass("hidden");
                $(".toolbar-shuffle").prop("disabled", false);
            } else {
                $(".toolbar-shuffle").addClass("hidden");
                $(".toolbar-shuffle").prop("disabled", true);
            }

            isGeneratingFromCode = false;
        }, 200);

        isGenerating = false;
    }
}

function hideLoadingIndicator() {
    $("#LoadingIndicator").removeClass("loading");

    window.setTimeout(function () {
        $("#LoadingIndicator").removeClass("animating");
    }, 300);
}

function setLoadingProgress(progress) {
    if (progress < 0) {
        progress = 0;
    }

    var dataProgress = $("#LoadingIndicator").attr("data-progress");
    console.log(dataProgress, progress, progress > dataProgress);
    if (progress > dataProgress || progress === 0) {
        $("#LoadingIndicator").attr("data-progress", progress);
    }
}

// The code dialog
codeDialog = undefined;
codeScanDialog = undefined;

// Create the code dialog
function openCodeDialog() {
    if (codeDialog === undefined) {
        codeDialog = $("<div class='dialog dialog-code'></div>").appendTo($("body .main"));
        var codeDialogMiddle = $("<div class='dialog-middle'></div>").appendTo(codeDialog);
        var codeDialogContent = $("<div class='dialog-content'></div>").appendTo(codeDialogMiddle);
        var codeDialogInner = $("<div class='dialog-content-inner'></div>").appendTo(codeDialogContent);

        createDialog(codeDialog);

        // Create a title
        $("<h1>Kingdom Code</h1>").appendTo(codeDialogInner);
        // Add the minimize buttons
        var minimizeButton = $("<div type='cancel' class='btn-icon btn-dialog-minimize'>" +
            "<i class='material-icons'>close</i></div>").appendTo(codeDialogInner);
        minimizeButton.click(function () {
            codeDialog.trigger('dialog-close');
        });

        // Add a description
        $("<p>Kingdom codes are a way to share sets of cards with other players " +
            "in a game</p>").appendTo(codeDialogInner);

        var codeContainer = $("<div class='kingdom-code-container'></div>").appendTo(codeDialogInner);

        if (currentKingdom.kingdomCode) {
            // Set the options for the new code
            var codeOptions = {
                text: currentKingdom.kingdomCode,
                background: "#fff",
                fill: "#111",

                render: 'image',
                ecLevel: 'H',

                minVersion: 3,
                maxVersion: 40,

                size: 1200,

                radius: 0.1
            }

            // Generate a code
            codeContainer.qrcode(codeOptions);
        }

        // Add a direct link
        var directLink = window.location.href;
        $("<a href='" + directLink + "'>" + directLink + "</a>").appendTo(codeDialogInner);

        var scanButton = $("<div class='btn'>Copy Link to Clipboard</div>").appendTo(codeDialogInner);
        var scanButtonMessage = $("<div class='btn-message'>Copied Link!</div>").appendTo(scanButton);
        scanButton.on('click', function () {
            copyToClipboard(window.location.href);
            scanButtonMessage.addClass("visible");

            window.setTimeout(function () {
                scanButtonMessage.removeClass("visible");
            }, 1000);
        });

        codeDialog.one('dialog-close', function () {
            codeDialog = undefined;
        });
    }
}

const copyToClipboard = str => {
    const el = document.createElement('textarea');
    el.value = str;
    document.body.appendChild(el);
    el.select();
    iosCopyToClipboard(el);
    document.body.removeChild(el);
};

function iosCopyToClipboard(el) {
    var oldContentEditable = el.contentEditable,
        oldReadOnly = el.readOnly,
        range = document.createRange();

    el.contentEditable = true;
    el.readOnly = true;
    range.selectNodeContents(el);

    var s = window.getSelection();
    s.removeAllRanges();
    s.addRange(range);

    el.setSelectionRange(0, 999999); // A big number, to cover anything that could be inside the element.

    el.contentEditable = oldContentEditable;
    el.readOnly = oldReadOnly;

    document.execCommand('copy');
}

function openScanDialog() {
    if (codeScanDialog === undefined) {
        codeScanDialog = $("<div class='dialog dialog-code-scan'></div>").appendTo($("body .main"));
        var codeScanDialogMiddle = $("<div class='dialog-middle'></div>").appendTo(codeScanDialog)[0];
        var codeScanDialogContent = $("<div class='dialog-content'></div>").appendTo(codeScanDialogMiddle)[0];
        var codeScanDialogInner = $("<div class='dialog-content-inner'></div>").appendTo(codeScanDialogContent)[0];

        createDialog(codeScanDialog);

        // Create a title
        $("<h1>Scan Code</h1>").appendTo(codeScanDialogInner);
        // Add the minimize buttons
        var minimizeButton = $("<div type='cancel' class='btn-icon btn-dialog-minimize'>" +
            "<i class='material-icons'>close</i></div>").appendTo(codeScanDialogInner);
        minimizeButton.on('click', function () {
            codeScanDialog.trigger('dialog-close');
        });

        // Add a description
        $("<p>Kingdom codes are generated with each kingdom, " +
            "scan one here to view the cards</p>").appendTo(codeScanDialogInner);

        var qrInterval = undefined;
        var currentStream = undefined;
        // Add a video for the camera
        var cameraVideo = $("<video style='display: none; transform: scale(-1 , 1);' autoplay></video>").appendTo(codeScanDialogInner)[0];
        // Add an invisible canvas to do the processing
        var processingCanvas = $("<canvas id='qr-canvas'></canvas>").appendTo(codeScanDialogInner)[0];
        if (navigator.mediaDevices !== undefined) {
            var isStreaming = false;

            navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: {
                        ideal: "environment"
                    }
                },
                audio: false
            }).then(function (stream) {
                currentStream = stream;
                cameraVideo.srcObject = stream;
                $(cameraVideo).css("display", "");
                cameraVideo.play();
            }).catch(function (err) {
                console.log("Could not access camera");
            });

            cameraVideo.addEventListener('canplay', function (ev) {
                if (!isStreaming) {
                    cameraVideo.removeAttribute("width");
                    cameraVideo.removeAttribute("height");
                    processingCanvas.setAttribute("width", cameraVideo.videoWidth);
                    processingCanvas.setAttribute("height", cameraVideo.videoHeight);

                    isStreaming = true;

                    qrInterval = window.setInterval(function () {
                        var context = processingCanvas.getContext('2d');
                        context.drawImage(cameraVideo, 0, 0, processingCanvas.width, processingCanvas.height);

                        // True to decode the image
                        try {
                            qrcode.decode();
                            clearInterval(qrInterval);
                        } catch (err) {
                            // No code found
                        };
                    }, 500);
                }
            }, false);
        }

        // Set a callback
        qrcode.callback = function (code) {
            console.log(code);
            loadKingdomFromCode(code);
        };

        // Add instructions
        $("<p>For best results the code should be in focus, centered, and roughly " +
            "one quarter of the photo. Make sure that the sending device's brightness " +
            "is at maximum so that the code is readable.</p>").appendTo(codeScanDialogInner);

        // File picker
        var photoInputLoading = $("<div class='photoinput-loading'></div>").appendTo(codeScanDialogInner)[0];
        $("<p class='photoinput-loading-text'>Scanning Photo</p>").appendTo(photoInputLoading);
        $("<p class='photoinput-loading-error'>Could not find code</p>").appendTo(photoInputLoading);

        var photoInput = $("<input type='file' id='CodePhotoInput' accept='image/*' capture='camera'>").appendTo(codeScanDialogInner)[0];
        var photoInputLabel = $("<label class='btn' for='CodePhotoInput'>Take a Photo</label>").appendTo(codeScanDialogInner)[0];

        photoInput.addEventListener('change', function (e) {
            $(photoInputLoading).addClass("loading");
            $(photoInputLoading).removeClass("error");

            window.setTimeout(function () {
                var context = processingCanvas.getContext('2d');
                context.clearRect(0, 0, processingCanvas.width, processingCanvas.height);

                var img = new Image;
                img.onload = function () {
                    processingCanvas.setAttribute("width", img.width);
                    processingCanvas.setAttribute("height", img.height);
                    context.drawImage(img, 0, 0, processingCanvas.width, processingCanvas.height);

                    try {
                        qrcode.decode();
                    } catch (err) {
                        console.log("No code found");
                        // No code found
                        $(photoInputLoading).removeClass("loading");
                        $(photoInputLoading).addClass("error");
                    }
                }

                var file = e.target.files[0];
                img.src = URL.createObjectURL(file);
            }, 400);
        });

        codeScanDialog.one('dialog-close', function () {
            if (currentStream !== undefined) {
                // Stop the tracks
                for (track of currentStream.getTracks()) {
                    track.stop();
                }
            }

            if (qrInterval !== undefined) {
                clearInterval(qrInterval);
            }

            codeScanDialog = undefined;
        });
    }
}

// Kingdom codes are base-11 digits, with each card seperated by 'a',
// and each card consisting of a two-digit set id, and a card id

// Loads a kingdom from a code
function loadKingdomFromCode(kingdomCode) {
    if (!isGenerating && !isGeneratingFromCode && cardWorker === undefined) {
        isGenerating = true;
        isGeneratingFromCode = true;

        // Clear the current cards
        if (currentKingdom.kingdomCards) {
            animateCardsOut();
        } else {
            // Remove any error message
            $(".error-msg").removeClass("error-visible");
        }

        // Close the fab card
        $("#Generate-Button-Fab").trigger('card-close');

        // Start the loading
        $("#LoadingIndicator").addClass("loading");
        $("#LoadingIndicator").addClass("animating");
        setLoadingProgress(0);

        // Stop the toolbar buttons from being pressed
        $(".toolbar-cards").prop("disabled", true);
        $(".toolbar-shuffle").prop("disabled", true);

        // Close the code dialog
        if (codeDialog !== undefined) {
            codeDialog.trigger('dialog-close');
        }

        if (codeScanDialog !== undefined) {
            codeScanDialog.trigger('dialog-close');
        }

        if (typeof (Worker) !== "undefined") {
            if (cardWorker === undefined) {
                cardWorker = new Worker("./scripts/card-selection/kingdom-code/kingdom-code.w.js");

                var parameters = {
                    request: 'code-to-cards',
                    kingdomCode: kingdomCode,
                    totalSets: totalSets,
                    appDir: absolutePath(window.location.href, "/")
                }

                // Start the worker
                cardWorker.postMessage(parameters);
                // Hide the fab
                $("#Generate-Button-Fab").addClass("hidden");
                // Show the empty state
                $(".cards-table-state").removeClass("state-open");

                // Setup return message
                cardWorker.onmessage = function (event) {
                    // Find the data
                    data = event.data;
                    if (data.result === "success") {
                        // Terminate the worker
                        cardWorker.terminate();
                        cardWorker = undefined;

                        setLoadingProgress(17);

                        window.setTimeout(function () {
                            setKingdomCards(data);
                        }, 500);
                    } else if (data.result === "progress") {
                        setLoadingProgress(data.progress);
                    } else if (data.result === "error") {
                        // Terminate the worker
                        cardWorker.terminate();
                        cardWorker = undefined;

                        showError(data.message);
                        // Show the fab
                        $("#Generate-Button-Fab").removeClass("hidden");
                    }
                }

                // Setup error message
                cardWorker.onerror = function (err) {
                    if (cardWorker !== undefined) {
                        // Terminate the worker
                        cardWorker.terminate();
                        cardWorker = undefined;
                    }

                    // Show an error
                    showError("There was a problem loading the code");
                    console.error(err.message + "\nAt line: " + err.lineno + " in " + err.filename);

                    // Show the fab
                    $("#Generate-Button-Fab").removeClass("hidden");
                }
            }
        }
    }
}
