function xmlToCardData(xmlCard, setName) {
    const cardTypes = [];
    const xmlTypes = xmlCard.getChildElements("type");
    for (xmlType of xmlTypes) {
        cardTypes.push(xmlType.getContentAt(0).toString());
    }

    const splitCards = [];
    const xmlSplitCardContainers = xmlCard.getChildElements("splitcards");
    for (xmlSplitCardContainer of xmlSplitCardContainers) {
        const xmlSplitCards = xmlSplitCardContainer.getChildElements("splitcard");
        for (xmlSplitCard of xmlSplitCards) {
            splitCards.push(xmlSplitCard.getAttributeValue("name").toString());
        }
    }

    const cardData = {
        cardName: xmlCard.getAttributeValue("name"),

        cardSet: setName,
        cardNumber: xmlCard.getAttributeValue("n"),

        cost: xmlCard.getAttributeValue("cost"),
        costDebt: xmlCard.getAttributeValue("costDebt"),
        altCost: xmlCard.getAttributeValue("altCost"),
        types: cardTypes,

        cardType: xmlCard.getAttributeValue("cardType"),
        splitCards: splitCards,
    };

    return cardData;
}
