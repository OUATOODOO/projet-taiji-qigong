(function () {
    'use strict';

    const button = document.querySelector('.menu-toggle');
    const nav = document.querySelector('.main-nav');

    if (button && nav) {
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
    }

    const gallery = document.querySelector('.activity-gallery');
    const lightbox = document.querySelector('.lightbox');

    if (gallery && lightbox) {
        const galleryButtons = Array.from(gallery.querySelectorAll('[data-lightbox-index]'));
        const lightboxImage = lightbox.querySelector('.lightbox__image');
        const closeButton = lightbox.querySelector('.lightbox__close');
        const previousButton = lightbox.querySelector('.lightbox__previous');
        const nextButton = lightbox.querySelector('.lightbox__next');
        const focusableButtons = [closeButton, previousButton, nextButton];
        let currentIndex = 0;
        let lastFocusedButton = null;

        function showImage(index) {
            currentIndex = (index + galleryButtons.length) % galleryButtons.length;
            const thumbnail = galleryButtons[currentIndex].querySelector('img');
            lightboxImage.src = thumbnail.src;
            lightboxImage.alt = thumbnail.alt;
        }

        function openLightbox(index, trigger) {
            lastFocusedButton = trigger;
            showImage(index);
            lightbox.classList.add('is-open');
            lightbox.setAttribute('aria-hidden', 'false');
            document.body.classList.add('lightbox-open');
            closeButton.focus();
        }

        function closeLightbox() {
            lightbox.classList.remove('is-open');
            lightbox.setAttribute('aria-hidden', 'true');
            lightboxImage.src = '';
            document.body.classList.remove('lightbox-open');
            if (lastFocusedButton) lastFocusedButton.focus();
        }

        galleryButtons.forEach(function (galleryButton, index) {
            galleryButton.addEventListener('click', function () {
                openLightbox(index, galleryButton);
            });
        });

        previousButton.addEventListener('click', function () { showImage(currentIndex - 1); });
        nextButton.addEventListener('click', function () { showImage(currentIndex + 1); });
        closeButton.addEventListener('click', closeLightbox);

        lightbox.addEventListener('click', function (event) {
            if (event.target === lightbox) closeLightbox();
        });

        document.addEventListener('keydown', function (event) {
            if (!lightbox.classList.contains('is-open')) return;

            if (event.key === 'Escape') closeLightbox();
            if (event.key === 'ArrowLeft') showImage(currentIndex - 1);
            if (event.key === 'ArrowRight') showImage(currentIndex + 1);

            if (event.key === 'Tab') {
                const focusedIndex = focusableButtons.indexOf(document.activeElement);
                if (event.shiftKey && focusedIndex <= 0) {
                    event.preventDefault();
                    focusableButtons[focusableButtons.length - 1].focus();
                } else if (!event.shiftKey && focusedIndex === focusableButtons.length - 1) {
                    event.preventDefault();
                    focusableButtons[0].focus();
                }
            }
        });
    }

    const form = document.querySelector('.registration form');

    if (!form) return;

    const captchaQuestion = form.querySelector('#captcha-question');
    const captchaInput = form.querySelector('[name="captcha"]');
    const captchaToken = form.querySelector('#captcha-token');
    const honeypot = form.querySelector('[name="website"]');
    const submitButton = form.querySelector('.form-submit');
    const status = form.querySelector('.form-status');
    const submitLabel = submitButton.textContent;
    let isSubmitting = false;

    async function generateCaptcha() {
        captchaToken.value = '';
        captchaInput.value = '';

        try {
            const response = await fetch('captcha.php', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                },
                cache: 'no-store'
            });

            if (!response.ok) {
                throw new Error('Échec du chargement du captcha : HTTP ' + response.status);
            }

            const data = await response.json();

            if (!data || data.success !== true || typeof data.question !== 'string' || !data.question.trim()
                || typeof data.token !== 'string' || !data.token.trim()) {
                throw new Error('Réponse invalide reçue depuis captcha.php.');
            }

            captchaQuestion.textContent = data.question;
            captchaToken.value = data.token;
        } catch (error) {
            console.error(error);
            showStatus('Impossible de charger la question anti-spam. Veuillez réessayer.', 'error');
        }
    }

    function showStatus(message, state) {
        status.textContent = message;
        status.className = 'form-status form-status--' + state;
    }

    generateCaptcha();

    form.addEventListener('submit', async function (event) {
        event.preventDefault();

        if (isSubmitting) return;

        if (honeypot.value.trim() !== '') {
            showStatus('L’envoi n’a pas pu être validé.', 'error');
            return;
        }

        if (!captchaToken.value.trim()) {
            showStatus('Impossible de charger la question anti-spam. Veuillez réessayer.', 'error');
            return;
        }

        isSubmitting = true;
        submitButton.hidden = true;
        submitButton.disabled = true;
        submitButton.textContent = 'Envoi en cours...';
        showStatus('Envoi en cours...', 'pending');

        const data = Object.fromEntries(new FormData(form).entries());

        try {
            const response = await fetch(form.action, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            let result;

            try {
                result = await response.json();
            } catch (error) {
                console.error(error);
                showStatus('Une erreur est survenue lors de l’envoi. Veuillez réessayer.', 'error');
                return;
            }

            if (!response.ok || !result || !result.success) {
                const message = result && result.success === false && typeof result.message === 'string' && result.message.trim()
                    ? result.message
                    : 'Une erreur est survenue lors de l’envoi. Veuillez réessayer.';
                showStatus(message, 'error');

                if (result && (result.code === 'INVALID_CAPTCHA' || result.code === 'EXPIRED_CAPTCHA')) {
                    await generateCaptcha();
                    captchaInput.focus();
                }

                return;
            }

            showStatus(result.message || 'Votre demande a bien été envoyée.', 'success');
            form.reset();
            await generateCaptcha();
        } catch (error) {
            console.error(error);
            showStatus('Une erreur est survenue lors de l’envoi. Veuillez réessayer.', 'error');
        } finally {
            isSubmitting = false;
            submitButton.hidden = false;
            submitButton.disabled = false;
            submitButton.textContent = submitLabel;
        }
    });
}());
