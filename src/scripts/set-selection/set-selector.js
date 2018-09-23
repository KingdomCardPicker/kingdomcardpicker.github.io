setDialog = undefined;

$(function () {
    $("#SetSelection-Open").on('click', function () {
        openSetDialog();
    });
});

function openSetDialog(isStartup) {
    if (setDialog === undefined) {
        setDialog = $("<div class='dialog dialog-set'></div>").appendTo($("body .main"));
        var setDialogMiddle = $("<div class='dialog-middle'></div>").appendTo(setDialog);
        var setDialogContent = $("<div class='dialog-content'></div>").appendTo(setDialogMiddle);
        var setDialogInner = $("<div class='dialog-content-inner'></div>").appendTo(setDialogContent);

        createDialog(setDialog);

        // Create a title
        $("<h1>My Expansions</h1>").appendTo(setDialogInner);
        // Add the minimize buttons
        var minimizeButton = $("<div type='cancel' class='btn-icon btn-dialog-minimize'>" +
            "<i class='material-icons'>close</i></div>").appendTo(setDialogInner);
        minimizeButton.click(function () {
            setDialog.trigger('dialog-close');
        });

        // Generate the outer container
        var setSelection = $("<div class='set-selection'></div>").appendTo(setDialogInner);

        var canAccessStoarge = false;
        if (typeof (Storage) !== undefined) {
            try {
                localStorage.setItem("", "");
                canAccessStoarge = true;
            } catch (err) {
                console.error(err);
            }
        }

        if (canAccessStoarge) {
            // Add the sets
            addSet(setSelection, "Dominion", ["Dominion", "1st Edition", "2nd Edition"]);
            addSet(setSelection, "Intrigue", ["Intrigue", "1st Edition", "2nd Edition"]);
            addSet(setSelection, "Seaside", ["Seaside"]);
            addSet(setSelection, "Alchemy", ["Alchemy"]);
            addSet(setSelection, "Prosperity", ["Prosperity"]);
            addSet(setSelection, "Cornucopia", ["Cornucopia"]);
            addSet(setSelection, "Hinterlands", ["Hinterlands"]);
            addSet(setSelection, "Dark Ages", ["Dark Ages"]);
            addSet(setSelection, "Guilds", ["Guilds"]);
            addSet(setSelection, "Adventures", ["Adventures"]);
            addSet(setSelection, "Empires", ["Empires"]);

            // Add the buttons
            var setDialogButtons = $("<div class='dialog-content-buttons'></div>").appendTo(setDialogInner);

            if (isStartup) {
                var scanButton = $("<div class='btn'>Scan a Code</div>").appendTo(setDialogButtons);
                scanButton.click(function () {
                    setDialog.trigger('dialog-close');
                    openScanDialog();
                });
            }

            var closeButton = $("<div class='btn'>Save Expansions</div>").appendTo(setDialogButtons);
            closeButton.click(function () {
                setDialog.trigger('dialog-close');
            });

            setDialog.one('dialog-close', function () {
                setDialog = undefined;

                // Open the onboarding, if it hasn't already been opened
                if (!$("#Generate-Button-Fab").hasClass("hidden")) {
                    if (typeof (Storage) !== undefined) {
                        if (!localStorage.getItem("Onboarding-Generate")) {
                            $("#Onboarding-Generate").addClass('open');
                            localStorage.setItem("Onboarding-Generate", true);
                        }
                    }
                }
            });
        } else {
            $("<p>Kingdom does not work in Private mode</p>").appendTo(setSelection);
        }
    }
}

function closeSetDialog() {
    if (setDialog !== undefined) {
        setDialog.trigger("dialog-close");
    }
}

function addSet(c, setName, setButtons) {
    // Generate the row
    setEntry = $("<div class='set-entry'></div>").appendTo(c);

    if (setButtons.length > 0) {
        // Add the controls box
        setMain = $("<div class='set-entry-main'></div>").appendTo(setEntry);
        // Add the first switch
        switchMain = addSwitch(setMain, setButtons[0], setName);

        // Add the other switches
        if (setButtons.length > 1) {
            controlSwitches = [];
            // Add the controls box
            setControls = $("<div class='set-entry-controls'></div>").appendTo(setEntry);
            for (i = 1; i < setButtons.length; ++i) {
                // Add the other switches
                controlSwitches.push(addSwitch(setControls, setButtons[i], setName, true));
            }

            // Setup control switches
            for (s of controlSwitches) {
                s.change(function () {
                    if (typeof (Storage) !== undefined) {
                        if ($(this).prop("checked")) {
                            localStorage.setItem($(this).attr("id"), "on");
                        } else {
                            localStorage.setItem($(this).attr("id"), "off");
                        }
                    }
                });

                // Set the switch to the previous value
                if (typeof (Storage) !== undefined) {
                    value = localStorage.getItem(s.attr("id"));
                    s.prop("checked", value === "on");
                    s.trigger('change');
                }
            }

            // Only open the controls box when the main one is checked
            switchMain.change(function () {
                controls = $(this).parent().parent().parent().find(".set-entry-controls");
                if ($(this).prop("checked")) {
                    controls.addClass("set-entry-visible");
                } else {
                    controls.removeClass("set-entry-visible");
                }
            });
        }

        // Set the main switch to the previous value
        if (typeof (Storage) !== undefined) {
            value = localStorage.getItem(switchMain.attr("id"));
            switchMain.prop("checked", value === "on");
            switchMain.trigger('change');
        }

        // Store the sets when changed
        switchMain.change(function () {
            if (typeof (Storage) !== undefined) {
                if ($(this).prop("checked")) {
                    localStorage.setItem($(this).attr("id"), "on");
                } else {
                    localStorage.setItem($(this).attr("id"), "off");
                }
            } else {
                console.log("Local storage not supported");
            }

            // Check the number of sets
            checkOwnedSets();
        });
    }
}

function addSwitch(c, name, setName, small = false) {
    sId = setName + name;
    // Generate the switch
    switchContainer = $("<div class='checkbox-check'></div>").appendTo(c);
    if (small) {
        switchContainer.addClass("small");
    }

    // Generate the text
    $("<p>" + name + "</p>").appendTo(switchContainer);
    // Add the input
    checkbox = $("<input type='checkbox' id='Sets-Selection-" + sId + "' name='sets-" + name + "' value='" + name + "'/>").appendTo(switchContainer);
    // Add the label
    switchLabel = $("<label for='Sets-Selection-" + sId + "' class='check-" + setName.toLowerCase().replace(' ', '') + "'>").appendTo(switchContainer);

    createCheckboxSwitch(switchContainer);

    return checkbox;
}

function checkOwnedSets() {
    var ownedSetsCount = 0;
    if (typeof (Storage) !== undefined) {
        for (setName in totalSets) {
            var sId = "Sets-Selection-" + setName + setName;
            if (localStorage.getItem(sId) === "on") {
                ownedSetsCount += 1;
            }
        }
    }

    if (ownedSetsCount === 0) {
        $(".cards-table-state").addClass("state-sets");
        $(".cards-table-state").removeClass("state-empty");
    } else {
        $(".cards-table-state").removeClass("state-sets");
        $(".cards-table-state").addClass("state-empty");
    }
}
