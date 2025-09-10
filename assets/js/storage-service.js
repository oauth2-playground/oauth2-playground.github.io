const StorageService = {
    STORAGE_KEY: 'oauth2_playground_data',

    _encodeToBase64(data) {
        try {
            return btoa(unescape(encodeURIComponent(data)));
        } catch (error) {
            return data;
        }
    },

    _decodeFromBase64(encodedData) {
        try {
            return decodeURIComponent(escape(atob(encodedData)));
        } catch (error) {
            return encodedData;
        }
    },

    saveInStorage(key, value, storage = localStorage) {
        try {
            const existingData = storage.getItem(this.STORAGE_KEY);
            let data = {};

            if (existingData) {
                const decodedExisting = this._decodeFromBase64(existingData);
                data = JSON.parse(decodedExisting);
            }

            data[key] = value;

            const encodedData = this._encodeToBase64(JSON.stringify(data));
            storage.setItem(this.STORAGE_KEY, encodedData);
        } catch (error) {
        }
    },

    getFromStorage(key = this.STORAGE_KEY, storage = localStorage) {
        try {
            const encodedData = storage.getItem(this.STORAGE_KEY);
            if (!encodedData) return null;

            const decodedData = this._decodeFromBase64(encodedData);
            const data = JSON.parse(decodedData);

            return data[key];
        } catch (error) {
            return null;
        }
    },

    saveFormData() {
        const data = {
            grantType: document.getElementById("grantType")?.value || '',
            // baseUrl: document.getElementById('baseUrl')?.value || '',
            discoveryUrl: document.getElementById('discoveryUrl')?.value || '',
            tokenUrl: document.getElementById('tokenUrl')?.value || '',
            authorizationUrl: document.getElementById('authorizationUrl')?.value || '',
            userinfoUrl: document.getElementById('userinfoUrl')?.value || '',
            revocationUrl: document.getElementById('revocationUrl')?.value || '',
            clientId: document.getElementById('clientId')?.value || '',
            clientSecret: document.getElementById('clientSecret')?.value || '',
            redirectUri: document.getElementById('redirectUri')?.value || '',
            scope: document.getElementById('scope')?.value || '',
            refreshTokenUrl: document.getElementById('refreshTokenUrl')?.value || '',
            codeChallengeMethod: document.getElementById('codeChallengeMethod')?.value || '',
            timestamp: Date.now()
        };

        this.saveInStorage(this.STORAGE_KEY, JSON.stringify(data));
    },

    loadFormData() {
        try {
            const encodedData = localStorage.getItem(this.STORAGE_KEY);
            if (!encodedData) return;

            const decodedData = this._decodeFromBase64(encodedData);
            const data = JSON.parse(decodedData);

            // if (data.baseUrl) document.getElementById('baseUrl').value = data.baseUrl;
            if (data.discoveryUrl) document.getElementById('discoveryUrl').value = data.discoveryUrl;
            if (data.clientId) document.getElementById('clientId').value = data.clientId;

           Object.keys(data).forEach(key => {
                    const element = document.getElementById(key);
                    if (element && data[key] && !element.readOnly) {
                        element.value = data[key];
                    }
                });

        } catch (error) {
            console.warn('Failed to load stored data:', error);
        }
    },

    checkDiscoveryChange(newUrl) {
        try {
            const encodedData = localStorage.getItem(this.STORAGE_KEY);
            if (!encodedData) return false;

            const decodedData = this._decodeFromBase64(encodedData);
            const data = JSON.parse(decodedData);

            return data.discoveryUrl && data.discoveryUrl !== newUrl;
        } catch (error) {
            return false;
        }
    },

    clear() {
        localStorage.removeItem(this.STORAGE_KEY);
    }
};