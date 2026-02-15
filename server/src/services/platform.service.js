class PlatformService {
    constructor() { }

    async postContent(account, post) {
        throw new Error("Method 'postContent' must be implemented");
    }

    async validateToken(token) {
        throw new Error("Method 'validateToken' must be implemented");
    }
}

export default PlatformService;
