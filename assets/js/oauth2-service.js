const OAuth2Service = {
    tokens: {},

    async discover() {
        const url = document.getElementById('discoveryUrl').value;
        if (!url) {
            UIService.showNotification('Please enter a discovery URL', 'warning');
            return;
        }

        if (StorageService.checkDiscoveryChange(url)) {
            UIService.showModal('Changing discovery URL will clear all saved data. Continue?', () => {
                this.performDiscovery(url);
            });
        } else {
            this.performDiscovery(url);
        }
    },

    async performDiscovery(url) {
        UIService.showLoading('discoverBtn');

        try {
            await Utils.delay(1000);

            const mockResponse = {
                authorization_endpoint: 'https://auth.example.com/oauth/authorize',
                token_endpoint: 'https://auth.example.com/oauth/token',
                userinfo_endpoint: 'https://auth.example.com/userinfo',
                revocation_endpoint: 'https://auth.example.com/oauth/revoke',
                issuer: 'https://auth.example.com',
                scopes_supported: ['openid', 'profile', 'email'],
                response_types_supported: ['code', 'token', 'id_token'],
                grant_types_supported: ['authorization_code', 'implicit', 'refresh_token', 'client_credentials'],
                code_challenge_methods_supported: ['S256', 'plain']
            };

            const authUrlInput = document.getElementById('authorizationUrl');
            const tokenUrlInput = document.getElementById('tokenUrl');

            if (authUrlInput) authUrlInput.value = mockResponse.authorization_endpoint;
            if (tokenUrlInput) tokenUrlInput.value = mockResponse.token_endpoint;

            const baseUrl = Utils.extractDomainFromUrl(url);
            document.getElementById('baseUrl').value = baseUrl;

            StorageService.saveFormData();
            UIService.updateVisualization();
            UIService.showNotification('Discovery completed successfully!', 'success');
        } catch (error) {
            UIService.showNotification('Discovery failed: ' + error.message, 'error');
        } finally {
            UIService.hideLoading('discoverBtn');
        }
    },

    async startAuthorization() {
        const grantType = document.getElementById('grantType').value;
        const clientId = document.getElementById('clientId').value;

        if (!clientId) {
            UIService.showNotification('Client ID is required', 'warning');
            return;
        }

        UIService.showLoading('startAuthBtn');

        try {
            await Utils.delay(500);

            if (grantType === 'client_credentials' || grantType === 'password') {
                await this.getTokenDirectly();
            } else if (grantType === 'refresh_token') {
                await this.refreshToken();
            } else {
                this.generateAuthorizationUrl();
            }
        } catch (error) {
            UIService.showNotification('Authorization failed: ' + error.message, 'error');
        } finally {
            UIService.hideLoading('startAuthBtn');
        }
    },

    generateAuthorizationUrl() {
        const grantType = document.getElementById('grantType').value;
        const clientId = document.getElementById('clientId').value;
        const authUrl = document.getElementById('authorizationUrl')?.value;
        const scope = document.getElementById('scope')?.value;
        const redirectUri = document.getElementById('redirectUri')?.value;

        if (!authUrl || !redirectUri) {
            UIService.showNotification('Authorization URL and Redirect URI are required', 'warning');
            return;
        }

        const params = new URLSearchParams({
            response_type: grantType === 'implicit' ? 'token' : 'code',
            client_id: clientId,
            redirect_uri: redirectUri,
            scope: scope || 'openid profile email',
            state: Utils.generateRandomString(32)
        });

        if (grantType === 'authorization_code_pkce') {
            const codeChallenge = document.getElementById('codeChallenge')?.value;
            const codeChallengeMethod = document.getElementById('codeChallengeMethod')?.value;
            if (codeChallenge && codeChallengeMethod) {
                params.append('code_challenge', codeChallenge);
                params.append('code_challenge_method', codeChallengeMethod);
            }
        }

        const fullUrl = `${authUrl}?${params.toString()}`;

        document.getElementById('authUrlDisplay').value = fullUrl;
        UIService.showSection('authUrlSection');

        if (grantType !== 'implicit') {
            UIService.showSection('authCodeSection');
        }

        UIService.showNotification('Authorization URL generated! Copy and visit the URL to get authorization code.', 'success');
    },

    async getTokenDirectly() {
        const grantType = document.getElementById('grantType').value;
        const scope = document.getElementById('scope')?.value;

        await Utils.delay(1000);

        const mockToken = {
            access_token: Utils.generateMockJWT(),
            token_type: 'Bearer',
            expires_in: 3600,
            scope: scope || 'api:read api:write'
        };

        if (grantType === 'password') {
            mockToken.refresh_token = Utils.generateMockJWT();
            mockToken.id_token = Utils.generateMockJWT();
        }

        this.tokens = mockToken;
        this.displayTokenResponse(mockToken);
        UIService.showNotification('Token obtained successfully!', 'success');

        UIService.showButton('getUserInfoBtn');
        if (mockToken.refresh_token) {
            UIService.showButton('refreshTokenBtn');
        }
    },

    async exchangeCode() {
        const authCode = document.getElementById('authCodeInput').value;
        if (!authCode) {
            UIService.showNotification('Please enter the authorization code', 'warning');
            return;
        }

        UIService.showLoading('exchangeCodeBtn');

        try {
            await Utils.delay(1000);

            const scope = document.getElementById('scope')?.value;
            const mockToken = {
                access_token: Utils.generateMockJWT(),
                token_type: 'Bearer',
                expires_in: 3600,
                refresh_token: Utils.generateMockJWT(),
                id_token: Utils.generateMockJWT(),
                scope: scope || 'openid profile email'
            };

            this.tokens = mockToken;
            this.displayTokenResponse(mockToken);
            UIService.showNotification('Code exchanged successfully!', 'success');

            UIService.showButton('getUserInfoBtn');
            UIService.showButton('refreshTokenBtn');
        } catch (error) {
            UIService.showNotification('Code exchange failed: ' + error.message, 'error');
        } finally {
            UIService.hideLoading('exchangeCodeBtn');
        }
    },

    async getUserInfo() {
        if (!this.tokens.access_token) {
            UIService.showNotification('No access token available', 'warning');
            return;
        }

        UIService.showLoading('getUserInfoBtn');

        try {
            await Utils.delay(800);

            const mockUserInfo = {
                sub: '1234567890',
                name: 'John Doe',
                given_name: 'John',
                family_name: 'Doe',
                email: 'john.doe@example.com',
                email_verified: true,
                picture: 'https://example.com/avatar.jpg',
                updated_at: Math.floor(Date.now() / 1000)
            };

            UIService.displayJSON('userInfoDisplay', mockUserInfo);
            UIService.showSection('userInfoSection');
            UIService.showNotification('UserInfo retrieved successfully!', 'success');
        } catch (error) {
            UIService.showNotification('UserInfo request failed: ' + error.message, 'error');
        } finally {
            UIService.hideLoading('getUserInfoBtn');
        }
    },

    async refreshToken() {
        const refreshToken = this.tokens.refresh_token || document.getElementById('refreshToken')?.value;
        if (!refreshToken) {
            UIService.showNotification('No refresh token available', 'warning');
            return;
        }

        UIService.showLoading('refreshTokenBtn');

        try {
            await Utils.delay(1000);

            const mockToken = {
                access_token: Utils.generateMockJWT(),
                token_type: 'Bearer',
                expires_in: 3600,
                refresh_token: Utils.generateMockJWT(),
                scope: this.tokens.scope || 'openid profile email'
            };

            this.tokens = mockToken;
            this.displayTokenResponse(mockToken);
            UIService.showNotification('Token refreshed successfully!', 'success');
        } catch (error) {
            UIService.showNotification('Token refresh failed: ' + error.message, 'error');
        } finally {
            UIService.hideLoading('refreshTokenBtn');
        }
    },

    displayTokenResponse(token) {
        UIService.displayJSON('tokenDisplay', token);
        UIService.showSection('tokenSection');
    },

    reset() {
        UIService.showModal('Are you sure you want to reset all data?', () => {
            StorageService.clear();
            location.reload();
        });
    }
};