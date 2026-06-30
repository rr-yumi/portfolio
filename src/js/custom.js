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

class AnchorScroller {
  constructor() {
    this.header = document.querySelector('.l-header');
    this.extraOffset = 24;

    if (!this.header) {
      return;
    }

    this._boundUpdateOffset = this._updateOffset.bind(this);
    this._boundHashChange = this._handleHashChange.bind(this);
    this._boundLinkClick = this._handleLinkClick.bind(this);

    this._updateOffset();
    this._bindEvents();
    this._restoreHashPosition();
  }

  _bindEvents() {
    window.addEventListener('resize', this._boundUpdateOffset, { passive: true });
    window.addEventListener('load', this._boundHashChange);
    window.addEventListener('hashchange', this._boundHashChange);

    document.querySelectorAll('a[href*="#"]').forEach((link) => {
      link.addEventListener('click', this._boundLinkClick);
    });
  }

  _updateOffset() {
    const headerHeight = this.header.getBoundingClientRect().height;
    document.documentElement.style.setProperty('--anchor-offset', `${headerHeight}px`);
  }

  _getTargetFromHash(hash) {
    if (!hash || hash === '#') {
      return null;
    }

    const id = decodeURIComponent(hash.slice(1));
    return document.getElementById(id);
  }

  _scrollToTarget(target, behavior = 'smooth') {
    if (!target) {
      return;
    }

    this._updateOffset();
    const headerHeight = this.header.getBoundingClientRect().height;
    const top = Math.max(
      target.getBoundingClientRect().top + window.scrollY - headerHeight - this.extraOffset,
      0
    );

    window.scrollTo({ top, behavior });
  }

  _handleHashChange() {
    const target = this._getTargetFromHash(window.location.hash);
    if (!target) {
      return;
    }

    this._scrollToTarget(target, 'auto');
  }

  _restoreHashPosition() {
    const target = this._getTargetFromHash(window.location.hash);
    if (!target) {
      return;
    }

    requestAnimationFrame(() => {
      this._scrollToTarget(target, 'auto');
      window.setTimeout(() => this._scrollToTarget(target, 'auto'), 250);
    });
  }

  _handleLinkClick(event) {
    const link = event.currentTarget;
    if (!(link instanceof HTMLAnchorElement)) {
      return;
    }

    const url = new URL(link.href, window.location.href);
    const isSamePage =
      url.origin === window.location.origin &&
      url.pathname === window.location.pathname &&
      url.hash;

    if (!isSamePage) {
      return;
    }

    const target = this._getTargetFromHash(url.hash);
    if (!target) {
      return;
    }

    event.preventDefault();
    history.pushState(null, '', url.hash);
    this._scrollToTarget(target);
  }
}

new MobileMenu();
new AnchorScroller();
