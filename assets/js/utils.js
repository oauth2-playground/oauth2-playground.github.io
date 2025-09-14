const Utils = {
    generateRandomString(length) {
        let rand = new Uint8Array(length);
        crypto.getRandomValues(rand);
        return new CryptoJS.lib.WordArray.init(rand).toString();
    },

    base64URLEncode(string) {
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
        return this.base64URLEncode(this.generateRandomString(bytes))
    },

    generateCodeChallenge(codeVerifier, method) {
        return method === 'S256' ?
            this.base64URLEncode(CryptoJS.SHA256(codeVerifier)) : codeVerifier;
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
    }
};
