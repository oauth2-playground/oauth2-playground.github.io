const Utils = {
    extractDomainFromUrl(url) {
        try {
            const urlObj = new URL(url);
            return `${urlObj.protocol}//${urlObj.host}`;
        } catch (error) {
            return '';
        }
    },

    generateRandomString(length) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';

        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    },

    async generatePKCEPairs(method) {
        const codeVerifier = this.generatePKCE(64);
        const codeChallenge = await this.getCodeChallenge(codeVerifier, method);
        return { codeVerifier, codeChallenge };
    },

    async generatePKCE(bytes) {
        return this.generateRandomString(bytes);
    },

    async getCodeChallenge(codeVerifier, method) {
        if (method === 'S256') {
            const encoder = new TextEncoder();
            const data = encoder.encode(codeVerifier);
            const digest = await crypto.subtle.digest('SHA-256', data);
            codeVerifier = btoa(String.fromCharCode(...new Uint8Array(digest)))
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=/g, '');
        }

        return codeVerifier;
    },

    generateMockJWT() {
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const payload = btoa(JSON.stringify({
            sub: '1234567890',
            name: 'John Doe',
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 3600
        }));
        const signature = this.generateRandomString(43);
        return `${header}.${payload}.${signature}`;
    },

    formatJSON(obj) {
        return JSON.stringify(obj, null, 2);
    },

    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
        } catch (error) {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
        }
    },

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    buildFullUrl(baseUrl, endpoint) {
        if (!baseUrl) return '';

        try {
            const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
            const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
            return base + path;
        } catch (error) {
            return '';
        }
    },

    extractEndpoint(fullUrl, baseUrl) {
        if (!fullUrl || !baseUrl) return '';

        try {
            const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
            if (fullUrl.startsWith(base)) {
                return fullUrl.substring(base.length);
            }
            return '';
        } catch (error) {
            return '';
        }
    },

    getDefaultEndpoints() {
        return {
            discoveryUrl: '/.well-known/openid-configuration',
            authorizationUrl: '/oauth2/authorize',
            tokenUrl: '/oauth2/token',
            userinfoUrl: '/userinfo',
            revocationUrl: '/oauth2/revoke'
        };
    }
};
