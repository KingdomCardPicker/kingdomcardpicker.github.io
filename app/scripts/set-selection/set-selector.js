"use strict"; function openSetDialog(e) {
    if (void 0===setDialog) {
        setDialog=$("<div class='dialog dialog-set'></div>").appendTo($("body .main")); const t=$("<div class='dialog-middle'></div>").appendTo(setDialog); const o=$("<div class='dialog-content'></div>").appendTo(t); const a=$("<div class='dialog-content-inner'></div>").appendTo(o); createDialog(setDialog), $("<h1>My Expansions</h1>").appendTo(a), $("<div type='cancel' class='btn-icon btn-dialog-minimize'><i class='material-icons'>close</i></div>").appendTo(a).click(() => {
            setDialog.trigger("dialog-close");
        }); const i=$("<div class='set-selection'></div>").appendTo(a); let s=!1; if (void 0!==typeof Storage) {
            try {
                localStorage.setItem("", ""), s=!0;
            } catch (e) {
                console.error(e);
            }
        } if (s) {
            addSet(i, "Dominion", ["Dominion", "1st Edition", "2nd Edition"]), addSet(i, "Intrigue", ["Intrigue", "1st Edition", "2nd Edition"]), addSet(i, "Seaside", ["Seaside"]), addSet(i, "Alchemy", ["Alchemy"]), addSet(i, "Prosperity", ["Prosperity"]), addSet(i, "Cornucopia", ["Cornucopia"]), addSet(i, "Hinterlands", ["Hinterlands"]), addSet(i, "Dark Ages", ["Dark Ages"]), addSet(i, "Guilds", ["Guilds"]), addSet(i, "Adventures", ["Adventures"]), addSet(i, "Empires", ["Empires"]); const n=$("<div class='dialog-content-buttons'></div>").appendTo(a); if (e) {
                $("<div class='btn'>Scan a Code</div>").appendTo(n).click(() => {
                    setDialog.trigger("dialog-close"), openScanDialog();
                });
            } $("<div class='btn'>Save Expansions</div>").appendTo(n).click(() => {
                setDialog.trigger("dialog-close"), $("#Generate-Button-Fab").hasClass("hidden")||void 0!==typeof Storage&&(localStorage.getItem("Onboarding-Generate")||($("#Onboarding-Generate").addClass("open"), localStorage.setItem("Onboarding-Generate", !0)));
            }), setDialog.one("dialog-close", () => {
                setDialog=void 0;
            });
        } else $("<p>Kingdom does not work in Private mode</p>").appendTo(i);
    }
} function closeSetDialog() {
    void 0!==setDialog&&setDialog.trigger("dialog-close");
} function addSet(e, t, o) {
    if (setEntry=$("<div class='set-entry'></div>").appendTo(e), o.length>0) {
        if (setMain=$("<div class='set-entry-main'></div>").appendTo(setEntry), switchMain=addSwitch(setMain, o[0], t), o.length>1) {
            for (controlSwitches=[], setControls=$("<div class='set-entry-controls'></div>").appendTo(setEntry), i=1; i<o.length; ++i)controlSwitches.push(addSwitch(setControls, o[i], t, !0)); for (s of controlSwitches) {
                s.change(function () {
                    void 0!==typeof Storage&&($(this).prop("checked")?localStorage.setItem($(this).attr("id"), "on"):localStorage.setItem($(this).attr("id"), "off"));
                }), void 0!==typeof Storage&&(value=localStorage.getItem(s.attr("id")), s.prop("checked", "on"===value), s.trigger("change"));
            } switchMain.change(function () {
                controls=$(this).parent().parent().parent().find(".set-entry-controls"), $(this).prop("checked")?controls.addClass("set-entry-visible"):controls.removeClass("set-entry-visible");
            });
        } void 0!==typeof Storage&&(value=localStorage.getItem(switchMain.attr("id")), switchMain.prop("checked", "on"===value), switchMain.trigger("change")), switchMain.change(function () {
            void 0!==typeof Storage?$(this).prop("checked")?localStorage.setItem($(this).attr("id"), "on"):localStorage.setItem($(this).attr("id"), "off"):console.log("Local storage not supported"), checkOwnedSets();
        });
    }
} function addSwitch(e, t, o, a=!1) {
    return sId=o+t, switchContainer=$("<div class='checkbox-check'></div>").appendTo(e), a&&switchContainer.addClass("small"), $(`<p>${t}</p>`).appendTo(switchContainer), checkbox=$(`<input type='checkbox' id='Sets-Selection-${sId}' name='sets-${t}' value='${t}'/>`).appendTo(switchContainer), switchLabel=$(`<label for='Sets-Selection-${sId}' class='check-${o.toLowerCase().replace(" ", "")}'>`).appendTo(switchContainer), createCheckboxSwitch(switchContainer), checkbox;
} function checkOwnedSets() {
    let e=0; if (void 0!==typeof Storage) {
        for (setName in totalSets) {
            const t=`Sets-Selection-${setName}${setName}`; "on"===localStorage.getItem(t)&&(e+=1);
        }
    }0===e?($(".cards-table-state").addClass("state-sets"), $(".cards-table-state").removeClass("state-empty")):($(".cards-table-state").removeClass("state-sets"), $(".cards-table-state").addClass("state-empty"));
}setDialog=void 0, $(() => {
    $("#SetSelection-Open").on("click", () => {
        openSetDialog();
    });
});
