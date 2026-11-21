/**
 * AssetLoader - Loads and manages game assets
 * Handles images, audio, and other resources
 */
class AssetLoader {
    constructor() {
        this.assets = {};
        this.toLoad = 0;
        this.loaded = 0;
        this.errors = [];
    }

    loadImage(key, src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.assets[key] = img;
                resolve(img);
            };
            img.onerror = () => {
                this.errors.push({ key, src, type: 'image' });
                reject(new Error(`Failed to load image: ${src}`));
            };
            img.src = src;
        });
    }

    async loadAll(manifest) {
        this.toLoad = manifest.length;
        this.loaded = 0;
        this.errors = [];

        const promises = manifest.map(async (asset) => {
            if (asset.type === 'image') {
                return this.loadImage(asset.key, asset.src);
            }
            return null;
        });

        await Promise.allSettled(promises);
        return this.getProgress();
    }

    get(key) {
        return this.assets[key];
    }

    getProgress() {
        return {
            loaded: this.loaded,
            total: this.toLoad,
            percent: this.toLoad > 0 ? (this.loaded / this.toLoad) * 100 : 100
        };
    }

    hasErrors() {
        return this.errors.length > 0;
    }

    getErrors() {
        return this.errors;
    }

    clear() {
        this.assets = {};
        this.errors = [];
    }
}
export { AssetLoader };
export default AssetLoader;
