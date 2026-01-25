interface Pokemon {
  id: number;
  name: string;
  image: string;
}

class Game {
  private pokeContainer: HTMLElement;
  private timeDisplay: HTMLElement;
  private levelDisplay: HTMLElement;
  private popupTable: HTMLElement;
  private popupStartBtn: HTMLElement;
  private popupRestartBtn: HTMLElement;
  private levelBtns: NodeListOf<HTMLElement>;

  private pokemonsArray: Pokemon[] = [];
  private openCards: HTMLElement[] = [];
  private isProcessing: boolean = false;
  private currentLevel: number = 1;
  private totalPairs: number = 0;
  private matchedPairs: number = 0;

  private sounds = {
    success: document.getElementById("sound__success") as HTMLAudioElement,
    card: document.getElementById("sound__card") as HTMLAudioElement,
    error: document.getElementById("sound__error") as HTMLAudioElement,
    start: document.getElementById("sound__start") as HTMLAudioElement,
    level: document.getElementById("sound__level") as HTMLAudioElement,
    goodEnd: document.getElementById("sound__good-end") as HTMLAudioElement,
  };

  constructor() {
    this.pokeContainer = document.querySelector("#pokes") as HTMLElement;
    this.timeDisplay = document.querySelector("#time") as HTMLElement;
    this.levelDisplay = document.querySelector("#level") as HTMLElement;
    this.popupTable = document.querySelector("#table") as HTMLElement;
    this.popupStartBtn = document.querySelector("#start-btn") as HTMLElement;
    this.popupRestartBtn = document.querySelector(
      "#restart-btn",
    ) as HTMLElement;
    this.levelBtns = document.querySelectorAll(".level-btn");

    this.init();
  }

  private async init() {
    await this.fetchPokemons();
    this.addEventListeners();
    this.updateTime();
  }

  private updateTime() {
    const now = new Date();
    this.timeDisplay.innerText = now.toLocaleTimeString();
    setInterval(() => {
      this.timeDisplay.innerText = new Date().toLocaleTimeString();
    }, 1000);
  }

  private async fetchPokemons() {
    // Fetch some pokemons to build the deck
    // Using a range to get a variety
    const ids = Array.from({ length: 30 }, (_, i) => i * 3 + 1); // 1, 4, 7... original logic

    const promises = ids.map(async (id) => {
      try {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
        const data = await res.json();
        return {
          id: data.id,
          name: data.name,
          image:
            data.sprites.other?.dream_world?.front_default ||
            data.sprites.front_default,
        };
      } catch (e) {
        console.error(e);
        return null;
      }
    });

    const results = await Promise.all(promises);
    this.pokemonsArray = results.filter((p) => p !== null) as Pokemon[];
    console.log("Pokemons loaded:", this.pokemonsArray.length);
  }

  private addEventListeners() {
    this.popupStartBtn.addEventListener("click", () => this.startGame());
    this.popupRestartBtn.addEventListener("click", () => this.startGame());

    this.levelBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const el = e.target as HTMLElement;
        const level = parseInt(el.innerText);
        this.currentLevel = level;
        this.levelDisplay.innerText = level.toString();
        this.startGame();
      });
    });
  }

  private startGame() {
    this.pokeContainer.innerHTML = "";
    this.popupTable.classList.add("opacity-0", "pointer-events-none"); // Hide popup
    this.popupRestartBtn.classList.remove("hidden"); // Show restart for next time
    this.popupStartBtn.classList.add("hidden");

    this.playSound("start");

    // Prepare deck based on level
    const deck = this.prepareDeck();

    deck.forEach((pokemon) => {
      this.createCard(pokemon);
    });

    this.matchedPairs = 0;
    this.totalPairs = deck.length / 2;
  }

  private prepareDeck(): Pokemon[] {
    // Original logic:
    // Lvl 1: 2 pairs from 2 random pokemon
    // Lvl 2: 4 pairs from 4 random pokemon
    // Lvl 3: 6 pairs from 6 random pokemon

    let count = 2; // Default level 1
    if (this.currentLevel === 2) count = 4;
    if (this.currentLevel === 3) count = 6;

    // Shuffle main array
    const shuffled = [...this.pokemonsArray].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, count);

    // Duplicate to form pairs
    const pairs = [...selected, ...selected];

    // Shuffle pairs
    return pairs.sort(() => 0.5 - Math.random());
  }

  private createCard(pokemon: Pokemon) {
    const card = document.createElement("div");
    // Using Tailwind classes for layout and 3D effect
    // We need 'group' on container to control hover effect if we wanted it solely CSS,
    // but here we use classes for state.
    card.className = `pokemon-card relative w-[100px] h-[100px] md:w-[150px] md:h-[150px] m-2 cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95 select-none perspective-1000`;
    card.dataset.id = pokemon.id.toString();

    // The inner container that flips
    const inner = document.createElement("div");
    inner.className = `flip-card-inner relative w-full h-full duration-500 transform-style-3d shadow-md rounded-xl`;

    // Front (Cover)
    const front = document.createElement("div");
    front.className = `card-front absolute w-full h-full bg-gradient-to-l from-gray-300 to-gray-400 rounded-xl backface-hidden flex items-center justify-center border-4 border-[#deebed]`;
    // Optional: Add a pokeball icon or pattern to the back
    front.innerHTML = `<span class="text-4xl opacity-20">?</span>`;

    // Back (Pokemon Image)
    const back = document.createElement("div");
    back.className = `card-back absolute w-full h-full bg-gradient-to-l from-gray-200 to-gray-300 rounded-xl backface-hidden rotate-y-180 flex items-center justify-center border-4 border-[#deebed] overflow-hidden`;

    const imgWrapper = document.createElement("div");
    imgWrapper.className = `bg-[#deebed] rounded-full p-2 w-[80%] h-[80%] flex items-center justify-center shadow-inner`;

    const img = document.createElement("img");
    img.src = pokemon.image;
    img.draggable = false;
    img.className = `max-w-full max-h-full drop-shadow-md`;

    imgWrapper.appendChild(img);
    back.appendChild(imgWrapper);

    inner.appendChild(front);
    inner.appendChild(back);
    card.appendChild(inner);

    card.addEventListener("click", () => this.handleCardClick(card));
    this.pokeContainer.appendChild(card);
  }

  private handleCardClick(card: HTMLElement) {
    if (this.isProcessing) return;
    if (card.classList.contains("open")) return; // Already open logic
    if (card.classList.contains("matched")) return; // Already matched

    this.playSound("card");
    this.openCard(card);
    this.openCards.push(card);

    if (this.openCards.length === 2) {
      this.checkMatch();
    }
  }

  private openCard(card: HTMLElement) {
    card.classList.add("open");
    const inner = card.querySelector(".flip-card-inner") as HTMLElement;
    inner.style.transform = "rotateY(180deg)";
  }

  private closeCard(card: HTMLElement) {
    card.classList.remove("open");
    const inner = card.querySelector(".flip-card-inner") as HTMLElement;
    inner.style.transform = "rotateY(0deg)";
  }

  private checkMatch() {
    this.isProcessing = true;
    const [card1, card2] = this.openCards;
    const id1 = card1.dataset.id;
    const id2 = card2.dataset.id;

    if (id1 === id2) {
      this.handleMatch(card1, card2);
    } else {
      this.handleMismatch(card1, card2);
    }
  }

  private handleMatch(card1: HTMLElement, card2: HTMLElement) {
    this.sounds.success.currentTime = 0;
    this.sounds.success.play();

    // Success animation or effect
    card1.classList.add("matched");
    card2.classList.add("matched");

    // Add success animation class (scale pulse)
    card1.classList.add("animate-ping-once");
    card2.classList.add("animate-ping-once");

    this.openCards = [];
    this.isProcessing = false;
    this.matchedPairs++;

    if (this.matchedPairs === this.totalPairs) {
      this.handleWin();
    }
  }

  private handleMismatch(card1: HTMLElement, card2: HTMLElement) {
    this.sounds.error.currentTime = 0;
    this.sounds.error.play();

    // Error shake animation
    card1.classList.add("animate-shake");
    card2.classList.add("animate-shake");

    setTimeout(() => {
      this.closeCard(card1);
      this.closeCard(card2);

      card1.classList.remove("animate-shake");
      card2.classList.remove("animate-shake");

      this.openCards = [];
      this.isProcessing = false;
    }, 800);
  }

  private handleWin() {
    this.playSound("goodEnd");
    setTimeout(() => {
      this.popupTable.classList.remove("opacity-0", "pointer-events-none");
    }, 1000);
  }

  private playSound(name: keyof typeof this.sounds) {
    const sound = this.sounds[name];
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch((e) => console.log("Audio play failed", e));
    }
  }
}

// Start Game
window.addEventListener("DOMContentLoaded", () => {
  new Game();
});
