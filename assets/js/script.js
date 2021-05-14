const pokeContainer = document.querySelector('#pokes');

const pokemonsNumbers = 18;

const pokemonsArray = [];


const fetchPokemons = async () => {
    for (let i = 1; i < pokemonsNumbers; i += 3) {
        await getPokemon(i);
    }
}

const getPokemon = async id => {
    const url = `https://pokeapi.co/api/v2/pokemon/${id}`;
    const res = await fetch(url);
    const pokemon = await res.json();
    createPokemonCard(pokemon)
}



fetchPokemons();
fetchPokemons();


function createPokemonCard(pokemon) {
    const pokemonEl = document.createElement('div');
    pokemonEl.classList.add('pokemon');

    const pokeInnerHTML = `
        <div class='poke__card'>
            <div class='poke__img'>
                <img src='https://pokeres.bastionbot.org/images/pokemon/${pokemon.id}.png'/>
            </div >
        </div >

    `;

    pokemonEl.innerHTML = pokeInnerHTML;

    pokeContainer.appendChild(pokemonEl);
}



