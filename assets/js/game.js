const btnStart = document.querySelector('.btn');
const table = document.querySelector('#table');




// const pokemonsCards = document.querySelectorAll('.pokemon__card');


const onClickStartGame = () => {
    table.classList.toggle('close');

    pokemonsArray.forEach(el => {
        createPokemonCard(el);
    });

    // const pokemonCard = listCards('.pokemon__card');
    // console.log(pokemonCard);

}

btnStart.addEventListener('click', onClickStartGame);


// const returnCards = (selector) => {

//     return document.querySelectorAll(selector);
// }








