import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './styles.css';
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
import { useGame } from './store/useGame';
(window as any).__game = useGame; // debug / e2e hook
import { preloadModels } from './scene/models';
preloadModels();
