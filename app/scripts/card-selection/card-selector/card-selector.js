"use strict"; const PROGRESS_LOAD=1; const PROGRESS_SETS=2; const PROGRESS_SETS_TOTAL=4; const PROGRESS_CARDS=6; const POTION_FACTOR=[0, 2, 1, 0, -1]; function closeWithError(e) {
    postMessage({ result: "error", message: e });
} function generateCards(e, a, t) {
    const r=[]; const o={}; let s=0; for (set of e.sets) {
        const n=`${set.toLowerCase().replace(" ", "")}.xml`; const c=`${e.appDir}/app/data/cards/${n}`; const p=new marknote.Parser; const l=p.parseURL(c, null, "GET"); if (200===p.getXHRStatus()) {
            const d=l.getRootElement(); const i=d.getAttributeValue("name"); const h=d.getChildElements(); for (xmlSet of h) {
                const f=xmlSet.getAttributeValue("version"); const g=e[i+f]; if (""===f||"on"===g) {
                    const m=xmlSet.getChildElements("card"); for (xmlCard of m)cardData=xmlToCardData(xmlCard, i), r.push(cardData), void 0===o[cardData.cost]&&(o[cardData.cost]=0), o[cardData.cost]+=1;
                }
            }
        } else closeWithError(`There was a problem parsing the cards for ${set}`); s+=1; const u=Math.round(s*PROGRESS_SETS_TOTAL/e.sets.length); postMessage({ result: "progress", progress: PROGRESS_SETS+u-1 });
    }postMessage({ result: "progress", progress: PROGRESS_SETS+PROGRESS_SETS_TOTAL }), generateKingdom(e, a, r, o, t);
} function generateKingdom(e, a, r, o, s) {
    const n=[]; let c=""; let p=!1; let l=void 0; let d=10; let i=0; let h=0; let f=0; for (0===r.length&&closeWithError("No sets were selected"); n.length<d;) {
        let g=""; const m=findTypeChances(n, r, a); let u=0; for (typeChance of m)u+=typeChance.chance; let v=e.randomness; if ((void 0===v||v<.001)&&(v=.001), 0===r.length)closeWithError("Not enough cards are in the selected sets"); else {
            var y=void 0; let S=void 0; if (u<=Math.random()*v||Math.random()<=.001||f>=1e3)g+=`${(y=r[S=Math.floor(Math.random()*r.length)]).cardName} chosen at random\n\n`; else {
                const C=Math.random()*u; var M=void 0; let T=void 0; let E=0; for (typeChance of m) void 0===M&&(E+=typeChance.chance)>=C&&(M=typeChance.cardType, typeChance.chance, T=typeChance.c1); if (void 0!==M) {
                    const R=[]; for (Y=0; Y<r.length; ++Y) {
                        var b=r[Y]; for (t of b.types) {
                            if (t===M) {
                                var w={ card: b, i: Y }; R.push(w);
                            }
                        }
                    }(S=Math.floor(Math.random()*R.length))>r.length-1&&(S=r.length-1); const O=(w=R[S]).card; let P=0; let N=0; let A=0; for (Y=0; Y<n.length; ++Y) {
                        b=n[Y]; let D=0; for (t1 of b.types) {
                            for (t2 of O.types) {
                                if (t1===t2) {
                                    let L=!1; for (it of s)t1===it&&(L=!0); L||(D+=1);
                                }
                            }
                        }P+=D/(Math.sqrt(b.types.length)+Math.sqrt(O.types.length)), b.cost===O.cost&&"potion"!==b.altCost&&"potion"!==O.altCost&&(N+=1), b.cost===O.cost&&"potion"===b.altCost&&"potion"===O.altCost&&(N+=2), b.cardSet===O.cardSet&&(A+=1);
                    } let k=!0; let x=Math.pow(N, 2)*(Math.pow(Math.abs(O.cost-3), .5)+1); if (0===N?x-=.3:N>=3&&(x+=.2*Math.pow(N, 2), N>=5&&(k=!1)), P+=x/Math.pow(o[O.cost], .75)/Math.pow(n.length, .35), e.distributeSets) if (e.sets.length>1)P+=Math.pow(A, 2)/Math.pow(n.length, 1.2)*.5; if (e.clusterPotions) {
                        var _=POTION_FACTOR[i]; void 0===_&&(_=-10);
                    } if ("potion"===O.altCost?0===i?(n.length-h>=7&&(k=!1), P+=.2):P-=_:_>0&&(P+=.75*_), "Event"===O.cardType||"Landmark"===O.cardType)P+=Math.pow(r.length, .02)-1; const G=[]; for (b of n) for (t of b.types)t==T&&G.push(b.cardName); if (P-=Math.pow(n.length, .5)*Math.pow(u, .5)*.001, k&&P<.9*Math.random()+.4) {
                        y=O, S=w.i; const j=`'${M}' (${y.cardName})`; const X=`'${T}' (${G.join(", ")})`; "all"===e.debug&&console.log(`${y.cardName} chosen : ${P.toFixed(2)}`), g+=`${j} chosen because of ${X}\n    similarity: ${P.toFixed(2)}\n\n`;
                    } else f+=1, "all"===e.debug&&(k?console.log(`${O.cardName} rejected : ${P.toFixed(2)}`):console.log(`${O.cardName} rejected because invalid`));
                }
            } if (void 0!==y) {
                let W=!1; if (p)"2"===y.cost||"3"===y.cost?"potion"!==y.altCost?"Event"!==y.cardType&&"Landmark"!==y.cardType?(l=y, p=!1, W=!0, g+=`${y.cardName} chosen as bane for Young Witch\n\n`):c+=`${y.cardName} rejected as bane due to card type\n\n`:c+=`${y.cardName} rejected as bane due to potion\n\n`:c+=`${y.cardName} rejected as bane due to cost\n\n`; else {
                    if ("Young Witch"===y.cardName) {
                        d+=1; const B=[]; for (pBane of n)"2"!==pBane.cost&&"3"!==pBane.cost||"potion"!==pBane.altCost&&"Event"!==pBane.cardType&&"Landmark"!==pBane.cardType&&B.push(pBane); if (B.length>0)g+=`${(l=B[Math.floor(Math.random()*B.length)]).cardName} chosen as bane for Young Witch\n\n`; else p=!0;
                    }W=!0;
                }"Event"!==y.cardType&&"Landmark"!==y.cardType||h>=2&&(W=!1), W&&(n.push(y), r.splice(S, 1), "potion"===y.altCost&&(i+=1), "Event"!==y.cardType&&"Landmark"!==y.cardType||(d+=1, h+=1), c+=g), postMessage({ result: "progress", progress: PROGRESS_CARDS+n.length-1 });
            }
        }
    }c+=`Rejected: ${f} cards\n`, "cards"!==e.debug&&"all"!==e.debug||console.log(c); let F=void 0; let V=!1; for (y of n)"Obelisk"===y.cardName&&(V=!0); if (V) {
        const H=[]; for (y of n) {
            const I=y.cardType.split("/"); let U=!1; for (M of I)"Action"===M&&(U=!0); U&&H.push(y);
        } if (H.length>0)F=H[Math.floor(Math.random()*H.length)]; else for (var Y=0; Y<n.length; ++Y)"Obelisk"===n[Y].cardName&&(n.splice(Y, 1), Y=0);
    } let q=0; for (y of n)"Event"!==y.cardType&&"Landmark"!==y.cardType&&"Prosperity"===y.cardSet&&(q+=1); let K=!1; const z=Math.random()*n.length; if (q>=z&&(K=!0), "all"===e.debug) {
        const J=K?"Proserity cards in use":"Proserity cards not in use"; const Q=`${q} cards`; const Z=`${z.toFixed(2)} chance`; console.log(`${J} with ${Q} and ${Z}`);
    }supplyCards=[], K&&(supplyCards.push("Platinum"), supplyCards.push("Colony")), result={ result: "success", kingdomCards: n, supplyCards: supplyCards, baneCard: l, obeliskCard: F }, postMessage(result);
} function findTypeChances(e, a, r) {
    const o=[]; for (s of r) {
        c1=s.c1, c2=s.c2; let n=0; let p=0; let l=0; for (c of e) for (t of c.types)c1===t&&(n+=1), c2===t&&(p+=1); for (c of a) for (t of c.types)c2===t&&(l+=1); let d=0; let i=0; for (s2 of r)c1===s2.c1&&(d+=1), c2===s2.c2&&(i+=1); if (n>0&&l>0&&d>0) {
            const h=.1*Math.pow(l, 3); const f=Math.pow(d, .6); const g=Math.pow(i, .5); const m=Math.pow(n, .3)/f/g*h/Math.pow(2, p); const u=s.r+1; const v={ c1: c1, cardType: c2, chance: u*m }; o.push(v);
        }
    } return o;
}self.addEventListener("message", (e) => {
    postMessage({ result: "progress", progress: 0 }); const a=e.data; console.log(a.appDir), importScripts(`${a.appDir}/app/scripts/marknote.js`), importScripts(`${a.appDir}/app/scripts/card-selection/xml-to-card.js`), postMessage({ result: "progress", progress: 1 }); const t=new marknote.Parser; const r=t.parseURL(`${a.appDir}/app/data/synergies.xml`, null, "GET"); if (200===t.getXHRStatus()) {
        const o=r.getRootElement().getChildElements("s"); const s=[]; for (sXml of o) {
            const n={ c1: sXml.getAttributeValue("c1"), c2: sXml.getAttributeValue("c2"), r: parseInt(sXml.getContentAt(0)) }; s.push(n);
        } const c=new marknote.Parser; const p=c.parseURL(`${a.appDir}/app/data/similarignore.xml`, null, "GET"); if (200===c.getXHRStatus()) {
            const l=p.getRootElement().getChildElements("type"); const d=[]; for (siXml of l)d.push(siXml.getContentAt(0).toString()); generateCards(a, s, d);
        }
    } else closeWithError("There was a problem parsing card synergies");
});
