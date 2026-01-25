import { MESSAGE_TYPES, MessageRequest } from './types/message';
import { postMessage, sendMessage } from './util';

// envia una señal de instancia de la web
sendMessage({
  cmd: MESSAGE_TYPES.APP_INSTANCE_ALIVE,
  tabId: chrome.runtime.id,
});

const messageHandlers = {
  [MESSAGE_TYPES.APP_INSTANCE_NOW_PRIMARY]: async () => {
    console.log(
      'Ahiseve extension:',
      'ahora la pestaña Ahiseve esta conectado a la extension'
    );
    console.log(
      'la extension solo puede conectarse con una pestaña de Ahiseve'
    );
    postMessage({
      cmd: MESSAGE_TYPES.APP_INSTANCE_NOW_PRIMARY,
    });
    return { status: 'ok' };
  },
  [MESSAGE_TYPES.APP_INSTANCE_LOST_PRIMARY]: async () => {
    console.log(
      'Ahiseve extension:',
      'esta pestaña dejo de ser la principal y se desconecto de la extension'
    );
    postMessage({ cmd: MESSAGE_TYPES.APP_INSTANCE_LOST_PRIMARY });
    return { status: 'ok' };
  },
  [MESSAGE_TYPES.ELEMENT_ACTION]: async (request: MessageRequest) => {
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
  [MESSAGE_TYPES.RESULT_VIDEOS_DATA]: async (request: MessageRequest) => {
    postMessage(request);
    return {
      status: 'ok',
    };
  },
  [MESSAGE_TYPES.CHECK_CONNECTION]: async () => {
    return { message: 'connected' };
  },
};

const pageMessageHandlers = {
  [MESSAGE_TYPES.ELEMENT_ACTION]: async ({ cmd, data }: MessageRequest) => {
    if (data.status == 'received') {
      sendMessage({ cmd, data }).catch((e) => {
        console.log(e);
      });
    }
  },
  [MESSAGE_TYPES.CHECK_ELEMENT_VIDEO_SELECTED]: async ({
    cmd,
    data,
  }: MessageRequest) => {
    const result = await sendMessage({ cmd, data });
    if (!result) return;
    postMessage(result);
  },
  [MESSAGE_TYPES.GET_TABS]: async ({ cmd, data }: MessageRequest) => {
    const result = await sendMessage({ cmd, data });
    if (!result) return;
    postMessage(result);
  },
  [MESSAGE_TYPES.GET_VIDEOS_DATA]: async ({ cmd, data }: MessageRequest) => {
    await sendMessage({ cmd, data });
  },
  [MESSAGE_TYPES.ADD_EVENTS_ELEMENT]: async ({ cmd, data }: MessageRequest) => {
    await sendMessage({ cmd, data });
  },
};

window.addEventListener(
  'message',
  async function (event) {
    const msg = event.data;
    if (event.source != window) return;
    if (msg._isExtMsg) return;

    const handler = pageMessageHandlers[msg.cmd];
    if (handler) {
      await handler(msg);
    }
  },
  false
);

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  let handle = messageHandlers[request.cmd];

  if (handle) {
    handle(request)
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
