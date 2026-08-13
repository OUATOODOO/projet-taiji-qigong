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

    const form = document.querySelector('.registration form');

    if (!form) return;

    const captchaQuestion = form.querySelector('#captcha-question');
    const captchaInput = form.querySelector('[name="captcha"]');
    const honeypot = form.querySelector('[name="website"]');
    const submitButton = form.querySelector('.form-submit');
    const status = form.querySelector('.form-status');
    const submitLabel = submitButton.textContent;
    let captchaAnswer;

    function generateCaptcha() {
        const firstNumber = Math.floor(Math.random() * 9) + 1;
        const secondNumber = Math.floor(Math.random() * 9) + 1;
        captchaAnswer = firstNumber + secondNumber;
        captchaQuestion.textContent = 'Combien font ' + firstNumber + ' + ' + secondNumber + ' ?';
        captchaInput.value = '';
    }

    function showStatus(message, state) {
        status.textContent = message;
        status.className = 'form-status form-status--' + state;
    }

    generateCaptcha();

    form.addEventListener('submit', async function (event) {
        event.preventDefault();

        if (honeypot.value.trim() !== '') {
            showStatus('L’envoi n’a pas pu être validé.', 'error');
            return;
        }

        if (Number(captchaInput.value) !== captchaAnswer) {
            showStatus('La réponse à la question anti-spam est incorrecte.', 'error');
            captchaInput.focus();
            return;
        }

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
                return;
            }

            showStatus(result.message || 'Votre demande a bien été envoyée.', 'success');
            form.reset();
            generateCaptcha();
        } catch (error) {
            console.error(error);
            showStatus('Une erreur est survenue lors de l’envoi. Veuillez réessayer.', 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = submitLabel;
        }
    });
}());
