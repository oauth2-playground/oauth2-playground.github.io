const OAuth2Service = {
    tokens: {},

    async discover() {
        const url = $('#discoveryUrl').val();
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
            const response = await fetch(url);

            if (!response.ok) {
                UIService.showNotification('Failed to fetch discovery document: ' + response.statusText, 'error');
                UIService.hideLoading('discoverBtn');
                return;
            }
            const openidConfig = await response.json();
            // ejwmdZvXol2Uhlawky9s7fXxfVwa
            const OAuth2Provider = {
                tokenEndpoint: openidConfig.token_endpoint,
                authorizationEndpoint: openidConfig.authorization_endpoint,
                userInfoEndpoint: openidConfig.userinfo_endpoint,
                issuer: openidConfig.issuer,
                grantTypes: openidConfig.grant_types_supported || [],
                responseTypes: openidConfig.response_types_supported || [],
                scopes: openidConfig.scopes_supported || [],
                refreshTokenUrl: openidConfig.token_endpoint,
                logoutEndpoint: openidConfig.end_session_endpoint,
                revocationUrl: openidConfig.revocation_endpoint,
                codeChallengeMethods: openidConfig.code_challenge_methods_supported || []
            };

            $('#tokenUrl').val(OAuth2Provider.tokenEndpoint);
            $('#authorizationUrl').val(OAuth2Provider.authorizationEndpoint);
            $('#refreshTokenUrl').val(OAuth2Provider.refreshTokenUrl);
            $('#logoutUrl').val(OAuth2Provider.logoutEndpoint);
            $('#revocationUrl').val(OAuth2Provider.revocationUrl);

            const $grantTypeSelectOptions = $('#grantType').children();

            $grantTypeSelectOptions.slice(1).addClass("hidden");

            $grantTypeSelectOptions.each(function () {
                const $option = $(this);
                if ($option.val() === "none") return;

                const isSupported = OAuth2Provider.grantTypes.some(grantType =>
                    $option.val().includes(grantType) || grantType.includes($option.val())
                );

                if (isSupported) {
                    $option.removeClass("hidden");
                }
            });

            const $codeChallengeMethodOptions = $('#codeChallengeMethod').children();

            $codeChallengeMethodOptions.addClass("hidden");

            $codeChallengeMethodOptions.each(function () {
                const $option = $(this);
                const isSupported = OAuth2Provider.codeChallengeMethods.some(method =>
                    $option.val() === method
                );

                if (isSupported) {
                    $option.removeClass("hidden");
                }
            });

            if (OAuth2Provider.codeChallengeMethods.length === 0) {
                $codeChallengeMethodOptions.filter('[value="S256"]').removeClass("hidden");
            }

            UIService.updateVisualization();
            UIService.showNotification('Discovery completed', 'success');

        } catch (error) {
            UIService.showNotification('Discovery failed', 'error');
        } finally {
            UIService.hideLoading('discoverBtn');
        }
    },

    async startAuthorization() {
        const grantType = $('#grantType').val();
        const clientId = $('#clientId').val();

        if (!clientId) {
            UIService.showNotification('Client ID is required', 'warning');
            return;
        }

        UIService.showLoading('startAuthBtn');

        try {
            // await Utils.delay(500);

            if (grantType === 'client_credentials' || grantType === 'password') {
                await this.getTokenDirectly();
            } else if (grantType === 'refresh_token') {
                await this.refreshToken();
            } else {
                this.generateAuthorizationUrl();
                $('#authUrlDisplay').off('click').on('click', (e) => UIService.copyAuthorizationURLOnClick(e));
                $('#getAuthCodeBtn').off('click').on('click', (e) => this.getAuthorizationCode());


            }
        } catch (error) {
            UIService.showNotification('Authorization failed: ' + error.message, 'error');
        } finally {
            UIService.hideLoading('startAuthBtn');
        }
    },

    generateAuthorizationUrl() {
        const grantType = $('#grantType').val();
        const clientId = $('#clientId').val();
        const authUrl = $('#authorizationUrl').val();
        const scope = $('#scope').val();
        const redirectUri = $('#redirectUri').val();
        const state = this.generateState();

        if (!authUrl || !redirectUri) {
            UIService.showNotification('Authorization URL and Redirect URI are required', 'warning');
            return;
        }

        const params = new URLSearchParams({
            response_type: grantType === 'implicit' ? 'token' : 'code',
            client_id: clientId,
            redirect_uri: redirectUri,
            scope: scope || 'openid profile email',
            state: state
        });

        if (grantType === 'authorization_code_pkce') {
            const codeVerifier = $('#codeVerifier').val();
            const codeChallenge = $('#codeChallenge').val();
            const codeChallengeMethod = $('#codeChallengeMethod').val();
            if (codeChallenge && codeChallengeMethod) {
                params.append('code_challenge', codeChallenge);
                params.append('code_challenge_method', codeChallengeMethod);

                // sessionStorage.setItem('pkce_values', codeVerifier);
                // StorageService.saveInStorage('pkce_values', `${codeVerifier}|${codeChallenge}|${codeChallengeMethod}`, sessionStorage);
            }
        }

        $('#authUrlDisplay').val(
            `${authUrl}?${params.toString()}`);
        UIService.showSection('authUrlSection');

        if (grantType !== 'implicit') {
            UIService.showSection('authCodeSection');
        }

        UIService.showNotification('Authorization URL generated. Copy and visit the URL to get authorization code.', 'info');
    },

    async getTokenDirectly() {
        const grantType = $('#grantType').val();
        const scope = $('#scope').val();

        const isClientCredentials = grantType === 'client_credentials';

        const payload = {
            grant_type: isClientCredentials ? 'client_credentials' : 'password',
            scope: scope
        };

        if (!isClientCredentials) {
            payload.username = $('#username').val();
            payload.password = $('#password').val();
        }

        $.ajax({
            url: $('#tokenUrl').val(),
            method: 'POST',
            data: $.param(payload),
            contentType: 'application/x-www-form-urlencoded',
            headers: {
                'Authorization': 'Basic ' + btoa(`${$('#clientId').val()}:${$('#clientSecret').val()}`)
            },
            success: (response) => {
                UIService.showNotification('Code Exchanged Successfully', 'success');

                sessionStorage.setItem('token_response', JSON.stringify(response));
                window.location.href = 'results.html';
            },
            error: function(response) {
                const errorMsg = response.responseJSON
                    ? JSON.stringify(response.responseJSON)
                    : response.responseText || 'Unknown error';
                UIService.showNotification('Token request failed: ' + errorMsg, 'error');
            },
        });
    },

    async exchangeCode() {
        const authCode = $('#authCodeInput').val();
        if (!authCode) {
            UIService.showNotification('Please enter the authorization code', 'warning');
            return;
        }

        UIService.showLoading('exchangeCodeBtn');

        // const pkce = sessionStorage.getItem('verifier_code')

        const codeVerifier =sessionStorage.getItem('flow_code_verifier');
        console.log(codeVerifier)


        console.log(codeVerifier);
        if (!codeVerifier) {
            UIService.showNotification('PKCE code verifier not found in session storage', 'error');
            UIService.hideLoading('exchangeCodeBtn');
            return;

        }

        $.ajax({
            url: $('#tokenUrl').val(),
            method: 'POST',
            data: $.param({
                grant_type: 'authorization_code',
                code: authCode,
                redirect_uri: $('#redirectUri').val(),
                code_verifier: codeVerifier,
                client_id: $('#clientId').val()
            }),
            contentType: 'application/x-www-form-urlencoded',
            success: (response) => {
                console.log(response);
                // console.log(response.json.access_token);
                this.displayTokenResponse(response.access_token);
                UIService.showNotification('Code exchanged successfully!', 'success');
                UIService.showButton('getUserInfoBtn');
                UIService.showButton('refreshTokenBtn');
            },
            error: function(response) {
                const errorMsg = response.responseJSON
                    ? JSON.stringify(response.responseJSON)
                    : response.responseText || 'Unknown error';
                UIService.showNotification('Code exchange failed: ' + errorMsg, 'error');
            },
        });
        UIService.hideLoading('exchangeCodeBtn');

    },



    decodeToken(jwt) {

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

    async logout() {
        const oauth2PlaygroundData = $.parseJSON(StorageService.getFromStorage() || '{}');
        const tokensRaw = sessionStorage.getItem("token_response");

        if (!tokensRaw) {
            console.warn("No token found in sessionStorage, doing local logout only");
            sessionStorage.clear();
            window.location.href = "index.html";
            return;
        }

        const tokens = JSON.parse(tokensRaw);

        if (!oauth2PlaygroundData.logoutUrl) {
            console.warn("No logout URL configured, doing local logout only");
            sessionStorage.clear();
            window.location.href = "index.html";
            return;
        }

        const logoutParams = new URLSearchParams();

        const postLogoutRedirectUri = `${window.location.origin}${window.location.pathname.replace(/[^/]*$/, '')}cb.html`;
        logoutParams.append('post_logout_redirect_uri', postLogoutRedirectUri);

        if (tokens.id_token) {
            logoutParams.append('id_token_hint', tokens.id_token);
        }

        logoutParams.append('state', this.generateState(true));

        sessionStorage.clear();

        window.location.href = `${oauth2PlaygroundData.logoutUrl}?${logoutParams.toString()}`;
    },

    async revokeToken(token, tokenTypeHint = 'access_token') {
        const oauth2PlaygroundData = $.parseJSON(StorageService.getFromStorage() || '{}');

        return new Promise((resolve, reject) => {
            $.ajax({
                url: oauth2PlaygroundData.revocationUrl,
                method: 'POST',
                contentType: 'application/x-www-form-urlencoded',
                headers: {
                    'Authorization': 'Basic ' + btoa(`${oauth2PlaygroundData.clientId}:${oauth2PlaygroundData.clientSecret}`),
                },
                data: $.param({
                    token: token,
                    token_type_hint: tokenTypeHint
                }),
                success: () => {
                    resolve({ ok: true });
                },
                error: function (xhr) {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve({ ok: true });
                        return;
                    }
                    console.error('Token revocation error:', xhr);
                    const errorMsg = xhr.responseJSON
                        ? JSON.stringify(xhr.responseJSON)
                        : xhr.responseText || `Status: ${xhr.status} - ${xhr.statusText}`;
                    reject(new Error(errorMsg));
                }
            });
        });
    },

    async refreshToken(token, isPkce = false) {
        const oauth2PlaygroundData = $.parseJSON(StorageService.getFromStorage() || '{}');

        return new Promise((resolve, reject) => {
            $.ajax({
                url: oauth2PlaygroundData.refreshTokenUrl,
                method: 'POST',
                contentType: 'application/x-www-form-urlencoded',
                headers: !isPkce ? {
                    'Authorization': 'Basic ' + btoa(oauth2PlaygroundData.clientId + ':' + oauth2PlaygroundData.clientSecret)
                } : {},
                data: isPkce ? $.param({
                    grant_type: 'refresh_token',
                    refresh_token: token,
                    client_id: oauth2PlaygroundData.clientId,
                }) : $.param({
                    grant_type: 'refresh_token',
                    refresh_token: token
                }),
                success: (response) => {
                    console.log(response);
                    resolve(response);

                },
                error: function(xhr, status, error) {
                    const errorMsg = xhr.responseJSON
                        ? JSON.stringify(xhr.responseJSON)
                        : xhr.responseText || 'Unknown error';
                    reject(new Error(errorMsg));
                }
            });
        });
    },

    getAuthorizationCode() {
        // $('#copyAuthUrlBtn').on('click', (e) => {});

        const authUrl = $('#authUrlDisplay').val();
        if (!authUrl) {
            UIService.showNotification('Authorization URL is not generated yet', 'warning');
            return;
        }

        sessionStorage.setItem('flow_code_verifier', $('#codeVerifier').val());
        sessionStorage.setItem('flow_grant_type', $('#grantType').val());
        sessionStorage.setItem('flow_client_secret', $('#clientSecret').val());
        sessionStorage.setItem('flow_client_id', $('#clientId').val());
        sessionStorage.setItem('flow_redirect_uri', $('#redirectUri').val());
        sessionStorage.setItem('flow_token_url', $('#tokenUrl').val());
        // sessionStorage.setItem('verifier_code', $('#codeVerifier').val());
        // StorageService.saveInStorage('verifier_code', $('#codeVerifier').val(), sessionStorage);

        window.location.href = authUrl;
    },

    displayTokenResponse(token) {
        UIService.displayJSON('tokenDisplay', token);
        UIService.showSection('tokenSection');
    },

    generateState(isLogoutState = false) {
        let state = Utils.generateRandomString(32);

        if (isLogoutState) {
            state = state.slice(0, -8) + 'logoutcb';
        }

        StorageService.saveInStorage("state", state, sessionStorage);
        // console.log(`state generado: ${state}`);
        return state;
    },

    isValidTheState(returnedState) {
        const savedState = StorageService.getFromStorage("state", sessionStorage);
        const savedStateStr = typeof savedState === "string" ? savedState : JSON.stringify(savedState);
        // console.log(`state guardado: ${savedState}`);
        return savedStateStr === returnedState;
    },

    reset() {
        UIService.showModal('Are you sure you want to reset all data?', () => {
            StorageService.clear();
            sessionStorage.clear();
            localStorage.clear();
            window.location.href = window.location.origin + window.location.pathname;
        });
    }
};