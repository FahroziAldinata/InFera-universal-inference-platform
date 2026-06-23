import { ModelUploader } from './components/ModelUploader';
import { ImageUploader } from './components/ImageUploader';
import { RunButton } from './components/RunButton';
import { ResultPanel } from './components/ResultPanel';
import './App.css';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">Infera</h1>
        <p className="app-subtitle">Universal Inference Platform</p>
      </header>

      <main className="app-main">
        <ModelUploader />
        <ImageUploader />
        <RunButton />
        <ResultPanel />
      </main>
    </div>
  );
}

export default App;