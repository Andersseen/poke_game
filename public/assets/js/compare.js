const toFindOut = (e) => {
    let findCard = e.target.parentNode.parentNode;
    let compareCard = e.target;

    findCard.classList.add("open__card");
    compareCard.classList.add("compare__card");

    let totalOpenCards = document.querySelectorAll(".open__card");
    let totalCompareCards = document.querySelectorAll(".compare__card");

    document.querySelector("#sound__card").cloneNode().play();

    if (totalOpenCards.length === 2) {
        compare(totalCompareCards);
        return;
    }
    if (totalOpenCards.length > 2) {
        return;
    }

}


const compare = (cards) => {

    if (cards[0].dataset.value === cards[1].dataset.value) {
        success(cards)
    } else {
        error(cards)
    }

    let cardsPending = document.querySelectorAll(".pokemon__card:not(.success)");
    if (cardsPending.length === 0) {

        document.querySelector("#sound__good-end").cloneNode().play();

        setTimeout(loopPokemons, 1000);
    }

}