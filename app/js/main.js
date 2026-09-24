class HeroCarousel {
  constructor(root) {
    this.root = root;
    this.slides = Array.from(root.querySelectorAll(".hero__slide"));
    this.indicators = Array.from(root.querySelectorAll(".hero__indicator"));
    this.videos = this.slides.map((slide) => slide.querySelector(".hero__video"));
    this.prevBtn = root.querySelector(".hero__arrow--prev");
    this.nextBtn = root.querySelector(".hero__arrow--next");
    this.indicatorsNav = root.querySelector(".hero__indicators");
    this.interval = Number(root.dataset.interval) || 9000;
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

class ServicesScroll {
  constructor(section) {
    this.services = Array.from(section.querySelectorAll(".service"));
    this.panels = this.services.map((service) => service.querySelector(".service__panel"));

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      this.panels.forEach((panel) => panel.style.setProperty("--iris", 1));
      return;
    }

    this.ticking = false;
    window.addEventListener("scroll", () => this.requestTick(), { passive: true });
    window.addEventListener("resize", () => this.requestTick(), { passive: true });
    this.update();
  }

  requestTick() {
    if (this.ticking) return;
    this.ticking = true;
    requestAnimationFrame(() => {
      this.update();
      this.ticking = false;
    });
  }

  update() {
    const half = window.innerHeight / 2;
    this.services.forEach((service, i) => {
      const top = service.getBoundingClientRect().top;
      const iris = Math.min(1, Math.max(0, (half - top) / half));
      this.panels[i].style.setProperty("--iris", iris.toFixed(4));
    });
  }
}

const RENDER_POOLS = {
  r: [1, 2, 3, 5, 6, 7],
  c: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
  e: [1, 2, 3, 4, 5, 6, 7, 8]
};

function assignRenders() {
  document.querySelectorAll(".service__img[data-pool]").forEach((box) => {
    const pool = RENDER_POOLS[box.dataset.pool];
    if (!pool) return;
    const shuffled = pool.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    box.querySelectorAll(".service__col").forEach((img, i) => {
      const id = shuffled[i % shuffled.length];
      img.src = "img/renders/optimized/" + box.dataset.pool + id + ".jpg";
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const hero = document.querySelector(".hero");
  if (hero) new HeroCarousel(hero);

  const services = document.querySelector(".services");
  if (services) new ServicesScroll(services);

  assignRenders();
});
