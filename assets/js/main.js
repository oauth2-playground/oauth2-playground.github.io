class OAuth2Playground {
    constructor() {
        this.init();
    }

    init() {
        CallbackService.handleCallbackCode();

        this.bindEvents();
        UIService.fillFieldsFromCache();
        UIService.changeAuthenticationFields($("#grantType").val());
        UIService.updateVisualization();
    }

    bindEvents() {
        $(document).on('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') // ctrl/cmd + s
                UIService.evalIfContentCanBeSavedAndSaveIt(e)
        });

        $('#grantType').on('change', (e) => { UIService.changeAuthenticationFields(e.target.value); });

        $('#codeVerifier').on('keypress', (e) => { UIService.generateAndSetPKCE(false); });
        $('#regenerateCodeVerifier').on('click', (e) => { UIService.generateAndSetPKCE(true); });

        $('#discoverBtn').on('click', () => { OAuth2Service.discover(); });
        $('#startAuthBtn').on('click', () => { OAuth2Service.startAuthorization(); });
        $('#exchangeCodeBtn').on('click', () => { OAuth2Service.exchangeCode(); });
        $('#getUserInfoBtn').on('click', () => { OAuth2Service.getUserInfo(); });
        $('#refreshTokenBtn').on('click', () => { OAuth2Service.refreshToken(); });
        $('#resetBtn').on('click', () => { OAuth2Service.reset(); });
        // $('#authUrlDisplay').on('click', (e) => { UIService.handleAuthUrlClick(e); });

        $('#modalCancel').on('click', () => { UIService.hideModal(); });

        $(document).on('click', (e) => {
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

$(document).ready(function() {
    new OAuth2Playground();
});
