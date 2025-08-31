class OAuth2Playground {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
        UIService.fillFieldsFromCache();
        UIService.changeAuthenticationFields(document.getElementById("grantType").value);
        UIService.updateVisualization();
    }

    bindEvents() {
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();

                StorageService.saveFormData();
                UIService.showNotification('Configuration saved!', 'success');
            }
        });

        document.getElementById('syncUrls').addEventListener('click', (e) => UIService.syncAllUrls());

        document.getElementById('grantType').addEventListener('change', (e) => UIService.changeAuthenticationFields(e.target.value));
        document.getElementById('regenerateCodeVerifier').addEventListener('click', (e) => {UIService.generateAndSetPKCE(true)})

        document.getElementById('discoverBtn').addEventListener('click', () => OAuth2Service.discover());
        document.getElementById('startAuthBtn').addEventListener('click', () => OAuth2Service.startAuthorization());
        document.getElementById('exchangeCodeBtn').addEventListener('click', () => OAuth2Service.exchangeCode());
        document.getElementById('getUserInfoBtn').addEventListener('click', () => OAuth2Service.getUserInfo());
        document.getElementById('refreshTokenBtn').addEventListener('click', () => OAuth2Service.refreshToken());
        document.getElementById('resetBtn').addEventListener('click', () => OAuth2Service.reset());
        document.getElementById('copyAuthUrlBtn').addEventListener('click', () => UIService.copyAuthUrl());

        document.getElementById('modalCancel').addEventListener('click', () => UIService.hideModal());

        document.addEventListener('click', (e) => {
            if (e.target.id === 'confirmModal') {
                UIService.hideModal();
            }
        });

        UIService.bindFormEvents();
    }

    loadStoredData() {
        StorageService.loadFormData();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new OAuth2Playground();
});