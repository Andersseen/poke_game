const btnStart = document.querySelector('.btn');
const table = document.querySelector('#table');


// const pokemonsCards = document.querySelectorAll('.pokemon__card');


const onClickStartGame = () => {
    table.classList.toggle('close');

    pokemonsArray.forEach(el => {
        createPokemonCard(el);
    });

    listCardsPokemons();

}

btnStart.addEventListener('click', onClickStartGame);


// const returnCards = (selector) => {

//     return document.querySelectorAll(selector);
// }



const listCardsPokemons = () => {

    const pokemonsCards = document.querySelectorAll('.pokemon__card');

    pokemonsCards.forEach(el => {
        el.addEventListener('click', onClickFlipCard);
    })


}





const onClickFlipCard = () => {
    const cardsFront = document.querySelectorAll('.pokemon__card');

    cardsFront.forEach(el => {
        el.classList.toggle('open__card');
    })



}


