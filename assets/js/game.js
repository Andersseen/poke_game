const btnStart = document.querySelector('.btn');
const table = document.querySelector('#table');


// const pokemonsCards = document.querySelectorAll('.pokemon__card');



const onClickStartGame = () => {
    table.classList.add('close');

    let randomCards = shuffleCards(pokemonsArray);

    randomCards.forEach(el => {
        createPokemonCard(el);
    });

    clickedCardsPokemons();

}





const clickedCardsPokemons = () => {

    const pokemonsCards = document.querySelectorAll('.pokemon__card');

    pokemonsCards.forEach(el => {
        el.addEventListener('click', () => {
            el.classList.toggle('open__card');
        });
    })

}




const shuffleCards = (cards) => {
    let result;
    let totalMemoryCards = cards.concat(cards); //copy array

    console.log(totalMemoryCards);
    //sort
    result = totalMemoryCards.sort(() => .5 - Math.random());

    return result

}




btnStart.addEventListener('click', onClickStartGame);