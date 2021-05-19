const btnStart = document.querySelector('.btn__start');
const btnRestart = document.querySelector('.btn__end');

const table = document.querySelector('#table');
const cardsContainer = document.querySelector('.poke__container');




// const pokemonsCards = document.querySelectorAll('.pokemon__card');



const onClickStartGame = () => {

    cardsContainer.innerHTML = '';
    table.classList.add('close');

    let randomCards = shuffleCards(pokemonsArray);

    randomCards.forEach(el => {
        createPokemonCard(el);
    });

    clickedCardsPokemons();

}





const clickedCardsPokemons = () => {

    let pokemonsCards = document.querySelectorAll('.pokemon__card');

    pokemonsCards.forEach(el => {
        el.addEventListener('click', toFindOut)
    })


}




const shuffleCards = (cards) => {
    let result;
    let totalMemoryCards = cards.concat(cards); //copy array

    //sort
    result = totalMemoryCards.sort(() => .5 - Math.random());

    return result

}


const loopPokemons = () => {

    table.classList.remove('close');
    btnRestart.classList.add('active');

}





btnStart.addEventListener('click', onClickStartGame);
btnRestart.addEventListener('click', onClickStartGame);