interface Pokemon {
  id: number;
  name: string;
  image: string;
}

class Game {
  private pokeContainer: HTMLElement;
  private timeDisplay: HTMLElement;
  private levelDisplay: HTMLElement;

  private menuContainer: HTMLElement;
  private startBtn: HTMLElement;
  private backBtn: HTMLElement;

  private resultModal: HTMLElement;
  private restartBtn: HTMLElement;

  private levelBtns: NodeListOf<HTMLElement>;

  private pokemonsArray: Pokemon[] = [];
  private openCards: HTMLElement[] = [];
  private isProcessing: boolean = false;
  private currentLevel: number = 1;
  private totalPairs: number = 0;
  private matchedPairs: number = 0;
  private gameTitle: HTMLElement;

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

    this.menuContainer = document.querySelector("#menu") as HTMLElement;
    this.startBtn = document.querySelector("#start-btn") as HTMLElement;
    this.backBtn = document.querySelector("#back-btn") as HTMLElement;

    this.resultModal = document.querySelector("#result-modal") as HTMLElement;
    this.restartBtn = document.querySelector("#restart-btn") as HTMLElement;

    this.levelBtns = document.querySelectorAll(".level-btn");
    this.gameTitle = document.querySelector("#game-title") as HTMLElement;

    this.init();
  }

  private async init() {
    await this.fetchPokemons();
    this.addEventListeners();
    this.updateTime();
  }

  private updateTime() {
    const update = () => {
      const now = new Date();
      // Format MM:SS or HH:MM
      const hours = now.getHours().toString().padStart(2, "0");
      const minutes = now.getMinutes().toString().padStart(2, "0");
      this.timeDisplay.innerText = `${hours}:${minutes}`;
    };
    update();
    setInterval(update, 1000);
  }

  private async fetchPokemons() {
    const ids = Array.from({ length: 30 }, (_, i) => i * 3 + 1);

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
  }

  private addEventListeners() {
    this.startBtn.addEventListener("click", () => this.startGame());
    this.restartBtn.addEventListener("click", () => {
      this.hideResultModal();
      this.showMenu();
    });

    this.backBtn.addEventListener("click", () => this.stopGame());

    this.levelBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const el = e.target as HTMLElement;
        // Level selection UI handled by inline script, just update state
        const level = parseInt(el.getAttribute("data-level") || "1");
        this.currentLevel = level;
        this.levelDisplay.innerText = level.toString();
      });
    });
  }

  private startGame() {
    this.menuContainer.classList.add("opacity-0", "pointer-events-none");

    // Animate Title to shrink or move up
    this.gameTitle.classList.add(
      "scale-50",
      "-translate-y-24",
      "opacity-0",
      "md:opacity-100",
    ); // Hide on mobile, keep small on desktop? No, let's just fade it out on mobile

    this.backBtn.classList.remove("opacity-0");
    this.pokeContainer.innerHTML = "";

    this.playSound("start");

    const deck = this.prepareDeck();

    // Staggered entry
    deck.forEach((pokemon, index) => {
      setTimeout(() => {
        this.createCard(pokemon);
      }, index * 100);
    });

    this.matchedPairs = 0;
    this.totalPairs = deck.length / 2;
  }

  private stopGame() {
    // Return to menu
    this.menuContainer.classList.remove("opacity-0", "pointer-events-none");
    this.gameTitle.classList.remove("scale-50", "-translate-y-24", "opacity-0");
    this.backBtn.classList.add("opacity-0");

    this.pokeContainer.innerHTML = "";
    this.openCards = [];
  }

  private showResultModal() {
    this.resultModal.classList.remove("opacity-0", "pointer-events-none");
  }

  private hideResultModal() {
    this.resultModal.classList.add("opacity-0", "pointer-events-none");
  }

  private showMenu() {
    this.stopGame();
  }

  private prepareDeck(): Pokemon[] {
    let count = 2;
    if (this.currentLevel === 2) count = 4;
    if (this.currentLevel === 3) count = 6;

    const shuffled = [...this.pokemonsArray].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, count);
    const pairs = [...selected, ...selected];
    return pairs.sort(() => 0.5 - Math.random());
  }

  private createCard(pokemon: Pokemon) {
    const card = document.createElement("div");
    // Neumorphic Card Styling
    card.className = `pokemon-card relative w-[100px] h-[100px] md:w-[140px] md:h-[140px] m-4 cursor-pointer transition-transform duration-300 hover:scale-105 active:scale-95 select-none perspective-1000 opacity-0 animate-fade-in-up`;
    card.style.animationFillMode = "forwards";
    card.dataset.id = pokemon.id.toString();

    const inner = document.createElement("div");
    inner.className = `flip-card-inner relative w-full h-full duration-500 transform-style-3d rounded-2xl`;

    // Front: Neumorphic Flat/Convex
    const front = document.createElement("div");
    front.className = `card-front absolute w-full h-full neu-flat rounded-2xl backface-hidden flex items-center justify-center text-gray-400`;
    front.innerHTML = `
        <svg class="w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
    `;

    // Back: Neumorphic Pressed/Inset
    const back = document.createElement("div");
    back.className = `card-back absolute w-full h-full neu-pressed rounded-2xl backface-hidden rotate-y-180 flex items-center justify-center overflow-hidden border-2 border-transparent`;

    const imgWrapper = document.createElement("div");
    imgWrapper.className = `w-[80%] h-[80%] flex items-center justify-center`;

    const img = document.createElement("img");
    img.src = pokemon.image;
    img.draggable = false;
    img.className = `max-w-full max-h-full drop-shadow-lg`;

    imgWrapper.appendChild(img);
    back.appendChild(imgWrapper);

    inner.appendChild(front);
    inner.appendChild(back);
    card.appendChild(inner);

    card.addEventListener("click", () => this.handleCardClick(card));
    this.pokeContainer.appendChild(card);

    // Trigger entry animation
    requestAnimationFrame(() => {
      card.classList.remove("opacity-0");
      card.style.animation = "none"; // reset after fade in
      card.style.opacity = "1";
    });
  }

  private handleCardClick(card: HTMLElement) {
    if (this.isProcessing) return;
    if (card.classList.contains("open")) return;
    if (card.classList.contains("matched")) return;

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

    // Add glowing border on open
    const back = card.querySelector(".card-back");
    back?.classList.add("border-[#6d5dfc/50]");
  }

  private closeCard(card: HTMLElement) {
    card.classList.remove("open");
    const inner = card.querySelector(".flip-card-inner") as HTMLElement;
    inner.style.transform = "rotateY(0deg)";

    const back = card.querySelector(".card-back");
    back?.classList.remove("border-[#6d5dfc/50]");
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

    card1.classList.add("matched");
    card2.classList.add("matched");

    // Success emphasis
    const back1 = card1.querySelector(".card-back") as HTMLElement;
    const back2 = card2.querySelector(".card-back") as HTMLElement;

    back1.style.borderColor = "#6d5dfc";
    back2.style.borderColor = "#6d5dfc";

    card1.classList.add("animate-bounce");
    card2.classList.add("animate-bounce");

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

    card1.classList.add("animate-shake");
    card2.classList.add("animate-shake");

    // Red error glow
    const back1 = card1.querySelector(".card-back") as HTMLElement;
    const back2 = card2.querySelector(".card-back") as HTMLElement;
    back1.style.borderColor = "#ff6b6b";
    back2.style.borderColor = "#ff6b6b";

    setTimeout(() => {
      this.closeCard(card1);
      this.closeCard(card2);

      card1.classList.remove("animate-shake");
      card2.classList.remove("animate-shake");

      // Reset colors
      back1.style.borderColor = "transparent";
      back2.style.borderColor = "transparent";

      this.openCards = [];
      this.isProcessing = false;
    }, 800);
  }

  private handleWin() {
    this.playSound("goodEnd");
    setTimeout(() => {
      this.showResultModal();
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
