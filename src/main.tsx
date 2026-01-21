import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const rootElement = document.getElementById('root')!;
const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Remove splash screen with fade out effect
const splash = document.getElementById('splash-screen');
if (splash) {
  setTimeout(() => {
    splash.classList.add('fade-out');
    setTimeout(() => {
      splash.remove();
    }, 500);
  }, 1000); // Keep splash for at least 1s for branding effect
}
