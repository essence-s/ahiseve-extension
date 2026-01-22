import { MESSAGE_TYPES } from './types';
import { sendMessageTab } from './util';

const element = info;

const getTabIdFirstApp = () => {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ url: ['https://ahiseve.vercel.app/*'] }, (tabs) => {
      if (!tabs || tabs.length === 0) {
        reject(new Error('No se encontró ninguna pestaña de la app'));
      } else {
        resolve(tabs[0].id);
      }
    });
  });
};

function renderStatus() {
  let checkConnection = false;
  let loader = true;

  async function effect() {
    setTimeout(async () => {
      try {
        let tabIdApp = await getTabIdFirstApp();

        sendMessageTab(Number(tabIdApp), {
          cmd: MESSAGE_TYPES.CHECK_CONNECTION,
        })
          .then((response) => {
            if (response.message == 'connected') {
              checkConnection = true;
              loader = false;
              render();
            }
          })
          .catch((err) => {
            console.log('Error al enviar mensaje:', err);
            checkConnection = false;
            loader = false;
            render();
          });
      } catch (error) {
        console.log(error);
        loader = false;
        render();
      }
    }, 1000);
  }
  function render() {
    element.innerHTML = `${
      !loader
        ? `<p>
          ${checkConnection ? 'Se conecto' : 'No se conecto'}
        </p>
        <p>
          ${
            checkConnection
              ? 'Estas conectado con la web ahiseve'
              : 'La extension no esta conectado la web Ahiseve'
          }
        </p>
        `
        : `
        <div class='loader'>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-loader-circle-icon lucide-loader-circle"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
        </div>
        `
    }`;
  }
  render();
  effect();
}

renderStatus();
