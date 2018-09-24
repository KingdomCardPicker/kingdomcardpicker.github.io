const PROGRESS_LOAD = 1;
const PROGRESS_SETS = 2;
const PROGRESS_SETS_TOTAL = 4;
const PROGRESS_CARDS = 6;

const POTION_FACTOR = [0, 2, 1, 0, -1];

function closeWithError(msg) {
    postMessage({ result: 'error', message: msg });
}

self.addEventListener('message', function (event) {
    postMessage({ result: "progress", progress: 0 });

    var parameters = event.data;
    console.log(parameters.appDir);
    importScripts(parameters.appDir + "/app/scripts/marknote.js");
    importScripts(parameters.appDir + "/app/scripts/card-selection/xml-to-card.js");

    postMessage({ result: "progress", progress: PROGRESS_LOAD });

    var synergyParser = new marknote.Parser();
    var synergyDoc = synergyParser.parseURL(parameters.appDir + "/app/data/synergies.xml", null, "GET");
    if (synergyParser.getXHRStatus() === 200) {
        var root = synergyDoc.getRootElement();
        var synergiesXml = root.getChildElements("s");

        var synergies = [];
        for (sXml of synergiesXml) {
            var s = {
                c1: sXml.getAttributeValue("c1"),
                c2: sXml.getAttributeValue("c2"),
                r: parseInt(sXml.getContentAt(0))
            }

            synergies.push(s);
        }

        var similarIgnoreParser = new marknote.Parser();
        var similarIgnoreDoc = similarIgnoreParser.parseURL(parameters.appDir + "/app/data/similarignore.xml", null, "GET");
        if (similarIgnoreParser.getXHRStatus() === 200) {
            var similarIgnoreXml = similarIgnoreDoc.getRootElement().getChildElements("type");

            var similarIgnore = [];
            for (siXml of similarIgnoreXml) {
                similarIgnore.push(siXml.getContentAt(0).toString());
            }

            generateCards(parameters, synergies, similarIgnore);
        }
    } else {
        closeWithError("There was a problem parsing card synergies");
    }
});

function generateCards(parameters, synergies, similarIgnore) {
    var availableCards = [];

    var cardsWithCost = {};

    var parsedSets = 0;
    for (set of parameters.sets) {
        var filename = set.toLowerCase().replace(' ', '') + ".xml";
        var fileUrl = parameters.appDir + "/app/data/cards/" + filename;
        var xmlParser = new marknote.Parser();
        var doc = xmlParser.parseURL(fileUrl, null, "GET");
        if (xmlParser.getXHRStatus() === 200) {
            var base = doc.getRootElement();
            var setName = base.getAttributeValue("name");

            var xmlSets = base.getChildElements();
            for (xmlSet of xmlSets) {
                var setVersion = xmlSet.getAttributeValue("version");
                var hasVersion = parameters[setName + setVersion];
                if (setVersion === "" || hasVersion === "on") {
                    var xmlCards = xmlSet.getChildElements("card")
                    for (xmlCard of xmlCards) {
                        cardData = xmlToCardData(xmlCard, setName);
                        availableCards.push(cardData);

                        // Increment the card costs
                        if (cardsWithCost[cardData.cost] === undefined) {
                            cardsWithCost[cardData.cost] = 0;
                        }

                        cardsWithCost[cardData.cost] += 1;
                    }
                }
            }
        } else {
            closeWithError("There was a problem parsing the cards for " + set);
        }

        parsedSets += 1;
        var roundProgress = Math.round((parsedSets * PROGRESS_SETS_TOTAL) / parameters.sets.length);

        postMessage({
            result: "progress",
            progress: PROGRESS_SETS + roundProgress - 1
        });
    }

    postMessage({
        result: "progress",
        progress: PROGRESS_SETS + PROGRESS_SETS_TOTAL
    });

    generateKingdom(parameters, synergies, availableCards, cardsWithCost, similarIgnore);
}

function generateKingdom(parameters, synergies, availableCards, cardsWithCost, similarIgnore) {
    var kingdomCards = [];
    var output = "";

    var needBane = false;
    var baneCard = undefined;

    var kingdomSize = 10;

    var potionCards = 0;
    var specialCards = 0;

    var rejectedCount = 0;

    if (availableCards.length === 0) {
        closeWithError("No sets were selected");
    }

    while (kingdomCards.length < kingdomSize) {
        var successOutput = "";
        // Construct a list of possible synergies, given the current cards
        var typeChances = findTypeChances(kingdomCards, availableCards, synergies);
        // Find the total chance
        var totalChance = 0;
        for (typeChance of typeChances) {
            totalChance += typeChance.chance;
        }

        var randomness = parameters.randomness;
        if (randomness === undefined || randomness < 0.001) {
            randomness = 0.001;
        }

        if (availableCards.length === 0) {
            closeWithError("Not enough cards are in the selected sets");
        } else {
            var card = undefined;
            var cardIndex = undefined;

            if (totalChance <= Math.random() * randomness || Math.random() <= 0.001 || rejectedCount >= 1000) {
                // Pick a card at random
                cardIndex = Math.floor(Math.random() * availableCards.length);
                card = availableCards[cardIndex];

                successOutput += card.cardName + " chosen at random" + "\n\n";
            } else {
                var chance = Math.random() * totalChance;

                var type = undefined;
                var typeR = 0;
                var originalType = undefined;
                var currentChance = 0;
                for (typeChance of typeChances) {
                    if (type === undefined) {
                        currentChance += typeChance.chance;
                        if (currentChance >= chance) {
                            type = typeChance.cardType;
                            typeR = typeChance.chance;
                            originalType = typeChance.c1;
                        }
                    }
                }

                if (type !== undefined) {
                    var cardsOfType = [];
                    for (ci = 0; ci < availableCards.length; ++ci) {
                        var c = availableCards[ci];
                        for (t of c.types) {
                            if (t === type) {
                                var typeCard = {
                                    card: c,
                                    i: ci
                                }

                                cardsOfType.push(typeCard);
                            }
                        }
                    }

                    var cardIndex = Math.floor(Math.random() * cardsOfType.length);
                    if (cardIndex > availableCards.length - 1) {
                        cardIndex = availableCards.length - 1;
                    }

                    var typeCard = cardsOfType[cardIndex];
                    var newCard = typeCard.card;

                    // Check based on existing cards that are similar to new card
                    var globalSimilarity = 0;
                    var globalSharedCost = 0;
                    var globalSharedSets = 0;
                    for (ci = 0; ci < kingdomCards.length; ++ci) {
                        var c = kingdomCards[ci];

                        // Find shared traits
                        var sharedTraits = 0;
                        for (t1 of c.types) {
                            for (t2 of newCard.types) {
                                // Find similarities
                                if (t1 === t2) {
                                    var isIgnore = false;
                                    for (it of similarIgnore) {
                                        if (t1 === it) {
                                            isIgnore = true;
                                        }
                                    }

                                    if (!isIgnore) {
                                        sharedTraits += 1;
                                    }
                                }
                            }
                        }

                        var scaleFactor = Math.sqrt(c.types.length) + Math.sqrt(newCard.types.length);
                        var similarity = sharedTraits / scaleFactor;
                        globalSimilarity += similarity;

                        if (c.cost === newCard.cost && c.altCost !== "potion" && newCard.altCost !== "potion") {
                            globalSharedCost += 1;
                        }

                        if (c.cost === newCard.cost && c.altCost === "potion" && newCard.altCost === "potion") {
                            globalSharedCost += 2;
                        }

                        if (c.cardSet === newCard.cardSet) {
                            globalSharedSets += 1;
                        }
                    }

                    var isNewCardValid = true;

                    var sharedCostHighFactor = Math.pow(globalSharedCost, 2) * (Math.pow(Math.abs(newCard.cost - 3), 0.5) + 1);
                    if (globalSharedCost === 0) {
                        sharedCostHighFactor -= 0.3;
                    } else if (globalSharedCost >= 3) {
                        sharedCostHighFactor += Math.pow(globalSharedCost, 2) * 0.2;

                        if (globalSharedCost >= 5) {
                            isNewCardValid = false;
                        }
                    }

                    var sharedCostFactor = sharedCostHighFactor / Math.pow(cardsWithCost[newCard.cost], 0.75);
                    var costLengthFactor = Math.pow(kingdomCards.length, 0.35);
                    var costFactor = sharedCostFactor / costLengthFactor;

                    globalSimilarity += costFactor;

                    if (parameters.distributeSets) {
                        if (parameters.sets.length > 1) {
                            var setFactor = (Math.pow(globalSharedSets, 2) / Math.pow(kingdomCards.length, 1.2)) * 0.5;
                            globalSimilarity += setFactor;
                        }
                    }

                    if (parameters.clusterPotions) {
                        var potionFactor = POTION_FACTOR[potionCards];
                        if (potionFactor === undefined) {
                            potionFactor = -10;
                        }
                    }

                    if (newCard.altCost === "potion") {
                        if (potionCards === 0) {
                            if (kingdomCards.length - specialCards >= 7) {
                                isNewCardValid = false;
                            }

                            globalSimilarity += 0.2;
                        } else {
                            globalSimilarity -= potionFactor;
                        }
                    } else if (potionFactor > 0) {
                        globalSimilarity += potionFactor * 0.75;
                    }

                    if (newCard.cardType === "Event" || newCard.cardType === "Landmark") {
                        var specialFactor = (Math.pow(availableCards.length, 0.02) - 1);
                        globalSimilarity += specialFactor;
                    }

                    // Find all cards with the same type as the original
                    var originalTypeCards = []
                    for (c of kingdomCards) {
                        for (t of c.types) {
                            if (t == originalType) {
                                originalTypeCards.push(c.cardName);
                            }
                        }
                    }

                    // Reduce similarity for appropriateness
                    globalSimilarity -= Math.pow(kingdomCards.length, 0.5) * Math.pow(totalChance, 0.5) * 0.001;

                    // Check against global similarity
                    if (isNewCardValid && globalSimilarity < (Math.random() * 0.9) + 0.4) {
                        card = newCard;
                        cardIndex = typeCard.i;

                        var chosenCard = "'" + type + "' (" + card.cardName + ")";
                        var originalCard = "'" + originalType + "' (" + originalTypeCards.join(", ") + ")";

                        if (parameters.debug === "all") {
                            console.log(card.cardName + " chosen : " + globalSimilarity.toFixed(2));
                        }

                        successOutput += chosenCard + " chosen because of " + originalCard + "\n    similarity: " + globalSimilarity.toFixed(2) + "\n\n";
                    } else {
                        rejectedCount += 1;
                        if (parameters.debug === "all") {
                            if (isNewCardValid) {
                                console.log(newCard.cardName + " rejected : " + globalSimilarity.toFixed(2));
                            } else {
                                console.log(newCard.cardName + " rejected because invalid");
                            }
                        }
                    }
                }
            }

            if (card !== undefined) {
                var addCard = false;
                if (needBane) {
                    if (card.cost === "2" || card.cost === "3") {
                        if (card.altCost !== "potion") {
                            if (card.cardType !== "Event" && card.cardType !== "Landmark") {
                                baneCard = card;
                                needBane = false;

                                addCard = true;

                                successOutput += card.cardName + " chosen as bane for Young Witch\n\n";
                            } else {
                                output += card.cardName + " rejected as bane due to card type\n\n";
                            }
                        } else {
                            output += card.cardName + " rejected as bane due to potion\n\n";
                        }
                    } else {
                        output += card.cardName + " rejected as bane due to cost\n\n";
                    }
                } else {
                    if (card.cardName === "Young Witch") {
                        kingdomSize += 1;

                        var banePossibilities = [];
                        var banePossibilityIndexes = [];
                        for (pBane of kingdomCards) {
                            if (pBane.cost === "2" || pBane.cost === "3") {
                                if (pBane.altCost !== "potion") {
                                    if (pBane.cardType !== "Event" && pBane.cardType !== "Landmark") {
                                        banePossibilities.push(pBane);
                                    }
                                }
                            }
                        }

                        if (banePossibilities.length > 0) {
                            var baneCardIndex = Math.floor(Math.random() * banePossibilities.length);
                            baneCard = banePossibilities[baneCardIndex];

                            successOutput += baneCard.cardName + " chosen as bane for Young Witch\n\n";
                        } else {
                            needBane = true;
                        }
                    }

                    addCard = true;
                }

                // Perform logic for events and landmarks
                if (card.cardType === "Event" || card.cardType === "Landmark") {
                    if (specialCards >= 2) {
                        addCard = false;
                    }
                }

                if (addCard) {
                    kingdomCards.push(card);
                    availableCards.splice(cardIndex, 1);

                    if (card.altCost === "potion") {
                        potionCards += 1;
                    }

                    if (card.cardType === "Event" || card.cardType === "Landmark") {
                        kingdomSize += 1;
                        specialCards += 1;
                    }

                    output += successOutput;
                }

                postMessage({
                    result: "progress",
                    progress: PROGRESS_CARDS + kingdomCards.length - 1
                });
            }
        }
    }

    output += "Rejected: " + rejectedCount + " cards" + "\n";
    if (parameters.debug === "cards" || parameters.debug === "all") {
        console.log(output);
    }

    // Check for Obelisk
    var obeliskCard = undefined;
    var hasObelisk = false;
    for (card of kingdomCards) {
        if (card.cardName === "Obelisk") {
            hasObelisk = true;
        }
    }

    if (hasObelisk) {
        // Make a list of the possible cards for Obelisk
        var possibleObeliskCards = [];
        for (card of kingdomCards) {
            var cardTypes = card.cardType.split("/");
            var isAction = false;
            for (type of cardTypes) {
                if (type === "Action") {
                    isAction = true;
                }
            }

            if (isAction) {
                possibleObeliskCards.push(card);
            }
        }

        if (possibleObeliskCards.length > 0) {
            var obeliskCardIndex = Math.floor(Math.random() * possibleObeliskCards.length);
            obeliskCard = possibleObeliskCards[obeliskCardIndex];
        } else {
            for (var ci = 0; ci < kingdomCards.length; ++ci) {
                if (kingdomCards[ci].cardName === "Obelisk") {
                    kingdomCards.splice(ci, 1);
                    ci = 0;
                }
            }
        }
    }

    // Determine the number of prosperity cards
    var prosperityCards = 0;
    for (card of kingdomCards) {
        if (card.cardType !== "Event" && card.cardType !== "Landmark") {
            if (card.cardSet === "Prosperity") {
                prosperityCards += 1;
            }
        }
    }

    // Determine if colony and platinum cards will be used
    var useProsperity = false;
    var prosperityNum = Math.random() * kingdomCards.length;
    if (prosperityCards >= prosperityNum) {
        useProsperity = true;
    }

    if (parameters.debug === "all") {
        var pString = useProsperity
            ? "Proserity cards in use"
            : "Proserity cards not in use";
        var pCardsString = prosperityCards + " cards";
        var pChanceString = prosperityNum.toFixed(2) + " chance";
        console.log(pString + " with " + pCardsString + " and " + pChanceString);
    }

    supplyCards = [];
    if (useProsperity) {
        supplyCards.push("Platinum");
        supplyCards.push("Colony");
    }

    result = {
        result: "success",
        kingdomCards: kingdomCards,
        supplyCards: supplyCards,
        baneCard: baneCard,
        obeliskCard: obeliskCard
    };

    // Send the cards to the main process
    postMessage(result);
}

function findTypeChances(kingdomCards, availableCards, synergies) {
    // Construct a list of chances for each type of card
    var typeChances = [];
    for (s of synergies) {
        c1 = s.c1;
        c2 = s.c2;

        // Find the similar cards
        var c1sInKingdom = 0;
        var c2sInKingdom = 0;
        var c2sInCards = 0;

        for (c of kingdomCards) {
            for (t of c.types) {
                if (c1 === t) {
                    c1sInKingdom += 1;
                }

                if (c2 === t) {
                    c2sInKingdom += 1;
                }
            }
        }

        for (c of availableCards) {
            for (t of c.types) {
                if (c2 === t) {
                    c2sInCards += 1;
                }
            }
        }

        // Find the other synergies with the same c1 and c2
        var c1sInSynergies = 0;
        var c2sInSynergies = 0;
        for (s2 of synergies) {
            if (c1 === s2.c1) {
                c1sInSynergies += 1;
            }

            if (c2 === s2.c2) {
                c2sInSynergies += 1;
            }
        }

        if (c1sInKingdom > 0 && c2sInCards > 0 && c1sInSynergies > 0) {
            // Find a scaling factor
            var c2sCardsFactor = Math.pow(c2sInCards, 3) * 0.1;
            var c1sSynergiesFactor = Math.pow(c1sInSynergies, 0.6);
            var c2sSynergiesFactor = Math.pow(c2sInSynergies, 0.5);
            var c1sKingdomFactor = Math.pow(c1sInKingdom, 0.3);
            var c2sKingdomFactor = Math.pow(2, c2sInKingdom);
            var scaleFactor = ((c1sKingdomFactor / c1sSynergiesFactor / c2sSynergiesFactor) * c2sCardsFactor) / c2sKingdomFactor;

            var adjustedChance = s.r + 1;
            var scaledChance = adjustedChance * scaleFactor;

            var typeChance = {
                c1: c1,
                cardType: c2,
                chance: scaledChance
            }

            typeChances.push(typeChance);
        }
    }

    return typeChances;
}
