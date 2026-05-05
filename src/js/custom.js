'use strict';

class MobileMenu {
  constructor() {
    this.DOM = {};
    this.DOM.btn = document.querySelector('.p-header__menu');
    this.DOM.container = document.querySelector('#global-container');
    this.DOM.links = document.querySelectorAll('#global-container .p-header__nav a');
    this.closeTimer = null;

    if (!this.DOM.btn || !this.DOM.container) {
      return;
    }

    this.isTouchCapable = this._isTouchCapable();
    this._addEvent();
  }

  _isTouchCapable() {
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      navigator.msMaxTouchPoints > 0
    );
  }

  _toggle() {
    this.DOM.container.classList.toggle('menu-open');
  }

  _open() {
    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
    this.DOM.container.classList.add('menu-open');
  }

  _close() {
    this.DOM.container.classList.remove('menu-open');
  }

  _closeWithDelay() {
    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
    }

    this.closeTimer = setTimeout(() => {
      this._close();
      this.closeTimer = null;
    }, 180);
  }

  _addEvent() {
    if (this.isTouchCapable) {
      this.DOM.btn.addEventListener('click', this._toggle.bind(this));

      this.DOM.links.forEach((link) => {
        link.addEventListener('click', this._close.bind(this));
      });

      document.addEventListener('click', (event) => {
        if (!this.DOM.container.contains(event.target)) {
          this._close();
        }
      });

      return;
    }

    this.DOM.container.addEventListener('mouseenter', this._open.bind(this));
    this.DOM.container.addEventListener('mouseleave', this._closeWithDelay.bind(this));
    this.DOM.container.addEventListener('focusin', this._open.bind(this));
    this.DOM.container.addEventListener('focusout', (event) => {
      if (!this.DOM.container.contains(event.relatedTarget)) {
        this._closeWithDelay();
      }
    });
  }
}

class DawnHero {
  constructor() {
    this.scene = document.getElementById('hero-scene');
    this.canvas = document.getElementById('hero-sky');
    this.overlay = document.getElementById('hero-overlay');

    if (!this.scene || !this.canvas || !this.overlay) {
      return;
    }

    this.ctx = this.canvas.getContext('2d');
    this.duration = 2600;
    this.starCount = 90;
    this.stars = [];
    this._boundAnimate = this._animate.bind(this);
    this._boundResize = this._resize.bind(this);

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.canvas.style.opacity = '0';
      this.overlay.style.opacity = '0';
      return;
    }

    this._resize();
    window.addEventListener('resize', this._boundResize);
    this._start();
  }

  _easeInOut(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  _lerp(a, b, t) {
    return a + (b - a) * t;
  }

  _resize() {
    this.canvas.width = this.scene.clientWidth;
    this.canvas.height = this.scene.clientHeight;
    this._createStars();
    this._drawNightSky();
  }

  _createStars() {
    const w = this.canvas.width;
    const h = this.canvas.height;

    this.stars = Array.from({ length: this.starCount }, () => ({
      x: Math.random() * w,
      y: Math.random() * h * 0.72,
      r: Math.random() * 1.6 + 0.4,
      a: Math.random() * 0.65 + 0.25
    }));
  }

  _drawNightSky() {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const grad = this.ctx.createLinearGradient(0, 0, 0, h);

    grad.addColorStop(0, '#030712');
    grad.addColorStop(0.5, '#08162d');
    grad.addColorStop(1, '#122744');

    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, w, h);

    this.stars.forEach((star) => {
      this.ctx.beginPath();
      this.ctx.fillStyle = `rgba(255,255,245,${star.a})`;
      this.ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }

  _start() {
    this.scene.classList.add('is-animating');
    this.canvas.style.opacity = '1';
    this.overlay.style.opacity = '0.5';
    this.startTime = performance.now();
    requestAnimationFrame(this._boundAnimate);
  }

  _animate(now) {
    const elapsed = now - this.startTime;
    const progress = Math.min(elapsed / this.duration, 1);
    const eased = this._easeInOut(progress);
    this.canvas.style.opacity = `${this._lerp(1, 0, eased)}`;
    this.overlay.style.opacity = `${this._lerp(0.5, 0, eased)}`;

    if (progress < 1) {
      requestAnimationFrame(this._boundAnimate);
      return;
    }

    this.scene.classList.remove('is-animating');
    this.canvas.style.opacity = '0';
    this.overlay.style.opacity = '0';
  }
}

class HeaderVisibility {
  constructor() {
    this.header = document.querySelector('.l-header');
    this.hero = document.getElementById('hero-scene');
    if (!this.header) {
      return;
    }

    this.threshold = 100;
    this.toggleDistance = 100;
    this.lastY = window.scrollY;
    this.anchorY = window.scrollY;
    this.ticking = false;
    this._boundOnScroll = this._onScroll.bind(this);
    this._boundUpdate = this._update.bind(this);

    window.addEventListener('scroll', this._boundOnScroll, { passive: true });
    this._update();
  }

  _onScroll() {
    if (this.ticking) {
      return;
    }

    this.ticking = true;
    requestAnimationFrame(this._boundUpdate);
  }

  _update() {
    const currentY = window.scrollY;
    const isDown = currentY > this.lastY;
    const isInHero = this.hero ? this.hero.getBoundingClientRect().bottom > 0 : false;

    this.header.classList.toggle('is-on-hero', isInHero);

    if (!isInHero) {
      this.header.classList.remove('is-hidden');
      this.anchorY = currentY;
      this.lastY = currentY;
      this.ticking = false;
      return;
    }

    if (currentY <= this.threshold) {
      this.header.classList.remove('is-hidden');
      this.anchorY = currentY;
      this.lastY = currentY;
      this.ticking = false;
      return;
    }

    const distanceFromAnchor = Math.abs(currentY - this.anchorY);
    if (distanceFromAnchor < this.toggleDistance) {
      this.lastY = currentY;
      this.ticking = false;
      return;
    }

    if (!isDown) {
      this.header.classList.remove('is-hidden');
    } else {
      this.header.classList.add('is-hidden');
    }

    this.anchorY = currentY;
    this.lastY = currentY;
    this.ticking = false;
  }
}

new MobileMenu();
new DawnHero();
new HeaderVisibility();
new FooterPrompt();
