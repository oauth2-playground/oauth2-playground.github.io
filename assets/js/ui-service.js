const UIService = {
    evalIfContentCanBeSavedAndSaveIt(event) {
        event.preventDefault();

        StorageService.saveFormData();
        UIService.showNotification('Configuration saved!', 'success');
    },

    fillFieldsFromCache() {
        const oauth2PlaygroundData = $.parseJSON(StorageService.getFromStorage() || '{}');

        const fields =[
            'grantType', 'discoveryUrl',
            'tokenUrl', 'authorizationUrl', 'userinfoUrl', 'revocationUrl',
            'clientId', 'clientSecret', 'redirectUri', 'scope', 'refreshTokenUrl',
            'codeChallengeMethod'
        ];

        fields.forEach((field) => {
            if (Object.prototype.hasOwnProperty.call(oauth2PlaygroundData, field)) {
                const $element = $('#' + field);
                if ($element.length) {
                    $element.val(oauth2PlaygroundData[field]);
                }
            }
        })
    },

    changeAuthenticationFields(selectedGrantType) {
        if (selectedGrantType !== 'none') {
            this.updateFieldsForGrantType(selectedGrantType);
        } else {
            const $dynamicFields = $('#dynamicFields');
            $dynamicFields.find('div').not('.hidden').each(function() {
                $(this).addClass('hidden');
            });
        }
        this.updateVisualization();
        this.clearVisualization();
    },

    showNotification(message, type = 'info') {
        const $notification = $('<div></div>');
        const colors = {
            success: 'bg-white border-l-4 border-green-500 text-gray-800 shadow-md',
            error: 'bg-white border-l-4 border-red-500 text-gray-800 shadow-md',
            warning: 'bg-white border-l-4 border-yellow-500 text-gray-800 shadow-md',
            info: 'bg-white border-l-4 border-blue-500 text-gray-800 shadow-md'
        };

        $notification
            .addClass(`${colors[type]} px-4 py-3 rounded-sm notification-enter`)
            .html(`
        <div class="flex items-center justify-between">
            <span>${message}</span>
        </div>
    `);

        $('#notifications').append($notification);

        requestAnimationFrame(() => {
            $notification.removeClass('notification-enter').addClass('notification-enter-active');
        });

        setTimeout(() => {
            if ($notification.parent().length) {
                $notification.addClass('notification-exit-active');
                setTimeout(() => $notification.remove(), 300);
            }
        }, 5000)
    },

    showLoading(buttonId) {
        const $button = $('#' + buttonId);

        if ($button.length) {
            $button.addClass('loading-btn');
            $button.prop('disabled', true);
            $button.css('color', 'transparent');
        }
    },

    hideLoading(buttonId) {
        const $button = $('#' + buttonId);
        if ($button.length) {
            $button.removeClass('loading-btn');
            $button.prop('disabled', false);
            $button.css('color', '');
        }
    },

    showModal(message, onConfirm) {
        $('#modalMessage').text(message);
        $('#confirmModal').removeClass('hidden').addClass('flex');

        $('#modalConfirm').on('click', () => {
            this.hideModal();
            if (onConfirm) onConfirm();
        });
    },

    hideModal() {
        $('#confirmModal').addClass('hidden').removeClass('flex');
    },

    async updateVisualization() {
        const $grantType = $('#grantType').val() || 'None selected';
        const $clientId = $('#clientId').val() || 'Not set';
        const $authUrl = $('#authorizationUrl').val() || 'Not set';
        const $tokenUrl = $('#tokenUrl').val() || 'Not set';

        $('#configGrantType').text(
            $grantType
                .replace(/_/g, ' ')
                .replace(/\b\w/g, l => l.toUpperCase())
        );
        $('#configClientId').text($clientId || 'Not set');
        $('#configAuthUrl').text($authUrl);
        $('#configTokenUrl').text($tokenUrl);
    },

    async generateAndSetPKCE(forceRegeneration) {
        const PKCE_VALUES = "pkce_values";

        const $methodSelect = $('#codeChallengeMethod');
        const method = $methodSelect.length ? $methodSelect.val() : 'S256';

        const $verifierInput = $('#codeVerifier');
        const $challengeInput = $('#codeChallenge');

        if ($verifierInput.val() !== "" && !forceRegeneration) {
            const codeChallenge = await Utils.generateCodeChallenge($verifierInput.val(), method);
            const codeVerifier = $verifierInput.val();

            // StorageService.saveInStorage(PKCE_VALUES, `${codeVerifier}|${codeChallenge}|${method}`, sessionStorage);

            $challengeInput.val(codeChallenge);

        } else {
            const pkce = Utils.generatePKCEPairs(method);

            // StorageService.saveInStorage(PKCE_VALUES, `${pkce.codeVerifier}|${pkce.codeChallenge}|${method}`, sessionStorage);

            if ($verifierInput.length) $verifierInput.val(pkce.codeVerifier);
            if ($challengeInput.length) $challengeInput.val(pkce.codeChallenge);
            if ($methodSelect.length) $methodSelect.val(method);
        }
    },

    updateFieldsForGrantType(grantType) {
        const $dynamicFields = $('#dynamicFields')

        const getElementWithFieldId = (id) =>
            $dynamicFields
                .children()
                .filter(function() {
                    return $(this)
                        .find(`#${id}`).length > 0;
                })

        const commonFields = ["tokenUrl", "authorizationUrl", "scope"];
        const grantTypeFields = {
            authorization_code_pkce: [...commonFields, "redirectUri", "codeVerifier", "codeChallenge", "codeChallengeMethod", "authCodeInput"],
            authorization_code: ["clientSecret", ...commonFields, "redirectUri", "authCodeInput"],
            implicit: ["authorizationUrl", "redirectUri", "scope"],
            password: ["clientSecret", "tokenUrl", "scope", "username"],
            client_credentials: ["clientSecret", "tokenUrl", "scope" ],
            refresh_token: [ "clientSecret", "refreshTokenUrl", "refreshToken"]
        };

        // hide every field
        $dynamicFields.children().addClass('hidden');

        if (grantTypeFields[grantType]) {
            const fieldsToShow = grantTypeFields[grantType];
            fieldsToShow.forEach(fieldId => {
                const $fieldElement = getElementWithFieldId(fieldId);

                if ($fieldElement && $fieldElement.length > 0) {
                    $fieldElement.removeClass("hidden");
                    const $redirectUri = $("#redirectUri");
                    if($fieldElement.find("input").first().attr('id') === 'redirectUri' && !$redirectUri.val()) {
                        $redirectUri.val(`${window.location.href}cb.html`);
                    }
                }
            });
        }

        if (grantType === 'authorization_code_pkce') {
            $('#codeChallengeMethod').on('change', () => {
                this.generateAndSetPKCE(false)
            });

            this.generateAndSetPKCE(false);
        }
    },

    showSection(sectionId) {
        $(`#${sectionId}`).removeClass('hidden');
    },

    hideSection(sectionId) {
        $(`#${sectionId}`).addClass('hidden');
    },

    showButton(buttonId) {
        $(`#${buttonId}`)
            .removeClass('hidden')
            .addClass('flex');
    },

    hideButton(buttonId) {
        $(`#${buttonId}`)
            .addClass('hidden')
            .removeClass('flex');
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
                    this.updateVisualization();
                });
            }
        });

        // const authCodeInput = document.getElementById('authCodeInput');
        // if (authCodeInput) {
        //     authCodeInput.addEventListener('input', () => {
        //         const code = authCodeInput.value;
        //         if (code) {
        //             this.showButton('exchangeCodeBtn');
        //         } else {
        //             this.hideButton('exchangeCodeBtn');
        //         }
        //     });
        // }
        const $authCodeInput = $('#authCodeInput');
        if ($authCodeInput.length) {
            $authCodeInput.on('input', () => {
                const code = $authCodeInput.val();
                if (code) {
                    this.showButton('exchangeCodeBtn');
                } else {
                    this.hideButton('exchangeCodeBtn');
                }
            });
        }
    },

    async copyAuthorizationURLOnClick(e) {
        const authUrlDisplay = e.target;
        if (e.button === 0) {
            authUrlDisplay.select();
            try {
                await Utils.copyToClipboard(authUrlDisplay.value);
                UIService.showNotification('Authorization URL copied to clipboard', 'info');
            } catch (err) {
                UIService.showNotification('Failed to copy URL', 'error');
            }
        }
    },

};