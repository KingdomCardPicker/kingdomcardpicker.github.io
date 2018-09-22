BASECODE = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

function closeWithError(msg) {
    postMessage({result: 'error', message: msg});
}

self.addEventListener('message', function(event) {
    parameters = event.data;
    importScripts("BigInteger.min.js");
    importScripts("base-convert.js");

    if (parameters.request === "cards-to-code") {
        convertKingdomToCode(parameters);
    } else if (parameters.request === "code-to-cards") {
        convertCodeToKingdom(parameters);
    } else {
        closeWithError("Invalid request");
    }
});

// Converts the current kingdom cards to an alphaneumeric code
function convertKingdomToCode(parameters) {
    importScripts(parameters.appDir + "/scripts/marknote.js");

    var cardNumbers = [];
    var baneCardId = undefined;
    var obeliskCardId = undefined;
    // Generate a number for each card in the kingdom
    for (card of parameters.kingdomCards) {
        var setId = parameters.totalSets[card.cardSet].toString();
        while (setId.length < 2) {
            setId = "0" + setId;
        }

        var n = setId + card.cardNumber.toString();
        cardNumbers.push(n);

        if (parameters.baneCard === card) {
            baneCardId = n;
        }

        if (parameters.obeliskCard === card) {
            obeliskCardId = n;
        }
    }

    var supplyCardNumbers = [];
    // Generate a number for the supply cards
    var xmlParser = new marknote.Parser();
    var doc = xmlParser.parseURL(parameters.appDir + "/data/supply.xml", null, "GET");
    if (xmlParser.getXHRStatus() === 200) {
        var base = doc.getRootElement();
        var xmlSupplyCards = base.getChildElements("card");
        for (xmlSupplyCard of xmlSupplyCards) {
            xmlSupplyCardName = xmlSupplyCard.getAttributeValue("name");
            xmlSupplyCardNumber = xmlSupplyCard.getAttributeValue("n");
            for (supplyCardName of parameters.supplyCards) {
                if (supplyCardName === xmlSupplyCardName) {
                    supplyCardNumbers.push(xmlSupplyCardNumber);
                }
            }
        }
    }

    // Join the card numbers into a single base-11 number
    var supplyCardsId = supplyCardNumbers.join('a');
    var kingdomCardsId = cardNumbers.join('a');
    var kingdomId = "a" + supplyCardsId + "aa" + kingdomCardsId;
    if (baneCardId !== undefined) {
        kingdomId += "aa" + baneCardId;
        if (obeliskCardId !== undefined) {
            kingdomId += "a" + obeliskCardId;
        }
    } else if (obeliskCardId !== undefined) {
        kingdomId += "aa" + "0" + "a" + obeliskCardId;
    }

    var kingdomCode = baseConvert(kingdomId, 11, BASECODE.length, BASECODE);

    // Send the cards to the main process
    postMessage({result: "success", kingdomCode: kingdomCode});
}

function convertCodeToKingdom(parameters) {
    importScripts(parameters.appDir + "/scripts/marknote.js");
    importScripts(parameters.appDir + "/scripts/card-selection/xml-to-card.js");

    postMessage({result: "progress", progress: 1});

    kingdomCode = parameters.kingdomCode;

    // Convert the code back to base 11
    var kingdomId = baseConvert(kingdomCode, BASECODE.length, 11, BASECODE).substring(1).split('aa');
    var supplyCardsId = kingdomId[0];
    var kingdomCardsId = kingdomId[1];
    var specialCardsId = kingdomId[2];

    var baneCardId = undefined;
    var obeliskCardId = undefined;
    if (specialCardsId !== undefined) {
        var specialCardIds = specialCardsId.split('a');
        baneCardId = specialCardIds[0];
        obeliskCardId = specialCardIds[1];
    }

    var supplyCardIds = supplyCardsId.split('a');
    var cardIds = kingdomCardsId.split('a');

    // Error if not enough cards
    if (cardIds.length < 10) {
        closeWithError("The kingdom code was not valid");
    }

    postMessage({result: "progress", progress: 2});

    // Seperate the cards by their sets
    var setCards = {};
    var setBaneCard = {};
    var setObeliskCard = {};
    for (id of cardIds) {
        // Get the set code
        setCode = id.substring(0, 2);
        if (setCards[setCode] === undefined) {
            setCards[setCode] = [];
        }

        // Get the card code
        cardCode = id.substring(2);
        setCards[setCode].push(cardCode);

        if (baneCardId !== undefined && id === baneCardId) {
            setBaneCard.setCode = setCode;
            setBaneCard.cardCode = cardCode;
        }

        if (obeliskCardId !== undefined && id === obeliskCardId) {
            setObeliskCard.setCode = setCode;
            setObeliskCard.cardCode = cardCode;
        }
    }

    postMessage({result: "progress", progress: 3});

    kingdomCards = [];
    var baneCard = undefined;
    var obeliskCard = undefined;
    // Parse each set and add the cards
    for (set in setCards) {
        var setName = "";
        var setNameId = undefined;
        for (name in parameters.totalSets) {
            var setId = parameters.totalSets[name].toString();
            while (setId.length < 2) {
                setId = "0" + setId;
            }

            if (set === setId) {
                setName = name;
                setNameId = setId;
            }
        }

        var filename = setName.toLowerCase().replace(' ', '') + ".xml";
        var fileUrl = parameters.appDir + "/data/cards/" + filename;
        var xmlParser = new marknote.Parser();
        var doc = xmlParser.parseURL(fileUrl, null, "GET");
        if (xmlParser.getXHRStatus() === 200) {
            var base = doc.getRootElement();
            var setName = base.getAttributeValue("name");

            var xmlSets = base.getChildElements();
            for (xmlSet of xmlSets) {
                var xmlCards = xmlSet.getChildElements("card");
                for (xmlCard of xmlCards) {
                    cardId = xmlCard.getAttributeValue("n");

                    for (kingdomCardId of setCards[set]) {
                        if (kingdomCardId === cardId) {
                            cardData = xmlToCardData(xmlCard, setName);
                            kingdomCards.push(cardData);

                            if (setBaneCard.setCode === setNameId && setBaneCard.cardCode === cardId) {
                                baneCard = cardData;
                            }

                            if (setObeliskCard.setCode === setNameId && setObeliskCard.cardCode === cardId) {
                                obeliskCard = cardData;
                            }
                        }
                    }
                }
            }
        }
    }

    postMessage({result: "progress", progress: 6});

    supplyCards = [];
    // Parse supply cards
    var xmlParser = new marknote.Parser();
    var doc = xmlParser.parseURL(parameters.appDir + "/data/supply.xml", null, "GET");
    if (xmlParser.getXHRStatus() === 200) {
        var base = doc.getRootElement();
        var xmlSupplyCards = base.getChildElements("card");
        for (xmlSupplyCard of xmlSupplyCards) {
            xmlSupplyCardName = xmlSupplyCard.getAttributeValue("name");
            xmlSupplyCardNumber = xmlSupplyCard.getAttributeValue("n");
            for (supplyCardId of supplyCardIds) {
                if (xmlSupplyCardNumber === supplyCardId) {
                    supplyCards.push(xmlSupplyCardName);
                }
            }
        }
    }

    postMessage({result: "progress", progress: 8});

    if (kingdomCards.length < 10) {
        closeWithError("Not enough cards");
    }

    var result = {
        result: "success",
        kingdomCards: kingdomCards,
        supplyCards: supplyCards,
        obeliskCard: obeliskCard,
        baneCard: baneCard
    }

    // Send the cards to the main process
    postMessage(result);
}
