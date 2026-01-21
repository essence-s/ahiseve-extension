import { MESSAGE_TYPES } from './types';
import { getTabs, getVideosData, sendMessageTab } from './util';

chrome.runtime.onInstalled.addListener(() => {
  console.log('installed');
});
// improve
chrome.tabs.query(
  { url: ['https://ahiseve.vercel.app/*', 'http://localhost:4321/*'] },
  (tabs) => {
    tabs.forEach((tab) => {
      sendMessageTab(tab.id, { cmd: MESSAGE_TYPES.CHECK_CONNECTION })
        .then((response) => {
          if (response.message == 'connected') {
            console.log(response, 'ya esta conectado');
          }
        })
        .catch((err) => {
          chrome.scripting
            .executeScript({
              target: { tabId: parseInt(tab.id) },
              files: ['content.bundle.js'],
            })
            .then(() => {
              console.log('script injected');
            });
        });
    });
  }
);

let dataG = {};

function comprobarData() {
  return new Promise((resolve) => {
    if (Object.keys(dataG).length == 0) {
      chrome.storage.local.get(['dataG'], function (result) {
        if (result.dataG) {
          dataG = JSON.parse(result.dataG);
        }

        resolve('');
      });
    } else {
      resolve('');
    }
  });
}

const storeDataGStorage = (data) => {
  chrome.storage.local.set({ dataG: JSON.stringify(data) }, function () {
    console.log('Datos almacenados en el localStorage del background:');
  });
};

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  comprobarData().then(async () => {
    // console.log(request);
    // console.log(sender);
    if (request.cmd == 'updateDataG') {
      // console.log('si se pudo chavito')
      dataG = request.data;

      chrome.storage.local.set(
        { dataG: JSON.stringify(request.data) },
        function () {
          console.log('Datos almacenados en el localStorage del background:');
        }
      );
    } else if (request.cmd == MESSAGE_TYPES.ELEMENT_ACTION) {
      // console.log('element-action', request)
      if (request.data.status == 'sending') {
        // enviar al pagina principal
        chrome.tabs.query(
          { url: ['https://ahiseve.vercel.app/*', 'http://localhost:4321/*'] },
          (tabs) => {
            tabs.forEach((tab) => {
              sendMessageTab(tab.id, {
                cmd: request.cmd,
                data: request.data,
              });
            });
          }
        );
      } else {
        // console.log(dataG)
        // enviar a la pagina y videoElement Selecionado
        sendMessageTab(parseInt(dataG.tabId), {
          cmd: request.cmd,
          data: {
            ...request.data,
            number: dataG.number,
          },
        });
      }
    } else if (request.cmd == MESSAGE_TYPES.CHECK_ELEMENT_VIDEO_SELECTED) {
      // console.log('check', request)
      let sendData = {
        selected: false,
      };

      if (Object.keys(dataG).length != 0) {
        sendData = {
          selected: true,
        };
        // console.log('dataG', dataG)
      }
      // console.log('dataG vacio', dataG)
      sendMessageTab(sender.tab.id, {
        cmd: MESSAGE_TYPES.RESULT_CHECK_ELEMENT_VIDEO_SELECTED,
        data: sendData,
      });
    } else if (request.cmd == MESSAGE_TYPES.GET_TABS) {
      const tabs = await getTabs();

      sendResponse({
        ...request,
        cmd: MESSAGE_TYPES.RESULT_TABS,
        // type: 'RESPONSE',
        data: tabs,
      });
    } else if (request.cmd == MESSAGE_TYPES.GET_VIDEOS_DATA) {
      getVideosData(request.data.tabId, {
        ...request,
        myTabId: sender.tab.id,
      });
    } else if (request.cmd == MESSAGE_TYPES.RESULT_VIDEOS_DATA) {
      sendMessageTab(request.myTabId, {
        ...request,
        cmd: MESSAGE_TYPES.RESULT_VIDEOS_DATA,
        // type: 'RESPONSE',
        data: request.data,
      });
    } else if (request.cmd == MESSAGE_TYPES.ADD_EVENTS_ELEMENT) {
      const tabId = request.data.tabId;
      const number = request.data.number;
      const img = request.data.img;
      const favIconUrl = request.data.favIconUrl;

      if (dataG.tabId) {
        try {
          const resultMessageTab = await sendMessageTab(parseInt(dataG.tabId), {
            cmd: MESSAGE_TYPES.REMOVE_EVENTS_ELEMENTS,
            data: { number: dataG.number },
          });
          if (resultMessageTab.status == 'ok') {
            console.log('se removio eventos de seleccion anterior');
          }
        } catch (error) {
          console.log('error remove', error);
        }
      }

      await sendMessageTab(Number(tabId), {
        cmd: MESSAGE_TYPES.ADD_EVENTS_ELEMENT,
        data: { number },
      });

      dataG = {
        img,
        tabId,
        number,
        favIconUrl,
      };

      storeDataGStorage(dataG);
    }
    sendResponse({ data: 'no se encontro coincidencia' });
  });
  return true;
});
