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

class CompareSlider {
  constructor(root) {
    this.root = root;
    this.handle = root.querySelector(".compare__handle");
    this.pos = 50;
    this.dragging = false;

    root.addEventListener("pointerdown", (event) => {
      this.dragging = true;
      root.setPointerCapture(event.pointerId);
      this.moveTo(event.clientX);
    });

    root.addEventListener("pointermove", (event) => {
      if (this.dragging) this.moveTo(event.clientX);
    });

    ["pointerup", "pointercancel"].forEach((type) => {
      root.addEventListener(type, () => {
        this.dragging = false;
      });
    });

    this.handle.addEventListener("keydown", (event) => {
      const step = event.shiftKey ? 10 : 3;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        event.stopPropagation();
        this.setPos(this.pos - step);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        event.stopPropagation();
        this.setPos(this.pos + step);
      } else if (event.key === "Home") {
        this.setPos(0);
      } else if (event.key === "End") {
        this.setPos(100);
      }
    });

    this.setPos(50);
  }

  moveTo(clientX) {
    const rect = this.root.getBoundingClientRect();
    this.setPos(((clientX - rect.left) / rect.width) * 100);
  }

  setPos(value) {
    this.pos = Math.min(100, Math.max(0, value));
    this.root.style.setProperty("--pos", this.pos + "%");
    this.handle.setAttribute("aria-valuenow", String(Math.round(this.pos)));
  }
}

class PhotoCarousel {
  constructor(root) {
    this.root = root;
    this.createRenderSlides();
    this.slides = Array.from(root.querySelectorAll(".photos__img"));
    this.counter = root.querySelector(".photos__counter");
    this.total = this.slides.length;
    this.index = 0;

    root.querySelector(".photos__arrow--prev").addEventListener("click", () => this.go(this.index - 1));
    root.querySelector(".photos__arrow--next").addEventListener("click", () => this.go(this.index + 1));

    root.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        event.stopPropagation();
        this.go(this.index - 1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        event.stopPropagation();
        this.go(this.index + 1);
      }
    });

    let startX = null;
    let startY = null;

    root.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "mouse") return;
      startX = event.clientX;
      startY = event.clientY;
    });

    root.addEventListener("pointerup", (event) => {
      if (startX === null) return;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      startX = null;
      startY = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
        this.go(this.index + (dx < 0 ? 1 : -1));
      }
    });

    root.addEventListener("pointercancel", () => {
      startX = null;
      startY = null;
    });

    this.go(0);
  }

  createRenderSlides() {
    const pool = RENDER_POOLS[this.root.dataset.renderPool];
    if (!pool) return;

    const label = this.root.dataset.renderLabel || "Render";
    const folder = RENDER_FOLDERS[this.root.dataset.renderPool];
    const slides = document.createDocumentFragment();

    pool.forEach((id, index) => {
      const img = document.createElement("img");
      img.className = "photos__img";
      img.alt = `${label} ${index + 1} de ${pool.length}`;
      img.loading = "lazy";
      img.decoding = "async";
      const path = folder
        ? `img/renders/optimized/${folder}/${id}.jpg`
        : `img/renders/optimized/${this.root.dataset.renderPool}${id}.jpg`;
      if (index === 0) {
        img.src = path;
      } else {
        img.dataset.src = path;
      }
      slides.append(img);
    });

    this.root.prepend(slides);
  }

  load(i) {
    const img = this.slides[i];
    if (img && !img.hasAttribute("src")) img.src = img.dataset.src;
  }

  go(i) {
    this.index = ((i % this.total) + this.total) % this.total;
    this.slides.forEach((img, n) => img.classList.toggle("is-active", n === this.index));
    this.load(this.index);
    this.load((this.index + 1) % this.total);
    this.counter.textContent =
      String(this.index + 1).padStart(2, "0") + " / " + String(this.total).padStart(2, "0");
  }
}

class FaqAccordion {
  constructor(root) {
    this.root = root;
    this.items = Array.from(root.querySelectorAll(".faq__item"));

    this.items.forEach((item) => {
      item.querySelector(".faq__q").addEventListener("click", () => this.toggle(item));
    });

    window.addEventListener("resize", () => {
      const open = root.querySelector(".faq__item.is-open .faq__a");
      if (open) open.style.maxHeight = open.scrollHeight + "px";
    });
  }

  toggle(item) {
    const wasOpen = item.classList.contains("is-open");
    this.items.forEach((other) => this.close(other));
    if (!wasOpen) this.open(item);
  }

  open(item) {
    item.classList.add("is-open");
    item.querySelector(".faq__q").setAttribute("aria-expanded", "true");
    const panel = item.querySelector(".faq__a");
    panel.style.maxHeight = panel.scrollHeight + "px";
  }

  close(item) {
    item.classList.remove("is-open");
    item.querySelector(".faq__q").setAttribute("aria-expanded", "false");
    item.querySelector(".faq__a").style.maxHeight = "";
  }
}

class SiteNavigation {
  constructor(root) {
    this.root = root;
    this.toggle = root.querySelector(".site-nav__toggle");
    this.links = Array.from(root.querySelectorAll(".site-nav a"));
    this.hero = document.querySelector(".hero");

    this.toggle.addEventListener("click", () => this.toggleMenu());
    this.links.forEach((link) => link.addEventListener("click", () => this.closeMenu()));
    window.addEventListener("scroll", () => this.updateState(), { passive: true });
    window.addEventListener("resize", () => this.updateState());
    this.updateState();
  }

  updateState() {
    const threshold = this.hero ? this.hero.offsetHeight - this.root.offsetHeight : 80;
    this.root.classList.toggle("is-scrolled", window.scrollY > threshold);
  }

  toggleMenu() {
    const isOpen = this.root.classList.toggle("menu-open");
    this.toggle.setAttribute("aria-expanded", String(isOpen));
    this.toggle.setAttribute("aria-label", isOpen ? "Cerrar menú" : "Abrir menú");
  }

  closeMenu() {
    this.root.classList.remove("menu-open");
    this.toggle.setAttribute("aria-expanded", "false");
    this.toggle.setAttribute("aria-label", "Abrir menú");
  }
}

class XrayHover {
  constructor(root) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    this.root = root;
    this.layer = root.querySelector(".p4__layer, .cta__layer");
    this.pointer = { x: -300, y: -300 };
    this.current = { x: -300, y: -300, radius: 0 };
    this.target = { x: -300, y: -300, radius: 0 };
    this.frameId = null;

    root.addEventListener("pointerenter", (event) => {
      if (event.pointerType !== "mouse") return;
      this.updatePointer(event);
      this.target.radius = this.getRadius();
      this.requestFrame();
    });

    root.addEventListener("pointermove", (event) => {
      if (event.pointerType !== "mouse") return;
      this.updatePointer(event);
      this.requestFrame();
    });

    root.addEventListener("pointerleave", (event) => {
      if (event.pointerType !== "mouse") return;
      this.hide();
    });

    root.addEventListener("touchstart", (event) => {
      const touch = event.touches[0];
      if (!touch) return;
      this.updateTouch(touch);
      this.target.radius = this.getRadius();
      this.requestFrame();
    }, { passive: true });

    root.addEventListener("touchmove", (event) => {
      const touch = event.touches[0];
      if (!touch) return;
      this.updateTouch(touch);
      this.requestFrame();
    }, { passive: true });

    root.addEventListener("touchend", () => this.hide(), { passive: true });
    root.addEventListener("touchcancel", () => this.hide(), { passive: true });

    window.addEventListener("resize", () => {
      if (this.target.radius > 0) this.target.radius = this.getRadius();
    });
  }

  hide() {
    this.target.x = -300;
    this.target.y = -300;
    this.target.radius = 0;
    this.requestFrame();
  }

  updatePointer(event) {
    const rect = this.root.getBoundingClientRect();
    this.target.x = event.clientX - rect.left;
    this.target.y = event.clientY - rect.top;
  }

  updateTouch(touch) {
    const rect = this.root.getBoundingClientRect();
    this.target.x = touch.clientX - rect.left;
    this.target.y = touch.clientY - rect.top;
  }

  getRadius() {
    const rect = this.root.getBoundingClientRect();
    return Math.min(240, Math.max(160, Math.min(rect.width, rect.height) * 0.38));
  }

  requestFrame() {
    if (this.frameId === null) this.frameId = requestAnimationFrame(() => this.animate());
  }

  animate() {
    this.frameId = null;
    this.current.x = this.lerp(this.current.x, this.target.x, 0.18);
    this.current.y = this.lerp(this.current.y, this.target.y, 0.18);
    this.current.radius = this.lerp(this.current.radius, this.target.radius, 0.18);
    this.layer.style.setProperty("--xray-x", this.current.x + "px");
    this.layer.style.setProperty("--xray-y", this.current.y + "px");
    this.layer.style.setProperty("--xray-radius", this.current.radius + "px");

    const moving = Math.abs(this.current.x - this.target.x) > 0.5 ||
      Math.abs(this.current.y - this.target.y) > 0.5 ||
      Math.abs(this.current.radius - this.target.radius) > 0.5;
    if (moving) this.requestFrame();
  }

  lerp(current, target, amount) {
    return current + (target - current) * amount;
  }
}

const RENDER_FOLDERS = {
  "r-new": "Residencial",
  "e-new": "Empresarial",
  "c-new": "Comercial"
};

const RENDER_POOLS = {
  r: [1, 2, 3, 5, 6, 7],
  c: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
  e: [1, 2, 3, 4, 5, 6, 7, 8],
  "r-new": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  "e-new": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  "c-new": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
};

document.addEventListener("DOMContentLoaded", () => {
  const navigation = document.querySelector(".site-header");
  if (navigation) new SiteNavigation(navigation);

  const hero = document.querySelector(".hero");
  if (hero) new HeroCarousel(hero);

  const compare = document.querySelector("[data-compare]");
  if (compare) new CompareSlider(compare);

  document.querySelectorAll("[data-photos]").forEach((photos) => new PhotoCarousel(photos));

  const faq = document.querySelector(".faq");
  if (faq) new FaqAccordion(faq);

  const xray = document.querySelector("[data-xray]");
  if (xray) new XrayHover(xray);

});
