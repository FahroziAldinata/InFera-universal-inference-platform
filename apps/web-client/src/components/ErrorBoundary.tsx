import { Component, type ErrorInfo, type ReactNode } from 'react';
import { clearModelCache } from '../features/object-detection/db/detectionDb';
import { postprocessWorkerManager } from '../features/object-detection/utils/postprocessManager';
import { useDetectionStore } from '../features/object-detection/store/detectionStore';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('[ErrorBoundary] Uncaught application exception:', error, errorInfo);
    }

    private handleSoftRestart = () => {
        this.setState({ hasError: false, error: null });
    };

    private handleWorkerRestart = () => {
        try {
            postprocessWorkerManager.restart();
            alert('Web Worker post-processing restarted successfully!');
        } catch (e) {
            console.error('Failed to restart worker:', e);
            alert('Failed to restart worker. Check console for logs.');
        }
    };

    private handleIndexedDBCleanup = async () => {
        try {
            await clearModelCache();
            alert('IndexedDB model cache cleared successfully!');
        } catch (e) {
            console.error('Failed to clear IndexedDB:', e);
            alert('Failed to clear database cache.');
        }
    };

    private handleFullReset = async () => {
        if (confirm('Apakah Anda yakin ingin melakukan FULL RESET? Seluruh pengaturan, cache model, dan preferensi akan dihapus total.')) {
            try {
                // Clear IndexedDB
                await clearModelCache();
                // Clear Zustand local storage
                localStorage.clear();
                // Terminate worker
                postprocessWorkerManager.terminate();
                // Reset store state
                useDetectionStore.getState().reset();
                // Hard reload page
                window.location.reload();
            } catch (e) {
                console.error('Failed to perform full reset:', e);
                alert('Full reset failed. Hard reload the browser page.');
            }
        }
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    width: '100vw',
                    backgroundColor: '#0d0d11',
                    color: '#e0e0e8',
                    fontFamily: 'system-ui, sans-serif',
                    padding: '24px',
                    boxSizing: 'border-box'
                }}>
                    <div style={{
                        maxWidth: '600px',
                        width: '100%',
                        background: '#18181f',
                        border: '1px solid #ff5f57',
                        borderRadius: '6px',
                        padding: '30px',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                        boxSizing: 'border-box'
                    }}>
                        <h2 style={{ color: '#ff5f57', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>⚠</span> Terjadi Kesalahan Aplikasi
                        </h2>
                        
                        <p style={{ fontSize: '13px', color: '#9090a8', lineHeight: 1.5, margin: '0 0 20px' }}>
                            Infera mendeteksi adanya error tidak terduga pada interface atau web engine runtime. Gunakan opsi pemulihan di bawah untuk memperbaiki keadaan aplikasi.
                        </p>

                        {this.state.error && (
                            <div style={{
                                background: '#111116',
                                border: '1px solid #252530',
                                borderRadius: '4px',
                                padding: '12px',
                                fontFamily: 'monospace',
                                fontSize: '11px',
                                color: '#ffcccc',
                                overflowX: 'auto',
                                marginBottom: '24px',
                                maxHeight: '150px'
                            }}>
                                <strong>{this.state.error.name}:</strong> {this.state.error.message}
                                {this.state.error.stack && (
                                    <pre style={{ margin: '8px 0 0', whiteSpace: 'pre-wrap' }}>
                                        {this.state.error.stack}
                                    </pre>
                                )}
                            </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <button 
                                    onClick={this.handleSoftRestart}
                                    style={{
                                        background: '#2488ff',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '4px',
                                        padding: '10px',
                                        cursor: 'pointer',
                                        fontWeight: 'bold',
                                        fontSize: '12px'
                                    }}
                                >
                                    Muat Ulang Tampilan (Soft Restart)
                                </button>
                                <button 
                                    onClick={this.handleWorkerRestart}
                                    style={{
                                        background: '#1f1f28',
                                        color: '#e0e0e8',
                                        border: '1px solid #35354a',
                                        borderRadius: '4px',
                                        padding: '10px',
                                        cursor: 'pointer',
                                        fontSize: '12px'
                                    }}
                                >
                                    Restart Web Worker ⚙
                                </button>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <button 
                                    onClick={this.handleIndexedDBCleanup}
                                    style={{
                                        background: '#1f1f28',
                                        color: '#e0e0e8',
                                        border: '1px solid #35354a',
                                        borderRadius: '4px',
                                        padding: '10px',
                                        cursor: 'pointer',
                                        fontSize: '12px'
                                    }}
                                >
                                    Bersihkan Cache Model (IndexedDB)
                                </button>
                                <button 
                                    onClick={this.handleFullReset}
                                    style={{
                                        background: 'rgba(255, 95, 87, 0.15)',
                                        color: '#ff5f57',
                                        border: '1px solid #ff5f57',
                                        borderRadius: '4px',
                                        padding: '10px',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    Hapus Semua & Reset Pabrik 🛑
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
export default ErrorBoundary;
