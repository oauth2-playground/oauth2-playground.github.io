const CallbackService = {
    handleCallbackCode() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');

        if (error) {
            const errorMsg = `Error: ${errorDescription || 'unknown, occurred during authorization'}`;
            UIService.showNotification("error", errorMsg);
            return;
        }

        if (code) {
            UIService.showNotification("success", `Authorization code received: ${code}`);
            document.getElementById('authCodeInput').value = code;
            if (state && OAuth2Service.isValidTheState(state)) {
                // document.getElementById('authState').value = state;
                // StorageService.saveInStorage('authState', state);

                UIService.showButton('exchangeAuthCodeBtn');
                // document.getElementById('exchangeAuthCodeBtn').disabled = true;
            } else {
                const cleanUrl = window.location.origin + window.location.pathname;
                window.history.replaceState({}, document.title, cleanUrl);

                UIService.showNotification("error", `The received state isn't valid`);

                document.getElementById('authCodeInput').value = '';
                // document.getElementById('authState').value = '';

                return;
            }

            UIService.updateVisualization();

        }
    }
}
