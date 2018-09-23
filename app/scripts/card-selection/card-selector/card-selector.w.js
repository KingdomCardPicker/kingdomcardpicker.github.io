const PROGRESS_LOAD=1,PROGRESS_SETS=2,PROGRESS_SETS_TOTAL=4,PROGRESS_CARDS=6,POTION_FACTOR=[0,2,1,0,-1];function closeWithError(e){postMessage({result:"error",message:e})}function generateCards(e,t,a){var r=[],o={},s=0;for(set of e.sets){var n=set.toLowerCase().replace(" ","")+".xml",c=e.appDir+"/data/cards/"+n,l=new marknote.Parser,d=l.parseURL(c,null,"GET");if(200===l.getXHRStatus()){var p=d.getRootElement(),i=p.getAttributeValue("name"),h=p.getChildElements();for(xmlSet of h){var f=xmlSet.getAttributeValue("version"),g=e[i+f];if(""===f||"on"===g){var m=xmlSet.getChildElements("card");for(xmlCard of m)cardData=xmlToCardData(xmlCard,i),r.push(cardData),void 0===o[cardData.cost]&&(o[cardData.cost]=0),o[cardData.cost]+=1}}}else closeWithError("There was a problem parsing the cards for "+set);s+=1;var u=Math.round(s*PROGRESS_SETS_TOTAL/e.sets.length);postMessage({result:"progress",progress:PROGRESS_SETS+u-1})}postMessage({result:"progress",progress:PROGRESS_SETS+PROGRESS_SETS_TOTAL}),generateKingdom(e,t,r,o,a)}function generateKingdom(e,a,r,o,s){var n=[],c="",l=!1,d=void 0,p=10,i=0,h=0,f=0;for(0===r.length&&closeWithError("No sets were selected");n.length<p;){var g="",m=findTypeChances(n,r,a),u=0;for(typeChance of m)u+=typeChance.chance;var v=e.randomness;if((void 0===v||v<.001)&&(v=.001),0===r.length)closeWithError("Not enough cards are in the selected sets");else{var y=void 0,S=void 0;if(u<=Math.random()*v||Math.random()<=.001||f>=1e3)g+=(y=r[S=Math.floor(Math.random()*r.length)]).cardName+" chosen at random\n\n";else{var C=Math.random()*u,T=void 0,M=void 0,E=0;for(typeChance of m)void 0===T&&(E+=typeChance.chance)>=C&&(T=typeChance.cardType,typeChance.chance,M=typeChance.c1);if(void 0!==T){var R=[];for(Y=0;Y<r.length;++Y){var w=r[Y];for(t of w.types)if(t===T){var b={card:w,i:Y};R.push(b)}}(S=Math.floor(Math.random()*R.length))>r.length-1&&(S=r.length-1);var O=(b=R[S]).card,P=0,N=0,A=0;for(Y=0;Y<n.length;++Y){w=n[Y];var L=0;for(t1 of w.types)for(t2 of O.types)if(t1===t2){var k=!1;for(it of s)t1===it&&(k=!0);k||(L+=1)}P+=L/(Math.sqrt(w.types.length)+Math.sqrt(O.types.length)),w.cost===O.cost&&"potion"!==w.altCost&&"potion"!==O.altCost&&(N+=1),w.cost===O.cost&&"potion"===w.altCost&&"potion"===O.altCost&&(N+=2),w.cardSet===O.cardSet&&(A+=1)}var x=!0,D=Math.pow(N,2)*(Math.pow(Math.abs(O.cost-3),.5)+1);if(0===N?D-=.3:N>=3&&(D+=.2*Math.pow(N,2),N>=5&&(x=!1)),P+=D/Math.pow(o[O.cost],.75)/Math.pow(n.length,.35),e.distributeSets)if(e.sets.length>1)P+=Math.pow(A,2)/Math.pow(n.length,1.2)*.5;if(e.clusterPotions){var _=POTION_FACTOR[i];void 0===_&&(_=-10)}if("potion"===O.altCost?0===i?(n.length-h>=7&&(x=!1),P+=.2):P-=_:_>0&&(P+=.75*_),"Event"===O.cardType||"Landmark"===O.cardType)P+=Math.pow(r.length,.02)-1;var G=[];for(w of n)for(t of w.types)t==M&&G.push(w.cardName);if(P-=Math.pow(n.length,.5)*Math.pow(u,.5)*.001,x&&P<.9*Math.random()+.4){y=O,S=b.i;var j="'"+T+"' ("+y.cardName+")",X="'"+M+"' ("+G.join(", ")+")";"all"===e.debug&&console.log(y.cardName+" chosen : "+P.toFixed(2)),g+=j+" chosen because of "+X+"\n    similarity: "+P.toFixed(2)+"\n\n"}else f+=1,"all"===e.debug&&(x?console.log(O.cardName+" rejected : "+P.toFixed(2)):console.log(O.cardName+" rejected because invalid"))}}if(void 0!==y){var W=!1;if(l)"2"===y.cost||"3"===y.cost?"potion"!==y.altCost?"Event"!==y.cardType&&"Landmark"!==y.cardType?(d=y,l=!1,W=!0,g+=y.cardName+" chosen as bane for Young Witch\n\n"):c+=y.cardName+" rejected as bane due to card type\n\n":c+=y.cardName+" rejected as bane due to potion\n\n":c+=y.cardName+" rejected as bane due to cost\n\n";else{if("Young Witch"===y.cardName){p+=1;var B=[];for(pBane of n)"2"!==pBane.cost&&"3"!==pBane.cost||"potion"!==pBane.altCost&&"Event"!==pBane.cardType&&"Landmark"!==pBane.cardType&&B.push(pBane);if(B.length>0)g+=(d=B[Math.floor(Math.random()*B.length)]).cardName+" chosen as bane for Young Witch\n\n";else l=!0}W=!0}"Event"!==y.cardType&&"Landmark"!==y.cardType||h>=2&&(W=!1),W&&(n.push(y),r.splice(S,1),"potion"===y.altCost&&(i+=1),"Event"!==y.cardType&&"Landmark"!==y.cardType||(p+=1,h+=1),c+=g),postMessage({result:"progress",progress:PROGRESS_CARDS+n.length-1})}}}c+="Rejected: "+f+" cards\n","cards"!==e.debug&&"all"!==e.debug||console.log(c);var F=void 0,V=!1;for(y of n)"Obelisk"===y.cardName&&(V=!0);if(V){var H=[];for(y of n){var I=y.cardType.split("/"),U=!1;for(T of I)"Action"===T&&(U=!0);U&&H.push(y)}if(H.length>0)F=H[Math.floor(Math.random()*H.length)];else for(var Y=0;Y<n.length;++Y)"Obelisk"===n[Y].cardName&&(n.splice(Y,1),Y=0)}var q=0;for(y of n)"Event"!==y.cardType&&"Landmark"!==y.cardType&&"Prosperity"===y.cardSet&&(q+=1);var K=!1,z=Math.random()*n.length;if(q>=z&&(K=!0),"all"===e.debug){var J=K?"Proserity cards in use":"Proserity cards not in use",Q=q+" cards",Z=z.toFixed(2)+" chance";console.log(J+" with "+Q+" and "+Z)}supplyCards=[],K&&(supplyCards.push("Platinum"),supplyCards.push("Colony")),result={result:"success",kingdomCards:n,supplyCards:supplyCards,baneCard:d,obeliskCard:F},postMessage(result)}function findTypeChances(e,a,r){var o=[];for(s of r){c1=s.c1,c2=s.c2;var n=0,l=0,d=0;for(c of e)for(t of c.types)c1===t&&(n+=1),c2===t&&(l+=1);for(c of a)for(t of c.types)c2===t&&(d+=1);var p=0,i=0;for(s2 of r)c1===s2.c1&&(p+=1),c2===s2.c2&&(i+=1);if(n>0&&d>0&&p>0){var h=.1*Math.pow(d,3),f=Math.pow(p,.6),g=Math.pow(i,.5),m=Math.pow(n,.3)/f/g*h/Math.pow(2,l),u=s.r+1,v={c1:c1,cardType:c2,chance:u*m};o.push(v)}}return o}self.addEventListener("message",function(e){var t=e.data;importScripts(t.appDir+"/scripts/marknote.w.js"),importScripts(t.appDir+"/scripts/card-selection/xml-to-card.w.js"),postMessage({result:"progress",progress:1});var a=new marknote.Parser,r=a.parseURL(t.appDir+"/data/synergies.xml",null,"GET");if(200===a.getXHRStatus()){var o=r.getRootElement().getChildElements("s"),s=[];for(sXml of o){var n={c1:sXml.getAttributeValue("c1"),c2:sXml.getAttributeValue("c2"),r:parseInt(sXml.getContentAt(0))};s.push(n)}var c=new marknote.Parser,l=c.parseURL(t.appDir+"/data/similarignore.xml",null,"GET");if(200===c.getXHRStatus()){var d=l.getRootElement().getChildElements("type"),p=[];for(siXml of d)p.push(siXml.getContentAt(0).toString());generateCards(t,s,p)}}else closeWithError("There was a problem parsing card synergies")});