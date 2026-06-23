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
        <div className="card model-manager-panel" style={{ marginTop: '8px' }}>
            <div className="section-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: '12px' }}>
                <span className="section-header" style={{ padding: '4px 12px 4px' }}>CACHE MODEL ({cachedModels.length}/10)</span>
                {cachedModels.length > 0 && (
                    <button 
                        className="clear-btn" 
                        onClick={handleClearCache}
                        style={{ fontSize: '9px', opacity: 0.6, cursor: 'pointer' }}
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
                <div className="model-cache-list" style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '0 8px 8px' }}>
                    {sortedModels.map((model) => {
                        const isActive = modelName === model.fileName;
                        return (
                            <div
                                key={model.id}
                                className={`model-cache-item ${isActive ? 'active' : ''}`}
                                onClick={() => !loading && loadCachedModel(model)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '6px 8px',
                                    borderRadius: '3px',
                                    background: isActive ? 'var(--accent-dim)' : 'var(--surface-1)',
                                    borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    opacity: loading ? 0.7 : 1,
                                    transition: 'all 0.1s'
                                }}
                            >
                                <div className="model-cache-info" style={{ minWidth: 0, flex: 1, marginRight: '8px' }}>
                                    <div 
                                        className="model-cache-name" 
                                        style={{ 
                                            fontSize: '11px', 
                                            fontWeight: 600, 
                                            color: isActive ? '#fff' : 'var(--tx-1)',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis'
                                        }}
                                    >
                                        {model.name}
                                    </div>
                                    <div 
                                        className="model-cache-meta" 
                                        style={{ 
                                            fontSize: '9px', 
                                            color: 'var(--tx-3)', 
                                            marginTop: '2px',
                                            fontFamily: 'var(--mono)',
                                            display: 'flex',
                                            gap: '6px'
                                        }}
                                    >
                                        <span>{model.architecture.toUpperCase()}</span>
                                        <span>•</span>
                                        <span>{model.labels.length} Kelas</span>
                                    </div>
                                </div>

                                <button
                                    onClick={(e) => handleToggleFavorite(e, model.id)}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: model.isFavorite ? 'var(--yellow)' : 'var(--tx-3)',
                                        fontSize: '14px',
                                        padding: '2px',
                                        transition: 'color 0.1s'
                                    }}
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
