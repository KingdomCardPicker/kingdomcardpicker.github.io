const PROGRESS_LOAD = 1;
const PROGRESS_SETS = 2;
const PROGRESS_SETS_TOTAL = 4;
const PROGRESS_CARDS = 6;

const POTION_FACTOR = [0, 2, 1, 0, -1];

function closeWithError(msg) {
    postMessage({ result: "error", message: msg });
}

self.addEventListener("message", (event) => {
    postMessage({ result: "progress", progress: 0 });

    const parameters = event.data;
    console.log(parameters.appDir);
    importScripts(`${parameters.appDir }/app/scripts/marknote.js`);
    importScripts(`${parameters.appDir }/app/scripts/card-selection/xml-to-card.js`);

    postMessage({ result: "progress", progress: PROGRESS_LOAD });

    const synergyParser = new marknote.Parser();
    const synergyDoc = synergyParser.parseURL(`${parameters.appDir }/app/data/synergies.xml`, null, "GET");
    if (synergyParser.getXHRStatus() === 200) {
        const root = synergyDoc.getRootElement();
        const synergiesXml = root.getChildElements("s");

        const synergies = [];
        for (sXml of synergiesXml) {
            const s = {
                c1: sXml.getAttributeValue("c1"),
                c2: sXml.getAttributeValue("c2"),
                r: parseInt(sXml.getContentAt(0)),
            };

            synergies.push(s);
        }

        const similarIgnoreParser = new marknote.Parser();
        const similarIgnoreDoc = similarIgnoreParser.parseURL(`${parameters.appDir }/app/data/similarignore.xml`, null, "GET");
        if (similarIgnoreParser.getXHRStatus() === 200) {
            const similarIgnoreXml = similarIgnoreDoc.getRootElement().getChildElements("type");

            const similarIgnore = [];
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
    const availableCards = [];

    const cardsWithCost = {};

    let parsedSets = 0;
    for (set of parameters.sets) {
        const filename = `${set.toLowerCase().replace(" ", "") }.xml`;
        const fileUrl = `${parameters.appDir }/app/data/cards/${ filename}`;
        const xmlParser = new marknote.Parser();
        const doc = xmlParser.parseURL(fileUrl, null, "GET");
        if (xmlParser.getXHRStatus() === 200) {
            const base = doc.getRootElement();
            const setName = base.getAttributeValue("name");

            const xmlSets = base.getChildElements();
            for (xmlSet of xmlSets) {
                const setVersion = xmlSet.getAttributeValue("version");
                const hasVersion = parameters[setName + setVersion];
                if (setVersion === "" || hasVersion === "on") {
                    const xmlCards = xmlSet.getChildElements("card");
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
            closeWithError(`There was a problem parsing the cards for ${ set}`);
        }

        parsedSets += 1;
        const roundProgress = Math.round((parsedSets * PROGRESS_SETS_TOTAL) / parameters.sets.length);

        postMessage({
            result: "progress",
            progress: PROGRESS_SETS + roundProgress - 1,
        });
    }

    postMessage({
        result: "progress",
        progress: PROGRESS_SETS + PROGRESS_SETS_TOTAL,
    });

    generateKingdom(parameters, synergies, availableCards, cardsWithCost, similarIgnore);
}

function generateKingdom(parameters, synergies, availableCards, cardsWithCost, similarIgnore) {
    const kingdomCards = [];
    let output = "";

    let needBane = false;
    let baneCard = undefined;

    let kingdomSize = 10;

    let potionCards = 0;
    let specialCards = 0;

    let rejectedCount = 0;

    if (availableCards.length === 0) {
        closeWithError("No sets were selected");
    }

    while (kingdomCards.length < kingdomSize) {
        let successOutput = "";
        // Construct a list of possible synergies, given the current cards
        const typeChances = findTypeChances(kingdomCards, availableCards, synergies);
        // Find the total chance
        let totalChance = 0;
        for (typeChance of typeChances) {
            totalChance += typeChance.chance;
        }

        let randomness = parameters.randomness;
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

                successOutput += `${card.cardName } chosen at random` + "\n\n";
            } else {
                const chance = Math.random() * totalChance;

                var type = undefined;
                let typeR = 0;
                let originalType = undefined;
                let currentChance = 0;
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
                    const cardsOfType = [];
                    for (ci = 0; ci < availableCards.length; ++ci) {
                        var c = availableCards[ci];
                        for (t of c.types) {
                            if (t === type) {
                                var typeCard = {
                                    card: c,
                                    i: ci,
                                };

                                cardsOfType.push(typeCard);
                            }
                        }
                    }

                    var cardIndex = Math.floor(Math.random() * cardsOfType.length);
                    if (cardIndex > availableCards.length - 1) {
                        cardIndex = availableCards.length - 1;
                    }

                    var typeCard = cardsOfType[cardIndex];
                    const newCard = typeCard.card;

                    // Check based on existing cards that are similar to new card
                    let globalSimilarity = 0;
                    let globalSharedCost = 0;
                    let globalSharedSets = 0;
                    for (ci = 0; ci < kingdomCards.length; ++ci) {
                        var c = kingdomCards[ci];

                        // Find shared traits
                        let sharedTraits = 0;
                        for (t1 of c.types) {
                            for (t2 of newCard.types) {
                                // Find similarities
                                if (t1 === t2) {
                                    let isIgnore = false;
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

                        const scaleFactor = Math.sqrt(c.types.length) + Math.sqrt(newCard.types.length);
                        const similarity = sharedTraits / scaleFactor;
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

                    let isNewCardValid = true;

                    let sharedCostHighFactor = Math.pow(globalSharedCost, 2) * (Math.pow(Math.abs(newCard.cost - 3), 0.5) + 1);
                    if (globalSharedCost === 0) {
                        sharedCostHighFactor -= 0.3;
                    } else if (globalSharedCost >= 3) {
                        sharedCostHighFactor += Math.pow(globalSharedCost, 2) * 0.2;

                        if (globalSharedCost >= 5) {
                            isNewCardValid = false;
                        }
                    }

                    const sharedCostFactor = sharedCostHighFactor / Math.pow(cardsWithCost[newCard.cost], 0.75);
                    const costLengthFactor = Math.pow(kingdomCards.length, 0.35);
                    const costFactor = sharedCostFactor / costLengthFactor;

                    globalSimilarity += costFactor;

                    if (parameters.distributeSets) {
                        if (parameters.sets.length > 1) {
                            const setFactor = (Math.pow(globalSharedSets, 2) / Math.pow(kingdomCards.length, 1.2)) * 0.5;
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
                        const specialFactor = (Math.pow(availableCards.length, 0.02) - 1);
                        globalSimilarity += specialFactor;
                    }

                    // Find all cards with the same type as the original
                    const originalTypeCards = [];
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

                        const chosenCard = `'${ type }' (${ card.cardName })`;
                        const originalCard = `'${ originalType }' (${ originalTypeCards.join(", ") })`;

                        if (parameters.debug === "all") {
                            console.log(`${card.cardName } chosen : ${ globalSimilarity.toFixed(2)}`);
                        }

                        successOutput += `${chosenCard } chosen because of ${ originalCard }\n    similarity: ${ globalSimilarity.toFixed(2) }\n\n`;
                    } else {
                        rejectedCount += 1;
                        if (parameters.debug === "all") {
                            if (isNewCardValid) {
                                console.log(`${newCard.cardName } rejected : ${ globalSimilarity.toFixed(2)}`);
                            } else {
                                console.log(`${newCard.cardName } rejected because invalid`);
                            }
                        }
                    }
                }
            }

            if (card !== undefined) {
                let addCard = false;
                if (needBane) {
                    if (card.cost === "2" || card.cost === "3") {
                        if (card.altCost !== "potion") {
                            if (card.cardType !== "Event" && card.cardType !== "Landmark") {
                                baneCard = card;
                                needBane = false;

                                addCard = true;

                                successOutput += `${card.cardName } chosen as bane for Young Witch\n\n`;
                            } else {
                                output += `${card.cardName } rejected as bane due to card type\n\n`;
                            }
                        } else {
                            output += `${card.cardName } rejected as bane due to potion\n\n`;
                        }
                    } else {
                        output += `${card.cardName } rejected as bane due to cost\n\n`;
                    }
                } else {
                    if (card.cardName === "Young Witch") {
                        kingdomSize += 1;

                        const banePossibilities = [];
                        const banePossibilityIndexes = [];
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
                            const baneCardIndex = Math.floor(Math.random() * banePossibilities.length);
                            baneCard = banePossibilities[baneCardIndex];

                            successOutput += `${baneCard.cardName } chosen as bane for Young Witch\n\n`;
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
                    progress: PROGRESS_CARDS + kingdomCards.length - 1,
                });
            }
        }
    }

    output += `Rejected: ${ rejectedCount } cards` + "\n";
    if (parameters.debug === "cards" || parameters.debug === "all") {
        console.log(output);
    }

    // Check for Obelisk
    let obeliskCard = undefined;
    let hasObelisk = false;
    for (card of kingdomCards) {
        if (card.cardName === "Obelisk") {
            hasObelisk = true;
        }
    }

    if (hasObelisk) {
        // Make a list of the possible cards for Obelisk
        const possibleObeliskCards = [];
        for (card of kingdomCards) {
            const cardTypes = card.cardType.split("/");
            let isAction = false;
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
            const obeliskCardIndex = Math.floor(Math.random() * possibleObeliskCards.length);
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
    let prosperityCards = 0;
    for (card of kingdomCards) {
        if (card.cardType !== "Event" && card.cardType !== "Landmark") {
            if (card.cardSet === "Prosperity") {
                prosperityCards += 1;
            }
        }
    }

    // Determine if colony and platinum cards will be used
    let useProsperity = false;
    const prosperityNum = Math.random() * kingdomCards.length;
    if (prosperityCards >= prosperityNum) {
        useProsperity = true;
    }

    if (parameters.debug === "all") {
        const pString = useProsperity ?
            "Proserity cards in use" :
            "Proserity cards not in use";
        const pCardsString = `${prosperityCards } cards`;
        const pChanceString = `${prosperityNum.toFixed(2) } chance`;
        console.log(`${pString } with ${ pCardsString } and ${ pChanceString}`);
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
        obeliskCard: obeliskCard,
    };

    // Send the cards to the main process
    postMessage(result);
}

function findTypeChances(kingdomCards, availableCards, synergies) {
    // Construct a list of chances for each type of card
    const typeChances = [];
    for (s of synergies) {
        c1 = s.c1;
        c2 = s.c2;

        // Find the similar cards
        let c1sInKingdom = 0;
        let c2sInKingdom = 0;
        let c2sInCards = 0;

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
        let c1sInSynergies = 0;
        let c2sInSynergies = 0;
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
            const c2sCardsFactor = Math.pow(c2sInCards, 3) * 0.1;
            const c1sSynergiesFactor = Math.pow(c1sInSynergies, 0.6);
            const c2sSynergiesFactor = Math.pow(c2sInSynergies, 0.5);
            const c1sKingdomFactor = Math.pow(c1sInKingdom, 0.3);
            const c2sKingdomFactor = Math.pow(2, c2sInKingdom);
            const scaleFactor = ((c1sKingdomFactor / c1sSynergiesFactor / c2sSynergiesFactor) * c2sCardsFactor) / c2sKingdomFactor;

            const adjustedChance = s.r + 1;
            const scaledChance = adjustedChance * scaleFactor;

            const typeChance = {
                c1: c1,
                cardType: c2,
                chance: scaledChance,
            };

            typeChances.push(typeChance);
        }
    }

    return typeChances;
}
