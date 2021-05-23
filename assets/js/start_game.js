const btnStart = document.querySelector('.btn__start');
const btnRestart = document.querySelector('.btn__end');

const numberLevel = document.querySelector('#level');

const table = document.querySelector('#table');
const cardsContainer = document.querySelector('.poke__container');



const onClickStartGame = () => {

    cardsContainer.innerHTML = '';
    table.classList.add('close');

    let randomAllCards = shuffleCards(pokemonsArray);

    let thisLevel = doArrayFirstLevel(randomAllCards);

    let randonCardsInThisLevel = shuffleCards(thisLevel);


    randonCardsInThisLevel.forEach(el => {
        createPokemonCard(el);
    });

    document.querySelector("#sound__start").cloneNode().play();
    // document.querySelector("#sound__level").cloneNode();

    clickedCardsPokemons();

}


const onClickLevelGame = (e) => {

    cardsContainer.innerHTML = '';
    table.classList.add('close');


    if (e.target == btnFirstLevel) {
        numberLevel.innerHTML = 1;

        let randomAllCards = shuffleCards(pokemonsArray);

        let thisLevel = doArrayFirstLevel(randomAllCards);

        let randonCardsInThisLevel = shuffleCards(thisLevel);


        randonCardsInThisLevel.forEach(el => {
            createPokemonCard(el);
        });

        document.querySelector("#sound__start").cloneNode().play();
        // document.querySelector("#sound__level").cloneNode();

        clickedCardsPokemons();

    } else if (e.target == btnSecondLevel) {
        numberLevel.innerHTML = 2;

        let randomAllCards = shuffleCards(pokemonsArray);

        let thisLevel = doArraySecondLevel(randomAllCards);

        let randonCardsInThisLevel = shuffleCards(thisLevel);


        randonCardsInThisLevel.forEach(el => {
            createPokemonCard(el);
        });

        document.querySelector("#sound__start").cloneNode().play();
        // document.querySelector("#sound__level").cloneNode();

        clickedCardsPokemons();
    } else if (e.target == btnThirdLevel) {
        numberLevel.innerHTML = 3;
        let randomAllCards = shuffleCards(pokemonsArray);

        let thisLevel = doArrayThirdLevel(randomAllCards);

        let randonCardsInThisLevel = shuffleCards(thisLevel);


        randonCardsInThisLevel.forEach(el => {
            createPokemonCard(el);
        });

        document.querySelector("#sound__start").cloneNode().play();
        // document.querySelector("#sound__level").cloneNode();

        clickedCardsPokemons();
    } else {
        return;
    }

}





const clickedCardsPokemons = () => {

    let pokemonsCards = document.querySelectorAll('.pokemon__card');

    pokemonsCards.forEach(el => {
        el.addEventListener('click', toFindOut)
    })


}


const loopPokemons = () => {

    table.classList.remove('close');
    btnRestart.classList.add('active');

}





btnStart.addEventListener('click', onClickStartGame);
btnRestart.addEventListener('click', onClickStartGame);


btnFirstLevel.addEventListener('click', onClickLevelGame);
btnSecondLevel.addEventListener('click', onClickLevelGame);
btnThirdLevel.addEventListener('click', onClickLevelGame);