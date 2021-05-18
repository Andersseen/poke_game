const success = (cards) => {
    // console.log("Acierto")
    cards.forEach((el) => {
        el.parentNode.parentNode.classList.add("success");
    })


}

const error = (cards) => {
    // console.log("Error");

    cards.forEach((el) => {
        el.parentNode.parentNode.classList.add("error");
    })

    setTimeout(() => {
        cards.forEach((el) => {
            el.parentNode.parentNode.classList.remove("open__card");
            el.parentNode.parentNode.classList.remove("error");
            el.classList.remove("compare__card");
        })
    }, 600)



}
