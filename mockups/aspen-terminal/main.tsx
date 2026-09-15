import { createRoot } from 'react-dom/client';
import App from './App';

const root = document.getElementById('root');
if (!root) throw new Error('Preview root not found');
createRoot(root).render(<App />);
