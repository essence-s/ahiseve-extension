import { render } from 'preact';
import FloatingInterface from '../components/FloatingInterface/FloatingInterface.tsx';
import styles from '../styles/global.css?inline';

const EXISTING_ID = 'ui_ahiseve';
const existing = document.getElementById(EXISTING_ID);
if (existing) {
  existing.remove();
}

const rootEl = document.createElement('div');
rootEl.id = EXISTING_ID;

const shadowRoot = rootEl.attachShadow({ mode: 'open' });
document.body.appendChild(rootEl);

const element = document.createElement('div');
shadowRoot.appendChild(element);

const styleEl = document.createElement('style');
styleEl.textContent = styles;
shadowRoot.appendChild(styleEl);

export default defineContentScript({
  registration: 'runtime',
  main() {
    render(<FloatingInterface />, element);
  },
});
