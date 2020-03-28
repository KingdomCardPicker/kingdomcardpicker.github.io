$(() => {
    $(".input-number").each(function () {
        const numberInput = $(this);
        const numberInputValue = numberInput.find(".input-number-value");

        const addButton = numberInput.find(".input-number-add");
        const subtractButton = numberInput.find(".input-number-subtract");

        addButton.click(() => {
            numberInput.trigger("input-add");
        });

        subtractButton.click(() => {
            numberInput.trigger("input-subtract");
        });
    });

    $(".input-number").on("input-add", function () {
        const numberInput = $(this);
        const numberInputValue = numberInput.find(".input-number-value");

        numberInputValue.removeClass("value-in-left");
        numberInputValue.removeClass("value-in-right");
        numberInputValue.addClass("value-out-left");
        window.setTimeout(() => {
            numberInputValue.removeClass("value-out-left");
            numberInputValue.addClass("value-in-right");

            const currentVal = parseInt(numberInputValue.text(), 10);
            if (currentVal >= 1) {
                const newVal = currentVal + 1;

                numberInputValue.text(newVal);
                numberInputValue.trigger("input-value-change");
            } else {
                numberInputValue.text("2");
                numberInputValue.trigger("input-value-change");
            }
        }, 100);
    });

    $(".input-number").on("input-subtract", function () {
        const numberInput = $(this);
        const numberInputValue = numberInput.find(".input-number-value");

        if (parseInt(numberInputValue.text(), 10) > 1) {
            numberInputValue.removeClass("value-in-left");
            numberInputValue.removeClass("value-in-right");
            numberInputValue.addClass("value-out-right");
            window.setTimeout(() => {
                numberInputValue.removeClass("value-out-right");
                numberInputValue.addClass("value-in-left");

                const currentVal = parseInt(numberInputValue.text(), 10);
                if (currentVal >= 1) {
                    const newVal = currentVal - 1;

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

    $("button, .btn, .btn-icon, .btn-toolbar, .btn-fab").hover(function () {
        $(this).addClass("tooltip-hover");
    }, function () {
        $(this).removeClass("tooltip-hover");
    });

    $("button, .btn, .btn-icon, .btn-toolbar, .btn-fab").on("click", function () {
        $(this).removeClass("tooltip-hover");
    });
});
