(function () {
    'use strict';

    const button = document.querySelector('.menu-toggle');
    const nav = document.querySelector('.main-nav');

    if (!button || !nav) return;

    button.addEventListener('click', function () {
        const isOpen = button.getAttribute('aria-expanded') === 'true';
        button.setAttribute('aria-expanded', String(!isOpen));
        nav.classList.toggle('is-open', !isOpen);
    });

    nav.addEventListener('click', function (event) {
        if (event.target.closest('a')) {
            button.setAttribute('aria-expanded', 'false');
            nav.classList.remove('is-open');
        }
    });
}());
