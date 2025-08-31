class OAuth2Playground {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadStoredData();
        UIService.updateDynamicFields();
        UIService.updateVisualization();
    }

    bindEvents() {


        document.getElementById('grantType').addEventListener('change', (e) => {
            UIService.updateDynamicFields();
            UIService.updateVisualization();
            UIService.clearVisualization();
        });
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