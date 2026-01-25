import { MESSAGE_TYPES } from './types/message';
import { getTabs, getVideosData, sendMessageTab } from './util';

chrome.runtime.onInstalled.addListener(() => {
  console.log('installed');
});

type dataGType = {
  img: string;
  tabId: number;
  number: string;
  favIconUrl: string;
} | null;

let mainAppTabId: number | null = null;
let dataG: dataGType = null;

function comprobarData() {
  return new Promise((resolve) => {
    if (dataG && Object.keys(dataG).length == 0) {
      chrome.storage.local.get(['dataG'], function (result) {
        if (result.dataG) {
          dataG = JSON.parse(result.dataG as string);
        }

        resolve('');
      });
    } else {
      resolve('');
    }
  });
}

const storeDataGStorage = (data: any) => {
  chrome.storage.local.set({ dataG: JSON.stringify(data) }, function () {
    console.log('Datos almacenados en el localStorage del background:');
  });
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  comprobarData().then(async () => {
    // console.log(request);
    // console.log(sender);
    if (request.cmd == MESSAGE_TYPES.ELEMENT_ACTION) {
      // console.log('element-action', request)
      if (request.data.status == 'sending') {
        if (!mainAppTabId) {
          console.log('mainAppTabId null');
          return;
        }
        // enviar al pagina principal
        sendMessageTab(mainAppTabId, {
          cmd: request.cmd,
          data: request.data,
        });
      } else {
        // console.log(dataG)
        if (!dataG) {
          console.log('no hay elemento seleccionado');
          return;
        }
        // enviar a la pagina y videoElement Selecionado
        sendMessageTab(dataG.tabId, {
          cmd: request.cmd,
          data: {
            ...request.data,
            number: dataG.number,
          },
        });
      }
    } else if (request.cmd == MESSAGE_TYPES.CHECK_ELEMENT_VIDEO_SELECTED) {
      let sendData = { selected: false };

      if (!dataG) {
        console.log('no hay elemento seleccionado');
        return;
      }
      if (Object.keys(dataG).length != 0) sendData = { selected: true };

      sendResponse({
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
        myTabId: sender.tab?.id,
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

      if (dataG && dataG.tabId) {
        try {
          const resultMessageTab: any = await sendMessageTab(dataG.tabId, {
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
    } else if (request.cmd === MESSAGE_TYPES.APP_INSTANCE_ALIVE) {
      const newTabId = sender.tab?.id;
      if (newTabId !== undefined) {
        // avisa a la anterior que ya no es principal
        if (mainAppTabId !== null && mainAppTabId !== newTabId) {
          sendMessageTab(mainAppTabId, {
            cmd: MESSAGE_TYPES.APP_INSTANCE_LOST_PRIMARY,
          }).catch(() => {});
        }

        // actualiza principal
        mainAppTabId = newTabId;

        // avisar la nueva principal
        sendMessageTab(mainAppTabId, {
          cmd: MESSAGE_TYPES.APP_INSTANCE_NOW_PRIMARY,
        }).catch(() => {});
      }
    }
    sendResponse({ data: 'no se encontro coincidencia' });
  });
  return true;
});
