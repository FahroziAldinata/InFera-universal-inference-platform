import { useEffect } from 'react';
import { useDetectionStore } from '../store/detectionStore';
import { useObjectDetection } from '../hooks/useObjectDetection';
import { toggleModelFavorite, clearModelCache } from '../db/detectionDb';

export function ModelManagerPanel() {
    const { cachedModels, modelName } = useDetectionStore();
    const { loading, loadCachedModel, refreshCachedModels } = useObjectDetection();

    useEffect(() => {
        refreshCachedModels();
    }, [refreshCachedModels]);

    async function handleToggleFavorite(e: React.MouseEvent, id: string) {
        e.stopPropagation(); // Prevent loading the model when clicking the favorite button
        await toggleModelFavorite(id);
        await refreshCachedModels();
    }

    async function handleClearCache() {
        if (confirm('Apakah Anda yakin ingin menghapus seluruh cache model dari IndexedDB?')) {
            await clearModelCache();
            await refreshCachedModels();
        }
    }

    // Sort models: favorites first, then by lastUsed timestamp descending
    const sortedModels = [...cachedModels].sort((a, b) => {
        if (a.isFavorite !== b.isFavorite) {
            return b.isFavorite - a.isFavorite; // favorites first
        }
        return b.lastUsed - a.lastUsed; // most recently used first
    });

    return (
        <div className="card model-manager-panel">
            <div className="section-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: '12px' }}>
                <span className="section-header" style={{ padding: '4px 12px 4px' }}>CACHE MODEL ({cachedModels.length}/10)</span>
                {cachedModels.length > 0 && (
                    <button 
                        className="clear-btn" 
                        onClick={handleClearCache}
                        title="Clear Model Cache"
                    >
                        HAPUS ALL
                    </button>
                )}
            </div>

            {sortedModels.length === 0 ? (
                <div className="hint" style={{ padding: '8px 12px' }}>
                    Belum ada model yang tersimpan di cache IndexedDB.
                </div>
            ) : (
                <div className="model-cache-list">
                    {sortedModels.map((model) => {
                        const isActive = modelName === model.fileName;
                        return (
                            <div
                                key={model.id}
                                className={`model-cache-item ${isActive ? 'active' : ''} ${loading ? 'loading' : ''}`}
                                onClick={() => !loading && loadCachedModel(model)}
                            >
                                <div className="model-cache-info">
                                    <div className="model-cache-name">
                                        {model.name}
                                    </div>
                                    <div className="model-cache-meta">
                                        <span>{model.architecture.toUpperCase()}</span>
                                        <span>•</span>
                                        <span>{model.labels.length} Kelas</span>
                                    </div>
                                </div>

                                <button
                                    onClick={(e) => handleToggleFavorite(e, model.id)}
                                    className={`model-cache-favorite-btn ${model.isFavorite ? 'favorited' : ''}`}
                                    title={model.isFavorite ? 'Hapus dari Favorit' : 'Jadikan Favorit'}
                                >
                                    ★
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

