const success = (cards) => {
    cards.forEach((el) => {
        el.parentNode.parentNode.classList.add("success");
    })

    document.querySelector("#sound__success").cloneNode().play();

    setTimeout(() => {
        cards.forEach((el) => {
            el.parentNode.parentNode.classList.remove("open__card");
            el.classList.remove("compare__card");
        })
    }, 600)


}

const error = (cards) => {
    cards.forEach((el) => {
        el.parentNode.parentNode.classList.add("error");
    })

    document.querySelector("#sound__error").cloneNode().play();

    setTimeout(() => {
        cards.forEach((el) => {
            el.parentNode.parentNode.classList.remove("open__card");
            el.parentNode.parentNode.classList.remove("error");
            el.classList.remove("compare__card");
        })
    }, 600)



}
