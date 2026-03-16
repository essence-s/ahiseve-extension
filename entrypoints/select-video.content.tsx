import { render } from 'preact';
import FloatingInterface from '../components/FloatingInterface/FloatingInterface.tsx';
import styles from '../styles/global.css?inline';

const rootEl = document.createElement('div');
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
