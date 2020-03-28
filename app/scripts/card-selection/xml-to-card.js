"use strict"; function xmlToCardData(t, e) {
    const r=[]; const a=t.getChildElements("type"); for (xmlType of a)r.push(xmlType.getContentAt(0).toString()); const l=[]; const i=t.getChildElements("splitcards"); for (xmlSplitCardContainer of i) {
        const u=xmlSplitCardContainer.getChildElements("splitcard"); for (xmlSplitCard of u)l.push(xmlSplitCard.getAttributeValue("name").toString());
    } return { cardName: t.getAttributeValue("name"), cardSet: e, cardNumber: t.getAttributeValue("n"), cost: t.getAttributeValue("cost"), costDebt: t.getAttributeValue("costDebt"), altCost: t.getAttributeValue("altCost"), types: r, cardType: t.getAttributeValue("cardType"), splitCards: l };
}
