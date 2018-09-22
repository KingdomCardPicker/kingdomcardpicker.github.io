$(function() {
    $(".input-number").each(function() {
        var numberInput = $(this);
        var numberInputValue = numberInput.find(".input-number-value");

        var addButton = numberInput.find(".input-number-add");
        var subtractButton = numberInput.find(".input-number-subtract");

        addButton.click(function() {
            numberInput.trigger("input-add");
        });

        subtractButton.click(function() {
            numberInput.trigger("input-subtract");
        });
    });

    $(".input-number").on("input-add", function() {
        var numberInput = $(this);
        var numberInputValue = numberInput.find(".input-number-value");

        numberInputValue.removeClass("value-in-left");
        numberInputValue.removeClass("value-in-right");
        numberInputValue.addClass("value-out-left");
        window.setTimeout(function() {
            numberInputValue.removeClass("value-out-left");
            numberInputValue.addClass("value-in-right");

            var currentVal = parseInt(numberInputValue.text(), 10);
            if (currentVal >= 1) {
                var newVal = currentVal + 1;

                numberInputValue.text(newVal);
                numberInputValue.trigger("input-value-change");
            } else {
                numberInputValue.text("2");
                numberInputValue.trigger("input-value-change");
            }
        }, 100);
    });

    $(".input-number").on("input-subtract", function() {
        var numberInput = $(this);
        var numberInputValue = numberInput.find(".input-number-value");

        if (parseInt(numberInputValue.text(), 10) > 1) {
            numberInputValue.removeClass("value-in-left");
            numberInputValue.removeClass("value-in-right");
            numberInputValue.addClass("value-out-right");
            window.setTimeout(function() {
                numberInputValue.removeClass("value-out-right");
                numberInputValue.addClass("value-in-left");

                var currentVal = parseInt(numberInputValue.text(), 10);
                if (currentVal >= 1) {
                    var newVal = currentVal - 1;

                    numberInputValue.text(newVal);
                    numberInputValue.trigger("input-value-change");
                } else {
                    numberInputValue.text("2");
                    numberInputValue.trigger("input-value-change");
                }
            }, 100);
        } else {
            numberInputValue.text("1");
            numberInputValue.trigger("input-value-change");
        }
    });
});
