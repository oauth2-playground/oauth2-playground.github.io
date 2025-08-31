const StorageService = {
    STORAGE_KEY: 'oauth2_playground_data',

    saveInStorage(key, value) {
        try {
            const data = JSON.parse(localStorage.getItem(this.STORAGE_KEY)) || {};
            data[key] = value;
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
        } catch (error) {
            console.warn('Failed to save data:', error);
        }
    },

    getFromStorage(key) {
        try {
            const data = JSON.parse(localStorage.getItem(this.STORAGE_KEY)) || {};
            return data[key];
        } catch (error) {
            console.warn('Failed to retrieve data:', error);
            return null;
        }
    },

    saveFormData() {
        const data = {
            baseUrl: document.getElementById('baseUrl')?.value || '',
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
            timestamp: Date.now()
        };

        const dynamicFields = document.querySelectorAll('#dynamicFields input, #dynamicFields textarea, #dynamicFields select');
        dynamicFields.forEach(field => {
            if (field.id && !field.readOnly) {
                data[field.id] = field.value;
            }
        });

        this.saveInStorage(this.STORAGE_KEY, JSON.stringify(data));
    },

    loadFormData() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (!saved) return;

            const data = JSON.parse(saved);

            // Load basic fields
            if (data.baseUrl) document.getElementById('baseUrl').value = data.baseUrl;
            if (data.discoveryUrl) document.getElementById('discoveryUrl').value = data.discoveryUrl;
            if (data.clientId) document.getElementById('clientId').value = data.clientId;

            // Load dynamic fields
            setTimeout(() => {
                Object.keys(data).forEach(key => {
                    const element = document.getElementById(key);
                    if (element && data[key] && !element.readOnly) {
                        element.value = data[key];
                    }
                });
            }, 100);

        } catch (error) {
            console.warn('Failed to load stored data:', error);
        }
    },

    checkDiscoveryChange(newUrl) {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (!saved) return false;

            const data = JSON.parse(saved);
            return data.discoveryUrl && data.discoveryUrl !== newUrl;
        } catch (error) {
            return false;
        }
    },

    clear() {
        localStorage.removeItem(this.STORAGE_KEY);
    }
};
