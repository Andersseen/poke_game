const toFindOut = (e) => {
    let findCard = e.target.parentNode.parentNode;

    let compareCard = e.target;

    findCard.classList.add("open__card");



    let totalFindCards = document.querySelectorAll(".open__card")


    if (totalFindCards.length > 1) {
        totalFindCards.forEach(el => {
            setTimeout(() => {
                el.classList.remove('open__card');
            }, 600);

        });
    }

    // if (findCrds.length < 2) {
    //     return
    // }

    // compare(findCards);

    console.log(findCard);
    console.log(compareCard);
    console.log(totalFindCards);
}


const compare = (card) => {

    console.log(card)
    // if (compareCard[0].dataset.value === compareCard[1].dataset.value) {
    //     success(compareCard)
    // } else {
    //     error(compareCard)
    // }

}