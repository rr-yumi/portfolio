'use strict';

class MobileMenu {
  constructor() {
    this.DOM = {};
    this.DOM.container = document.querySelector('#global-container');
    this.DOM.btn = this.DOM.container?.querySelector('.p-header__toggle');
    this.DOM.links = this.DOM.container?.querySelectorAll('.p-header__nav a');
    this.desktopBreakpoint = 959.96;

    if (!this.DOM.btn || !this.DOM.container || !this.DOM.links) {
      return;
    }

    this._addEvent();
  }

  _setExpandedState(isOpen) {
    this.DOM.container.classList.toggle('is-open', isOpen);
    this.DOM.btn.setAttribute('aria-expanded', String(isOpen));
    this.DOM.btn.setAttribute('aria-label', isOpen ? 'メニューを閉じる' : 'メニューを開く');
  }

  _toggle() {
    const isOpen = this.DOM.container.classList.contains('is-open');
    this._setExpandedState(!isOpen);
  }

  _close() {
    this._setExpandedState(false);
  }

  _addEvent() {
    this.DOM.btn.addEventListener('click', this._toggle.bind(this));

    this.DOM.links.forEach((link) => {
      link.addEventListener('click', this._close.bind(this));
    });

    document.addEventListener('click', (event) => {
      if (!this.DOM.container.contains(event.target)) {
        this._close();
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > this.desktopBreakpoint) {
        this._close();
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
