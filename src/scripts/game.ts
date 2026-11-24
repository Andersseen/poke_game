import { MusicEngine } from "./music";

interface Pokemon {
  id: number;
  name: string;
  image: string;
}

interface LevelConfig {
  level: number;
  pairs: number;
  /** Seconds available to clear the level. */
  time: number;
}

const LEVELS: LevelConfig[] = [
  { level: 1, pairs: 6, time: 75 },
  { level: 2, pairs: 8, time: 100 },
  { level: 3, pairs: 10, time: 120 },
  { level: 4, pairs: 12, time: 150 },
];

/** Practice round (2×2, 4 cards) offered before the real levels. */
const TUTORIAL: LevelConfig = { level: 0, pairs: 2, time: 90 };

const TUTORIAL_SEEN_KEY = "poke_tutorial_seen";

class Game {
  private pokeContainer: HTMLElement;
  private timeDisplay: HTMLElement;
  private levelDisplay: HTMLElement;

  private menuContainer: HTMLElement;
  private startBtn: HTMLElement;
  private backBtn: HTMLElement;

  private resultModal: HTMLElement;
  private resultTitle: HTMLElement;
  private resultText: HTMLElement;
  private restartBtn: HTMLElement;
  private nextLevelBtn: HTMLElement;

  private gameoverModal: HTMLElement;
  private retryBtn: HTMLElement;

  private tutorialModal: HTMLElement;
  private tutorialPlayBtn: HTMLElement;
  private tutorialSkipBtn: HTMLElement;
  private helpBtn: HTMLElement;
  private muteBtn: HTMLElement;
  private soundOnIcon: HTMLElement;
  private soundOffIcon: HTMLElement;

  private levelBtns: NodeListOf<HTMLElement>;

  private pokemonsArray: Pokemon[] = [];
  private openCards: HTMLElement[] = [];
  private isProcessing: boolean = false;
  private currentLevel: number = 1;
  private totalPairs: number = 0;
  private matchedPairs: number = 0;
  private gameTitle: HTMLElement;

  private timeLeft: number = 0;
  private timerId: number | null = null;
  private playing: boolean = false;
  private inTutorial: boolean = false;

  private music = new MusicEngine();

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
    this.resultTitle = document.querySelector("#result-title") as HTMLElement;
    this.resultText = document.querySelector("#result-text") as HTMLElement;
    this.restartBtn = document.querySelector("#restart-btn") as HTMLElement;
    this.nextLevelBtn = document.querySelector("#next-level-btn") as HTMLElement;

    this.gameoverModal = document.querySelector("#gameover-modal") as HTMLElement;
    this.retryBtn = document.querySelector("#retry-btn") as HTMLElement;

    this.tutorialModal = document.querySelector("#tutorial-modal") as HTMLElement;
    this.tutorialPlayBtn = document.querySelector(
      "#tutorial-play-btn",
    ) as HTMLElement;
    this.tutorialSkipBtn = document.querySelector(
      "#tutorial-skip-btn",
    ) as HTMLElement;
    this.helpBtn = document.querySelector("#help-btn") as HTMLElement;
    this.muteBtn = document.querySelector("#mute-btn") as HTMLElement;
    this.soundOnIcon = document.querySelector("#sound-on-icon") as HTMLElement;
    this.soundOffIcon = document.querySelector("#sound-off-icon") as HTMLElement;

    this.levelBtns = document.querySelectorAll(".level-btn");
    this.gameTitle = document.querySelector("#game-title") as HTMLElement;

    this.init();
  }

  private get levelConfig(): LevelConfig {
    if (this.inTutorial) return TUTORIAL;
    return LEVELS.find((l) => l.level === this.currentLevel) ?? LEVELS[0];
  }

  private async init() {
    this.updateMuteIcon();
    this.addEventListeners();
    this.maybeShowTutorial();

    // Browsers require a user gesture before audio can start.
    const unlock = () => {
      this.music.play("menu");
      document.removeEventListener("pointerdown", unlock);
    };
    document.addEventListener("pointerdown", unlock);

    await this.fetchPokemons();
  }

  /* ────────────────────────── Tutorial ────────────────────────── */

  private maybeShowTutorial() {
    if (localStorage.getItem(TUTORIAL_SEEN_KEY) === "1") return;
    this.showTutorial();
  }

  private showTutorial() {
    this.tutorialModal.classList.remove("opacity-0", "pointer-events-none");
  }

  private hideTutorial() {
    this.tutorialModal.classList.add("opacity-0", "pointer-events-none");
    localStorage.setItem(TUTORIAL_SEEN_KEY, "1");
  }

  private startTutorial() {
    this.hideTutorial();
    this.inTutorial = true;
    this.levelDisplay.innerText = "T";
    this.startGame();
  }

  /* ────────────────────────── Timer ───────────────────────────── */

  private startTimer() {
    this.stopTimer();
    this.timeLeft = this.levelConfig.time;
    this.renderTime();
    this.timerId = window.setInterval(() => {
      this.timeLeft--;
      this.renderTime();
      if (this.timeLeft <= 0) {
        this.handleGameOver();
      }
    }, 1000);
  }

  private stopTimer() {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.timeDisplay.classList.remove("time-warning");
  }

  private renderTime() {
    const clamped = Math.max(0, this.timeLeft);
    const minutes = Math.floor(clamped / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (clamped % 60).toString().padStart(2, "0");
    this.timeDisplay.innerText = `${minutes}:${seconds}`;
    this.timeDisplay.classList.toggle("time-warning", clamped <= 10);
  }

  private handleGameOver() {
    this.stopTimer();
    this.playing = false;
    this.playSound("error");
    this.music.play("menu");
    setTimeout(() => {
      this.gameoverModal.classList.remove("opacity-0", "pointer-events-none");
    }, 400);
  }

  /* ─────────────────────── Event wiring ───────────────────────── */

  private addEventListeners() {
    this.startBtn.addEventListener("click", () => this.startGame());

    this.restartBtn.addEventListener("click", () => {
      this.hideResultModal();
      this.stopGame();
    });

    this.nextLevelBtn.addEventListener("click", () => {
      this.hideResultModal();
      if (this.inTutorial) {
        this.selectLevel(1);
      } else if (this.currentLevel < LEVELS.length) {
        this.selectLevel(this.currentLevel + 1);
      }
      this.startGame();
    });

    this.retryBtn.addEventListener("click", () => {
      this.hideGameOverModal();
      this.startGame();
    });

    this.backBtn.addEventListener("click", () => this.stopGame());

    this.tutorialPlayBtn.addEventListener("click", () => this.startTutorial());
    this.tutorialSkipBtn.addEventListener("click", () => this.hideTutorial());
    this.helpBtn.addEventListener("click", () => this.showTutorial());

    this.muteBtn.addEventListener("click", () => {
      this.music.toggleMute();
      this.updateMuteIcon();
    });

    this.levelBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const level = parseInt(btn.getAttribute("data-level") || "1");
        this.selectLevel(level);
      });
    });
  }

  private selectLevel(level: number) {
    this.inTutorial = false;
    this.currentLevel = level;
    this.levelDisplay.innerText = level.toString();

    this.levelBtns.forEach((b) => {
      const isActive = parseInt(b.getAttribute("data-level") || "1") === level;
      b.classList.toggle("neu-pressed", isActive);
      b.classList.toggle("neu-icon-btn", !isActive);
      b.style.color = isActive ? "var(--primary)" : "var(--foreground)";
    });
  }

  private updateMuteIcon() {
    const muted = this.music.isMuted;
    this.soundOnIcon.classList.toggle("hidden", muted);
    this.soundOffIcon.classList.toggle("hidden", !muted);
  }

  /* ──────────────────────── Game flow ─────────────────────────── */

  private startGame() {
    this.hideGameOverModal();
    this.menuContainer.classList.add("opacity-0", "pointer-events-none");
    this.gameTitle.classList.add(
      "scale-50",
      "-translate-y-24",
      "opacity-0",
      "md:opacity-100",
    );

    // Show back button
    this.backBtn.classList.remove(
      "opacity-50",
      "pointer-events-none",
      "scale-90",
    );
    this.backBtn.classList.add(
      "opacity-100",
      "pointer-events-auto",
      "scale-100",
    );

    this.pokeContainer.innerHTML = "";
    this.pokeContainer.className = this.pokeContainer.className
      .replace(/\bpairs-\d+\b/g, "")
      .trim();
    this.pokeContainer.classList.add(`pairs-${this.levelConfig.pairs}`);

    this.playSound("start");
    this.music.play("game");
    this.playing = true;

    const deck = this.prepareDeck();

    deck.forEach((pokemon, index) => {
      setTimeout(() => {
        // The player may have gone back to the menu while cards were dealing.
        if (this.playing) this.createCard(pokemon);
      }, index * 100);
    });

    this.matchedPairs = 0;
    this.totalPairs = deck.length / 2;

    this.startTimer();
  }

  private stopGame() {
    this.playing = false;
    this.inTutorial = false;
    this.levelDisplay.innerText = this.currentLevel.toString();
    this.stopTimer();
    this.menuContainer.classList.remove("opacity-0", "pointer-events-none");
    this.gameTitle.classList.remove("scale-50", "-translate-y-24", "opacity-0");

    // Hide back button (return to dim/inactive state)
    this.backBtn.classList.add("opacity-50", "pointer-events-none", "scale-90");
    this.backBtn.classList.remove(
      "opacity-100",
      "pointer-events-auto",
      "scale-100",
    );

    this.pokeContainer.innerHTML = "";
    this.openCards = [];
    this.music.play("menu");
  }

  private showResultModal() {
    const isLast =
      !this.inTutorial && this.currentLevel >= LEVELS.length;

    if (this.inTutorial) {
      this.resultTitle.innerText = "¡TUTORIAL COMPLETADO!";
      this.resultText.innerText =
        "Ya sabes jugar. Ahora sí: ¡a por el Nivel 1!";
    } else {
      this.resultTitle.innerText = isLast
        ? "¡MAESTRO POKÉMON!"
        : "¡NIVEL SUPERADO!";
      this.resultText.innerText = isLast
        ? "Has completado todos los niveles. ¡Increíble memoria!"
        : `Te sobraron ${Math.max(0, this.timeLeft)}s. ¿Listo para el nivel ${this.currentLevel + 1}?`;
    }

    this.nextLevelBtn.classList.toggle("hidden", isLast);
    this.resultModal.classList.remove("opacity-0", "pointer-events-none");
  }

  private hideResultModal() {
    this.resultModal.classList.add("opacity-0", "pointer-events-none");
  }

  private hideGameOverModal() {
    this.gameoverModal.classList.add("opacity-0", "pointer-events-none");
  }

  /* ─────────────────────── Deck & cards ───────────────────────── */

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

  private prepareDeck(): Pokemon[] {
    const count = this.levelConfig.pairs;

    const shuffled = [...this.pokemonsArray].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, count);
    const pairs = [...selected, ...selected];
    return pairs.sort(() => 0.5 - Math.random());
  }

  private createCard(pokemon: Pokemon) {
    const card = document.createElement("div");
    card.className = `pokemon-card relative cursor-pointer transition-transform duration-300 hover:scale-105 active:scale-95 select-none perspective-1000 opacity-0 animate-fade-in-up`;
    card.style.animationFillMode = "forwards";
    card.dataset.id = pokemon.id.toString();

    const inner = document.createElement("div");
    inner.className = `flip-card-inner relative w-full h-full duration-500 transform-style-3d rounded-2xl`;

    // Front
    const front = document.createElement("div");
    front.className = `card-front absolute w-full h-full neu-flat rounded-2xl backface-hidden flex items-center justify-center text-gray-400`;
    front.innerHTML = `
        <svg class="w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
    `;

    const back = document.createElement("div");
    back.className = `card-back absolute w-full h-full neu-pressed rounded-2xl backface-hidden rotate-y-180 flex items-center justify-center overflow-hidden border-2 border-transparent transition-colors duration-300`;

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

    requestAnimationFrame(() => {
      card.classList.remove("opacity-0");
      card.style.animation = "none";
      card.style.opacity = "1";
    });
  }

  private handleCardClick(card: HTMLElement) {
    if (!this.playing) return;
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

    const back = card.querySelector(".card-back") as HTMLElement;
    back.style.borderColor = "rgba(109, 93, 252, 0.5)";
  }

  private closeCard(card: HTMLElement) {
    card.classList.remove("open");
    const inner = card.querySelector(".flip-card-inner") as HTMLElement;
    inner.style.transform = "rotateY(0deg)";

    const back = card.querySelector(".card-back") as HTMLElement;
    back.style.borderColor = "transparent";
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
    this.playSound("success");

    card1.classList.add("matched");
    card2.classList.add("matched");

    const back1 = card1.querySelector(".card-back") as HTMLElement;
    const back2 = card2.querySelector(".card-back") as HTMLElement;

    back1.style.borderColor = "var(--success)";
    back2.style.borderColor = "var(--success)";

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
    this.playSound("error");

    card1.classList.add("animate-shake");
    card2.classList.add("animate-shake");

    const back1 = card1.querySelector(".card-back") as HTMLElement;
    const back2 = card2.querySelector(".card-back") as HTMLElement;
    back1.style.borderColor = "var(--error)";
    back2.style.borderColor = "var(--error)";

    setTimeout(() => {
      this.closeCard(card1);
      this.closeCard(card2);

      card1.classList.remove("animate-shake");
      card2.classList.remove("animate-shake");

      back1.style.borderColor = "transparent";
      back2.style.borderColor = "transparent";

      this.openCards = [];
      this.isProcessing = false;
    }, 800);
  }

  private handleWin() {
    this.playing = false;
    this.stopTimer();
    this.playSound("goodEnd");
    setTimeout(() => {
      this.showResultModal();
    }, 1000);
  }

  private playSound(name: keyof typeof this.sounds) {
    const sound = this.sounds[name];
    if (sound) {
      const clone = sound.cloneNode() as HTMLAudioElement;
      clone.volume = 0.5;
      clone.play().catch((e) => console.log("Audio play failed", e));
      clone.addEventListener("ended", () => {
        clone.remove();
      });
    }
  }
}

window.addEventListener("DOMContentLoaded", () => {
  new Game();
});
