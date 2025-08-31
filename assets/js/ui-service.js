const UIService = {
    fillFieldsFromCache() {
        const oauth2PlaygroundDataString = StorageService.getFromStorage();
        const oauth2PlaygroundData = oauth2PlaygroundDataString ? JSON.parse(oauth2PlaygroundDataString) : {};

        Array
            .from([
                'grantType', 'baseUrl', 'discoveryUrl',
                'tokenUrl', 'authorizationUrl', 'userinfoUrl', 'revocationUrl',
                'clientId', 'clientSecret', 'redirectUri', 'scope', 'refreshTokenUrl',
                'codeChallengeMethod'
            ]).forEach((field) => {
                if (oauth2PlaygroundData[field] !== undefined) {const element = document.getElementById(field);
                    if (element) {
                        element.value = oauth2PlaygroundData[field];
                    }
                }
            });
    },

    changeAuthenticationFields(selectedGrantType) {
        if (selectedGrantType !== 'none') {
            this.updateFieldsForGrantType(selectedGrantType);
        } else {
            const dynamicFields = document.getElementById('dynamicFields');
            Array.from(dynamicFields.querySelectorAll('div')).forEach(field => {
                if (field.id !== 'dynamicFields') {
                    field.classList.add('hidden');
                }
            });
        }
        this.updateVisualization();
        this.clearVisualization();
    },

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        const colors = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            warning: 'bg-yellow-500',
            info: 'bg-blue-500'
        };

        notification.className = `${colors[type]} text-white px-4 py-3 rounded-lg shadow-lg notification-enter`;
        notification.innerHTML = `
            <div class="flex items-center justify-between">
                <span>${message}</span>
                <button class="ml-4 text-white hover:text-gray-200" onclick="this.parentElement.parentElement.remove()">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                    </svg>
                </button>
            </div>
        `;

        document.getElementById('notifications').appendChild(notification);

        requestAnimationFrame(() => {
            notification.classList.remove('notification-enter');
            notification.classList.add('notification-enter-active');
        });

        setTimeout(() => {
            if (notification.parentElement) {
                notification.classList.add('notification-exit-active');
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    },

    showLoading(buttonId) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.classList.add('loading-btn');
            button.disabled = true;
            button.style.color = 'transparent';
        }
    },

    hideLoading(buttonId) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.classList.remove('loading-btn');
            button.disabled = false;
            button.style.color = '';
        }
    },

    showModal(message, onConfirm) {
        document.getElementById('modalMessage').textContent = message;
        document.getElementById('confirmModal').classList.remove('hidden');
        document.getElementById('confirmModal').classList.add('flex');

        const confirmBtn = document.getElementById('modalConfirm');
        confirmBtn.onclick = () => {
            this.hideModal();
            if (onConfirm) onConfirm();
        };
    },

    hideModal() {
        document.getElementById('confirmModal').classList.add('hidden');
        document.getElementById('confirmModal').classList.remove('flex');
    },

    updateVisualization() {
        const grantType = document.getElementById('grantType').value;
        const clientId = document.getElementById('clientId').value;
        const authUrl = document.getElementById('authorizationUrl')?.value || 'Not set';
        const tokenUrl = document.getElementById('tokenUrl')?.value || 'Not set';

        document.getElementById('configGrantType').textContent =
            grantType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        document.getElementById('configClientId').textContent = clientId || 'Not set';
        document.getElementById('configAuthUrl').textContent = authUrl;
        document.getElementById('configTokenUrl').textContent = tokenUrl;
    },

    generateAndSetPKCE(forceRegeneration) {
        const methodSelect = document.getElementById('codeChallengeMethod');
        const method = methodSelect ? methodSelect.value : 'S256';

        const verifierInput = document.getElementById('codeVerifier');
        const challengeInput = document.getElementById('codeChallenge');
        const methodInput = document.getElementById('codeChallengeMethod');

        if (verifierInput.value !== "" && !forceRegeneration) {
            challengeInput.value = Utils.generateCodeChallenge(verifierInput.value, method);
        } else {
            const pkce = Utils.generatePKCEPairs(method);

            if (verifierInput) verifierInput.value = pkce.codeVerifier;
            if (challengeInput) challengeInput.value = pkce.codeChallenge;
            if (methodInput) methodInput.value = method;
        }
        StorageService.saveFormData();
    },

    updateFieldsForGrantType(grantType) {


        const dynamicFields = document.getElementById('dynamicFields');

        const getElementWithFieldId = (id) =>
            Array.from(dynamicFields.querySelectorAll('.hidden')).find(element => {
                const field = element.querySelector(`#${id}`);
                return field !== null;
            });

        const commonFields = ["tokenUrl", "authorizationUrl", "scope"];
        const grantTypeFields = {
            authorization_code_pkce: [...commonFields, "redirectUri", "codeVerifier", "codeChallenge"],
            authorization_code: ["clientSecret", ...commonFields, "redirectUri"],
            implicit: ["authorizationUrl", "redirectUri", "scope"],
            password: ["clientSecret", "tokenUrl", "scope", "username"],
            client_credentials: ["clientSecret", "tokenUrl", "scope" ],
            refresh_token: [ "clientSecret", "refreshTokenUrl", "refreshToken"]
        };

        // hide every field
        Array.from(dynamicFields.children).forEach(field => {
            field.classList.add("hidden");
        });

        if (grantTypeFields[grantType]) {
            const fieldsToShow = grantTypeFields[grantType];
            fieldsToShow.forEach(fieldId => {
                const fieldElement = getElementWithFieldId(fieldId);
                if (fieldElement) {
                    fieldElement.classList.remove("hidden");
                }
            });
        }

        if (grantType === 'authorization_code_pkce') {
            const codeChallengeMethodSelectorElement = document.getElementById('codeChallengeMethod');
            codeChallengeMethodSelectorElement.addEventListener('change', () => {
                this.generateAndSetPKCE(false);
            })

            this.generateAndSetPKCE(false);
        }

        StorageService.saveFormData();
    },

    showSection(sectionId) {
        document.getElementById(sectionId).classList.remove('hidden');
    },

    hideSection(sectionId) {
        document.getElementById(sectionId).classList.add('hidden');
    },

    showButton(buttonId) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.classList.remove('hidden');
            button.classList.add('flex');
        }
    },

    hideButton(buttonId) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.classList.add('hidden');
            button.classList.remove('flex');
        }
    },

    displayJSON(containerId, data) {
        const container = document.getElementById(containerId);
        if (container) {
            container.textContent = Utils.formatJSON(data);
        }
    },

    clearVisualization() {
        this.hideSection('authUrlSection');
        this.hideSection('authCodeSection');
        this.hideSection('tokenSection');
        this.hideSection('userInfoSection');
        this.hideButton('exchangeCodeBtn');
        this.hideButton('getUserInfoBtn');
        this.hideButton('refreshTokenBtn');
    },

    bindFormEvents() {
        const inputs = ['discoveryUrl', 'baseUrl', 'clientId'];
        inputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', () => {
                    StorageService.saveFormData();
                    this.updateVisualization();
                });
            }
        });

        const authCodeInput = document.getElementById('authCodeInput');
        if (authCodeInput) {
            authCodeInput.addEventListener('input', () => {
                const code = authCodeInput.value;
                if (code) {
                    this.showButton('exchangeCodeBtn');
                } else {
                    this.hideButton('exchangeCodeBtn');
                }
            });
        }
    },

    async copyAuthUrl() {
        const authUrl = document.getElementById('authUrlDisplay').value;
        try {
            await Utils.copyToClipboard(authUrl);
            this.showNotification('Authorization URL copied to clipboard!', 'success');
        } catch (error) {
            this.showNotification('Failed to copy URL', 'error');
        }
    },

    syncAllUrls() {
        if (!document.getElementById("baseUrl").value) {
            this.showNotification('Please enter a Base URL first.', 'warning');
            return;
        }

        const trimSlash = (url) => {
            const input = document.getElementById(url);
            if (input) {
                input.value = input.value.replace(/\/+$/, "");
            }
        }

        const urls = {
            "tokenUrl":"/oauth2/token",
            "authorizationUrl": "/oauth2/authorize",
            "refreshTokenUrl": "/oauth2/token",
            "discoveryUrl": "/.well-known/openid-configuration"
        }

        const baseUrl = document.getElementById("baseUrl").value;
        trimSlash('baseUrl');

        const toOverwrite = [];
        Object.entries(urls).forEach(([key, value]) => {
            const input = document.getElementById(key);
            if (input) {
                if (input.value && input.value !== baseUrl + value) {
                    toOverwrite.push({input, value: baseUrl + value});
                } else {
                    input.value = baseUrl + value;
                }
            }
        });

        if (toOverwrite.length > 0) {
            this.showModal(
                `Some fields already have values. Do you want to overwrite them all?`,
                () => {
                    toOverwrite.forEach(({input, value}) => {
                        input.value = value;
                    });
                }
            );
        }
    }
};