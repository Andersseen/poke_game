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
    pokemonsArray.push(pokemon);
}

// createPokemonCard(pokemon);

fetchPokemons();
// fetchPokemons();


function createPokemonCard(pokemon) {


    const pokemonEl = document.createElement('div');
    pokemonEl.classList.add('pokemon__card');

    const pokeInnerHTML = `        
        <div class='flip__card'>
            <div class='card__front' data-value='${pokemon.id}'>
            </div>
            <div class='card__back'>
                <div class='back__img'>
                    <img src='https://pokeres.bastionbot.org/images/pokemon/${pokemon.id}.png'/>
                </div>

            </div>
        </div>
   

    `;

    pokemonEl.innerHTML = pokeInnerHTML;

    pokeContainer.appendChild(pokemonEl);
}



