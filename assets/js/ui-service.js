const UIService = {
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

    updateDynamicFields() {
        const grantType = document.getElementById('grantType').value;

        if (grantType === 'none') return;

        const container = document.getElementById('dynamicFields');
        container.innerHTML = '';

        console.log(grantType)


        const fields = this.getFieldsForGrantType(grantType);

        fields.forEach(field => {
            const fieldDiv = document.createElement('div');
            // fieldDiv.className = 'space-y-2';

            const label = document.createElement('label');
            label.className = 'block text-slate-700 text-sm font-semibold mb-2';
            label.textContent = field.label;

            let input;
                input = document.createElement('input');
                input.className = 'w-full px-3 py-2 bg-white border border-slate-300 text-slate-700 font-mono focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400';
                input.type = field.type || 'text';


            input.id = field.id;
            input.placeholder = field.placeholder || '';
            input.readOnly = field.readonly || false;

            if (field.readonly) {
                input.className += ' bg-gray-100';
            }

            input.addEventListener("input", () => {
                StorageService.saveFormData();
                this.updateVisualization();
            });

            fieldDiv.appendChild(label);
            fieldDiv.appendChild(input);
            container.appendChild(fieldDiv);
        });

        if (grantType === 'authorization_code_pkce') {
            this.generateAndSetPKCE();
        }

        StorageService.loadFormData();
    },

    async generateAndSetPKCE() {
        try {
            const pkce = await Utils.generatePKCE(64);

            setTimeout(() => {
                const verifierInput = document.getElementById('codeVerifier');
                const challengeInput = document.getElementById('codeChallenge');
                const methodInput = document.getElementById('codeChallengeMethod');

                if (verifierInput) verifierInput.value = pkce.codeVerifier;
                if (challengeInput) challengeInput.value = pkce.codeChallenge;
                if (methodInput) methodInput.value = pkce.codeChallengeMethod;

                StorageService.saveFormData();
            }, 100);
        } catch (error) {
            console.error('Failed to generate PKCE:', error);
        }
    },

    getFieldsForGrantType(grantType) {
        const commonFields = [
            {id: 'tokenUrl', label: 'Token URL', placeholder: 'https://auth.example.com/oauth/token'},
            {id: 'authorizationUrl', label: 'Authorization URL', placeholder: 'https://auth.example.com/oauth/authorize'},
            {id: 'scope', label: 'Scope', placeholder: 'openid profile email'}
        ];

        switch (grantType) {
            case 'authorization_code_pkce':
                return [
                    ...commonFields,
                    {id: 'redirectUri', label: 'Redirect URI', placeholder: 'https://yourapp.com/callback'},
                    {id: 'codeVerifier', label: 'Code Verifier', readonly: false},
                    {id: 'codeChallenge', label: 'Code Challenge', readonly: true},
                    {id: 'codeChallengeMethod', label: 'Code Challenge Method', readonly: false}
                ];
            case 'authorization_code':
                return [
                    {id: 'clientSecret', label: 'Client Secret', type: 'password', placeholder: 'your-client-secret'},
                    ...commonFields,
                    {id: 'redirectUri', label: 'Redirect URI', placeholder: 'https://yourapp.com/callback'},
                ];
            case 'implicit':
                return [
                    {id: 'authorizationUrl', label: 'Authorization URL', placeholder: 'https://auth.example.com/oauth/authorize'},
                    {id: 'redirectUri', label: 'Redirect URI', placeholder: 'https://yourapp.com/callback'},
                    {id: 'scope', label: 'Scope', placeholder: 'openid profile email'},
                ];
            case 'password':
                return [
                    {id: 'clientSecret', label: 'Client Secret', type: 'password', placeholder: 'your-client-secret'},
                    {id: 'tokenUrl', label: 'Token URL', placeholder: 'https://auth.example.com/oauth/token'},
                    {id: 'scope', label: 'Scope', placeholder: 'openid profile email'},
                    {id: 'username', label: 'Username', placeholder: 'user@example.com'},
                    {id: 'password', label: 'Password', type: 'password', placeholder: 'password'},
                ];
            case 'client_credentials':
                return [
                    {id: 'clientSecret', label: 'Client Secret', type: 'password', placeholder: 'your-client-secret'},
                    {id: 'tokenUrl', label: 'Token URL', placeholder: 'https://auth.example.com/oauth/token'},
                    {id: 'scope', label: 'Scope', placeholder: 'api:read api:write'}
                ];
            case 'refresh_token':
                return [
                    {id: 'clientSecret', label: 'Client Secret', type: 'password', placeholder: 'your-client-secret'},
                    {id: 'refreshTokenUrl', label: 'Token URL', placeholder: 'https://auth.example.com/oauth/token'},
                    {id: 'refreshToken', label: 'Refresh Token', type: 'text', placeholder: 'your-refresh-token'}
                ];
            default:
                return commonFields;
        }
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

        const grantTypeSelect = document.getElementById('grantType');
        if (grantTypeSelect) {
            grantTypeSelect.addEventListener('change', () => {
                this.updateDynamicFields();
                StorageService.saveFormData();
                this.updateVisualization();
                this.clearVisualization();
            });
        }

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
    }
};

















