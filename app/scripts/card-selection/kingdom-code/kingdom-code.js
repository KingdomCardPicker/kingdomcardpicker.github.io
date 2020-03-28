"use strict"; function closeWithError(r) {
    postMessage({ result: "error", message: r });
} function convertKingdomToCode(r) {
    importScripts(`${r.appDir}/app/scripts/marknote.js`); const e=[]; let a=void 0; let s=void 0; for (card of r.kingdomCards) {
        for (var t=r.totalSets[card.cardSet].toString(); t.length<2;)t=`0${t}`; const o=t+card.cardNumber.toString(); e.push(o), r.baneCard===card&&(a=o), r.obeliskCard===card&&(s=o);
    } const d=[]; const p=new marknote.Parser; const l=p.parseURL(`${r.appDir}/app/data/supply.xml`, null, "GET"); if (200===p.getXHRStatus()) {
        const i=l.getRootElement().getChildElements("card"); for (xmlSupplyCard of i) for (supplyCardName of (xmlSupplyCardName=xmlSupplyCard.getAttributeValue("name"), xmlSupplyCardNumber=xmlSupplyCard.getAttributeValue("n"), r.supplyCards))supplyCardName===xmlSupplyCardName&&d.push(xmlSupplyCardNumber);
    } let n=`a${d.join("a")}aa${e.join("a")}`; void 0!==a?(n+=`aa${a}`, void 0!==s&&(n+=`a${s}`)):void 0!==s&&(n+=`aa0a${s}`); const m=baseConvert(n, 11, BASECODE.length, BASECODE); postMessage({ result: "success", kingdomCode: m });
} function convertCodeToKingdom(r) {
    importScripts(`${r.appDir}/app/scripts/marknote.js`), importScripts(`${r.appDir}/app/scripts/card-selection/xml-to-card.js`), postMessage({ result: "progress", progress: 1 }), kingdomCode=r.kingdomCode; const e=baseConvert(kingdomCode, BASECODE.length, 11, BASECODE).substring(1).split("aa"); const a=e[0]; const s=e[1]; const t=e[2]; let o=void 0; let d=void 0; if (void 0!==t) {
        const p=t.split("a"); o=p[0], d=p[1];
    } const l=a.split("a"); const i=s.split("a"); i.length<10&&closeWithError("The kingdom code was not valid"), postMessage({ result: "progress", progress: 2 }); const n={}; const m={}; const C={}; for (id of i)setCode=id.substring(0, 2), void 0===n[setCode]&&(n[setCode]=[]), cardCode=id.substring(2), n[setCode].push(cardCode), void 0!==o&&id===o&&(m.setCode=setCode, m.cardCode=cardCode), void 0!==d&&id===d&&(C.setCode=setCode, C.cardCode=cardCode); postMessage({ result: "progress", progress: 3 }), kingdomCards=[]; let u=void 0; let g=void 0; for (set in n) {
        let c=""; let v=void 0; for (name in r.totalSets) {
            for (var S=r.totalSets[name].toString(); S.length<2;)S=`0${S}`; set===S&&(c=name, v=S);
        } const f=`${c.toLowerCase().replace(" ", "")}.xml`; const y=`${r.appDir}/app/data/cards/${f}`; var E=(h=new marknote.Parser).parseURL(y, null, "GET"); if (200===h.getXHRStatus()) {
            c=(k=E.getRootElement()).getAttributeValue("name"); const x=k.getChildElements(); for (xmlSet of x) {
                const b=xmlSet.getChildElements("card"); for (xmlCard of b) for (kingdomCardId of (cardId=xmlCard.getAttributeValue("n"), n[set]))kingdomCardId===cardId&&(cardData=xmlToCardData(xmlCard, c), kingdomCards.push(cardData), m.setCode===v&&m.cardCode===cardId&&(u=cardData), C.setCode===v&&C.cardCode===cardId&&(g=cardData));
            }
        }
    }postMessage({ result: "progress", progress: 6 }), supplyCards=[]; let h; E=(h=new marknote.Parser).parseURL(`${r.appDir}/app/data/supply.xml`, null, "GET"); if (200===h.getXHRStatus()) {
        var k; const D=(k=E.getRootElement()).getChildElements("card"); for (xmlSupplyCard of D) for (supplyCardId of (xmlSupplyCardName=xmlSupplyCard.getAttributeValue("name"), xmlSupplyCardNumber=xmlSupplyCard.getAttributeValue("n"), l))xmlSupplyCardNumber===supplyCardId&&supplyCards.push(xmlSupplyCardName);
    }postMessage({ result: "progress", progress: 8 }), kingdomCards.length<10&&closeWithError("Not enough cards"); const N={ result: "success", kingdomCards: kingdomCards, supplyCards: supplyCards, obeliskCard: g, baneCard: u }; postMessage(N);
}BASECODE="0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ", self.addEventListener("message", (r) => {
    parameters=r.data, importScripts("BigInteger.min.js"), importScripts("base-convert.js"), "cards-to-code"===parameters.request?convertKingdomToCode(parameters):"code-to-cards"===parameters.request?convertCodeToKingdom(parameters):closeWithError("Invalid request");
});
