import Dexie, { type Table } from 'dexie';

export interface SavedModel {
    id: string; // Unique file name or UAMP ID
    name: string;
    fileName: string;
    onnxData: ArrayBuffer;
    labels: string[];
    inputShape: number[];
    architecture: string;
    isFavorite: number; // 0 or 1
    lastUsed: number;
}

export interface SavedInference {
    id: string;
    modelId: string;
    modelName: string;
    timestamp: number;
    detectionsCount: number;
    executionTimeMs: number;
    imageName: string;
}

class DetectionDatabase extends Dexie {
    models!: Table<SavedModel, string>;
    inferences!: Table<SavedInference, string>;

    constructor() {
        super('InferaDetectionDB');
        
        // Define version 1 schema
        this.version(1).stores({
            models: 'id, name, isFavorite, lastUsed',
            inferences: 'id, modelId, timestamp',
        });
    }
}

export const db = new DetectionDatabase();

/**
 * Initializes database gracefully. 
 * If the schema is corrupted or locked, deletes and recreates the DB to prevent app crash.
 */
export async function initDatabase() {
    try {
        await db.open();
        console.log('[db] IndexedDB opened successfully');
    } catch (err) {
        console.warn('[db] Failed to open IndexedDB, attempting clean recreation:', err);
        try {
            await Dexie.delete('InferaDetectionDB');
            await db.open();
            console.log('[db] Recreated corrupt database successfully');
        } catch (recreateErr) {
            console.error('[db] Fatal database recovery failure:', recreateErr);
        }
    }
}

/**
 * Saves a model to IndexedDB, enforcing LRU eviction when count exceeds 10.
 * Prioritizes keeping starred (favorite) models when evicting.
 */
export async function saveModelToCache(model: SavedModel) {
    try {
        const allModels = await db.models.toArray();
        if (allModels.length >= 10) {
            // Find oldest LRU model. Non-favorites are evicted first.
            allModels.sort((a, b) => {
                if (a.isFavorite !== b.isFavorite) {
                    return a.isFavorite - b.isFavorite; // 0 (non-favorite) comes before 1 (favorite)
                }
                return a.lastUsed - b.lastUsed; // oldest timestamp first
            });
            const toEvict = allModels[0];
            if (toEvict) {
                await db.models.delete(toEvict.id);
                console.log(`[db] Evicted oldest cached model: ${toEvict.name}`);
            }
        }
        await db.models.put(model);
        console.log(`[db] Saved model to cache: ${model.name}`);
    } catch (err) {
        console.error('[db] Failed to save model to IndexedDB:', err);
    }
}

/**
 * Star or unstar a model
 */
export async function toggleModelFavorite(id: string) {
    try {
        const model = await db.models.get(id);
        if (model) {
            const nextFav = model.isFavorite === 1 ? 0 : 1;
            await db.models.update(id, { isFavorite: nextFav });
            console.log(`[db] Favorite toggled for ${model.name} to: ${nextFav}`);
        }
    } catch (err) {
        console.error('[db] Failed to toggle model favorite:', err);
    }
}

/**
 * Update the lastUsed timestamp of a model to keep it safe from LRU eviction
 */
export async function updateModelLastUsed(id: string) {
    try {
        await db.models.update(id, { lastUsed: Date.now() });
    } catch (err) {
        console.error('[db] Failed to update model timestamp:', err);
    }
}

/**
 * Deletes all stored models in IndexedDB cache
 */
export async function clearModelCache() {
    try {
        await db.models.clear();
        console.log('[db] Cleared saved models cache');
    } catch (err) {
        console.error('[db] Failed to clear model cache:', err);
    }
}
