const CallbackService = {
    handleCallbackCode() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');

        if (error) {
            const errorMsg = `Error: ${errorDescription || 'unknown, occurred during authorization'}`;
            UIService.showNotification(errorMsg, "error");
            return;
        }

        if (code) {
            const $authCodeInput = $('#authCodeInput');

            UIService.showNotification(`Authorization code received: ${code}`, "success");

            if (state && OAuth2Service.isValidTheState(state)) {
                UIService.showButton('exchangeAuthCodeBtn');
                $authCodeInput.val(code);

            } else {
                const cleanUrl = window.location.origin + window.location.pathname;
                window.history.replaceState({}, document.title, cleanUrl);

                UIService.showNotification(`The received state isn't valid`, "error");

                $authCodeInput.val('');

                return;
            }

            UIService.updateVisualization();
        }
        window.location.href='index.html';
    }
}
