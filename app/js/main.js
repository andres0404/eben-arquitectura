class HeroCarousel {
  constructor(root) {
    this.root = root;
    this.slides = Array.from(root.querySelectorAll(".hero__slide"));
    this.indicators = Array.from(root.querySelectorAll(".hero__indicator"));
    this.videos = this.slides.map((slide) => slide.querySelector(".hero__video"));
    this.prevBtn = root.querySelector(".hero__arrow--prev");
    this.nextBtn = root.querySelector(".hero__arrow--next");
    this.indicatorsNav = root.querySelector(".hero__indicators");
    this.interval = Number(root.dataset.interval) || 7000;
    this.index = 0;
    this.timer = null;
    this.paused = false;
    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    this.bindEvents();
    this.goTo(0);
  }

  bindEvents() {
    this.prevBtn.addEventListener("click", () => this.goTo(this.index - 1));
    this.nextBtn.addEventListener("click", () => this.goTo(this.index + 1));

    this.indicators.forEach((btn) => {
      btn.addEventListener("click", () => this.goTo(Number(btn.dataset.slide)));
    });

    const controls = [this.prevBtn, this.nextBtn, this.indicatorsNav];
    controls.forEach((el) => {
      el.addEventListener("pointerenter", () => this.pause());
      el.addEventListener("pointerleave", () => this.resume());
      el.addEventListener("focusin", () => this.pause());
      el.addEventListener("focusout", (event) => {
        const stillInside = controls.some((c) => c.contains(event.relatedTarget));
        if (!stillInside) this.resume();
      });
    });

    window.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") this.goTo(this.index - 1);
      if (event.key === "ArrowRight") this.goTo(this.index + 1);
    });

    let touchStartX = null;
    this.root.addEventListener(
      "touchstart",
      (event) => {
        touchStartX = event.touches[0].clientX;
      },
      { passive: true }
    );
    this.root.addEventListener(
      "touchend",
      (event) => {
        if (touchStartX === null) return;
        const deltaX = event.changedTouches[0].clientX - touchStartX;
        touchStartX = null;
        if (Math.abs(deltaX) < 50) return;
        this.goTo(deltaX < 0 ? this.index + 1 : this.index - 1);
      },
      { passive: true }
    );
  }

  goTo(index) {
    const count = this.slides.length;
    this.index = ((index % count) + count) % count;

    this.slides.forEach((slide, i) => {
      const active = i === this.index;
      slide.classList.toggle("is-active", active);
      slide.setAttribute("aria-hidden", String(!active));
    });

    this.indicators.forEach((btn, i) => {
      const active = i === this.index;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-current", active ? "true" : "false");
    });

    this.videos.forEach((video, i) => {
      if (!video) return;
      if (i === this.index) {
        video.currentTime = 0;
        const promise = video.play();
        if (promise) promise.catch(() => {});
      } else {
        video.pause();
      }
    });

    this.restartProgress();
    this.startTimer();
  }

  restartProgress() {
    const progress = this.indicators[this.index].querySelector(".hero__indicator-progress");
    if (!progress) return;
    progress.style.animation = "none";
    void progress.offsetHeight;
    progress.style.animation = "";
  }

  startTimer() {
    clearInterval(this.timer);
    if (this.reducedMotion || this.paused) return;
    this.timer = setInterval(() => this.goTo(this.index + 1), this.interval);
  }

  pause() {
    this.paused = true;
    clearInterval(this.timer);
    this.root.classList.add("is-paused");
  }

  resume() {
    this.paused = false;
    this.root.classList.remove("is-paused");
    this.restartProgress();
    this.startTimer();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const hero = document.querySelector(".hero");
  if (hero) new HeroCarousel(hero);
});
