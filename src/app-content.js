import { MESSAGE_TYPES } from './types';
import { postMessage, sendMessage } from './util';

// envia una señal de instancia de la web
chrome.runtime.sendMessage({
  cmd: MESSAGE_TYPES.APP_INSTANCE_ALIVE,
  tabId: chrome.runtime.id,
});

const messageHandlers = {
  [MESSAGE_TYPES.APP_INSTANCE_NOW_PRIMARY]: async () => {
    console.log(
      'Ahiseve extension: ',
      'ahora la pestaña Ahiseve esta conectado a la extension'
    );
    console.log(
      'la extension solo puede conectarse con una pestaña de Ahiseve'
    );
    return { status: 'ok' };
  },
  [MESSAGE_TYPES.APP_INSTANCE_LOST_PRIMARY]: async () => {
    console.log(
      'Ahiseve extension: ',
      'esta pestaña dejo de ser la principal y se desconecto de la extension'
    );
    return { status: 'ok' };
  },
  ELEMENT_ACTION: async (request) => {
    if (request.data.status == 'sending') {
      postMessage({
        cmd: request.cmd,
        data: request.data,
      });
    }
    return {
      status: 'ok',
    };
  },
  RESULT_VIDEOS_DATA: async (request) => {
    postMessage(request);
    return {
      status: 'ok',
    };
  },
  RESULT_CHECK_ELEMENT_VIDEO_SELECTED: async (request) => {
    postMessage({
      cmd: MESSAGE_TYPES.RESULT_CHECK_ELEMENT_VIDEO_SELECTED,
      data: request.data,
    });
    return {
      status: 'ok',
    };
  },
  CHECK_CONNECTION: async () => {
    return { message: 'connected' };
  },
};

const pageMessageHandlers = {
  ELEMENT_ACTION: (cmd, data) => {
    if (data.status == 'received') {
      sendMessage({ cmd, data }).catch((e) => {
        console.log(e);
      });
    }
  },
  CHECK_ELEMENT_VIDEO_SELECTED: (cmd, data) => {
    sendMessage({ cmd, data });
  },
  [MESSAGE_TYPES.GET_TABS]: async (cmd, data) => {
    const result = await sendMessage({ cmd, data });
    if (!result) return;
    postMessage(result);
  },
  [MESSAGE_TYPES.GET_VIDEOS_DATA]: async (cmd, data) => {
    await sendMessage({ cmd, data });
  },
  [MESSAGE_TYPES.ADD_EVENTS_ELEMENT]: async (cmd, data) => {
    await sendMessage({ cmd, data });
  },
};

window.addEventListener(
  'message',
  async function (event) {
    const msg = event.data;
    if (event.source != window) return;
    if (msg._isExtMsg) return;
    let { cmd, data } = msg;

    const handler = await pageMessageHandlers[cmd];
    if (handler) {
      handler(cmd, data);
    }
  },
  false
);

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  let handle = messageHandlers[request.cmd];

  if (handle) {
    handle(request, sender)
      .then((data) => {
        sendResponse(data);
      })
      .catch((err) => {
        sendResponse({ err });
      });

    return true;
  }
  sendResponse({ error: 'no existe tal accion' });
});

console.log('ahiseve app');
