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
  frameId: number;
} | null;

let mainAppTabId: number | null = null;
let dataG: dataGType = null;

type TempSelectedTabValues = {
  tabId: number;
  favIconUrl: string;
} | null;
let tempSelectedTabValues: TempSelectedTabValues = null;

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
      if (!sender.tab?.id) return;
      getVideosData(sender.tab?.id, {
        ...request,
        myTabId: sender.tab?.id,
      });
      // getVideosData(request.data.tabId, {
      //   ...request,
      //   myTabId: sender.tab?.id,
      // });
    } else if (request.cmd == MESSAGE_TYPES.RESULT_VIDEOS_DATA) {
      const videosWithFrameId = request.data.videos.map((item: any) => ({
        ...item,
        frameId: sender.frameId,
      }));
      if (!sender.tab?.id) return;

      request.data.videos = videosWithFrameId;

      sendMessageTab(sender.tab?.id, request, { frameId: 0 });
    } else if (request.cmd == MESSAGE_TYPES.ADD_EVENTS_ELEMENT) {
      if (!tempSelectedTabValues) return console.log('faltan favIconUrl tabId');
      const tabId = tempSelectedTabValues?.tabId;
      const favIconUrl = tempSelectedTabValues?.favIconUrl;

      const number = request.data.number;
      const img = request.data.img;
      const frameId = request.data.frameId;

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
        frameId,
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
    } else if (request.cmd === MESSAGE_TYPES.GET_VIDEO_INFO) {
      try {
        if (!dataG) {
          console.log('no hay elemento seleccionado');
          return;
        }
        sendResponse(
          await sendMessageTab(
            dataG.tabId,
            {
              ...request,
              data: { number: dataG.number },
            },
            { frameId: dataG.frameId }
          )
        );
      } catch (error) {
        console.log(error);
      }
    } else if (request.cmd === MESSAGE_TYPES.DISPLAY_VIDEOS_ON_SELECTED_PAGE) {
      const tabId = request.data.tabId;
      const favIconUrl = request.data.favIconUrl;

      tempSelectedTabValues = {
        tabId,
        favIconUrl,
      };

      const scriptUI = (tabId: number) => {
        const sx =
          typeof browser !== 'undefined' ? browser.scripting : chrome.scripting;

        sendMessageTab(
          tabId,
          { cmd: MESSAGE_TYPES.CHECK_CONNECTION_UI },
          { frameId: 0 }
        )
          .then((response) => {
            console.log('Respuesta del mensaje check connection:', response);
          })
          .catch((error) => {
            console.log('Error al enviar mensaje check connection:', error);
            sx.executeScript({
              target: { tabId: tabId },
              files: ['ui/select-video.js'],
            }).then(() => {
              console.log('script execute modal.js');
            });
          });
      };

      chrome.tabs.update(tabId, { active: true }, () => {
        chrome.tabs.get(tabId, (tab) => {
          // Si está completamente cargada
          if (tab.status === 'complete') {
            scriptUI(tabId);
          } else {
            chrome.tabs.onUpdated.addListener(
              function listener(updatedTabId, info) {
                if (updatedTabId === tabId && info.status === 'complete') {
                  chrome.tabs.onUpdated.removeListener(listener);
                  scriptUI(tabId);
                }
              }
            );
          }
        });
      });
    }
    // sendResponse({ data: 'no se encontro coincidencia' });
    return false;
  });
  return true;
});
