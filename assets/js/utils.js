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

    base64URL(string) {
        return string
            .toString(CryptoJS.enc.Base64)
            .replace(/=/g, '')
            .replace(/\+/g, '-')
            .replace(/\//g, '_');
    },

    generatePKCEPairs(method) {
        const codeVerifier = this.generateCodeVerifier(64);
        const codeChallenge = this.generateCodeChallenge(codeVerifier, method);
        return { codeVerifier, codeChallenge };
    },

    generateCodeVerifier(bytes) {
        let rand = new Uint8Array(bytes);
        crypto.getRandomValues(rand);
        return this.base64URL(new CryptoJS.lib.WordArray.init(rand))
    },

    generateCodeChallenge(codeVerifier, method) {
        return method === 'S256' ?
            this.base64URL(CryptoJS.SHA256(codeVerifier)) : codeVerifier;
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
