import { MESSAGE_TYPES } from './types';
import { sendMessage } from './util';

// let isApply = false

function eventQueue() {
  let events = [];
  let executing = false;

  const addEvent = async (event) => {
    events.push(event);
    if (!executing) {
      executing = true;
      while (events.length) {
        await events.shift()();
      }
      executing = false;
    }
  };
  return addEvent;
}

let queue = eventQueue();

function handlePlay(event) {
  // console.log(event)
  // setTimeout(() => {
  sendMessage({
    cmd: MESSAGE_TYPES.ELEMENT_ACTION,
    data: {
      action: 'play',
      status: 'sending',
    },
  }).catch((e) => {
    console.log(e);
  });
  // }, 1000)
}
function handlePause(event) {
  // console.log(event)
  // setTimeout(() => {
  sendMessage({
    cmd: MESSAGE_TYPES.ELEMENT_ACTION,
    data: {
      action: 'pause',
      status: 'sending',
    },
  }).catch((e) => {
    console.log(e);
  });
  // }, 1000)
}

function handleSeeking(event) {
  // console.log(event)
  // if (isApply) return isApply = false
  // setTimeout(() => {
  sendMessage({
    cmd: MESSAGE_TYPES.ELEMENT_ACTION,
    data: {
      action: 'seeked',
      status: 'sending',
      mediaCurrentTime: event.target.currentTime,
    },
  }).catch((e) => {
    console.log(e);
  });
  // }, 3000)
}

function addEventsElement(element) {
  // console.log('in addEven')
  element.addEventListener('play', handlePlay);
  element.addEventListener('pause', handlePause);
  element.addEventListener('seeking', handleSeeking);
}

function removeEventsElement(element) {
  element.removeEventListener('seeking', handleSeeking);
  element.removeEventListener('play', handlePlay);
  element.removeEventListener('pause', handlePause);
}

function notGenerateEvent(
  targetElement,
  eventElement,
  functionElement,
  callback
) {
  return new Promise((resolve) => {
    if (eventElement == 'pause' && targetElement.paused == true)
      return resolve('no genero evento con exito');
    if (eventElement == 'play' && targetElement.paused == false)
      return resolve('no genero evento con exito');

    targetElement.removeEventListener(eventElement, functionElement);
    const eventG = () => {
      targetElement.addEventListener(eventElement, functionElement);
      targetElement.removeEventListener(eventElement, eventG);
      // console.log(8)
      resolve('no genero evento con exito');
    };
    // console.log('no generate event')
    targetElement.addEventListener(eventElement, eventG);
    callback();
  });
}

function generarID() {
  const caracteres =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const longitudID = 8;

  let idGenerado = '';
  for (let i = 0; i < longitudID; i++) {
    const indiceAleatorio = Math.floor(Math.random() * caracteres.length);
    idGenerado += caracteres.charAt(indiceAleatorio);
  }

  return idGenerado;
}

function obtenerImagenPrevia(videoun) {
  try {
    videoun.crossOrigin = 'anonymous';
    let canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 56;
    canvas
      .getContext('2d')
      .drawImage(videoun, 0, 0, canvas.width, canvas.height);
    let previewImage = canvas.toDataURL('image/png');
    return previewImage;
  } catch (e) {
    console.log(e);
  }
}

let foundVideos = [];
function getVideosPage() {
  let videos = document.querySelectorAll('video');
  const arrayvideos = Array.from(videos).map((videoun, i) => {
    let previewImage = obtenerImagenPrevia(videoun);

    return {
      number: generarID(),
      img: previewImage,
      element: videoun,
    };
  });

  foundVideos = arrayvideos;
  // console.log(arrayvideos)

  return arrayvideos.map((v) => ({ number: v.number, img: v.img }));
}

const messageHandlers = {
  ELEMENT_ACTION: (request) => {
    if (request.data.status == 'received') {
      // console.log('recived ult 567', request)
      let foundElementVideo = foundVideos.find(
        (d) => d.number == request.data.idNumber
      );
      if (foundElementVideo) {
        let mediaElement = foundElementVideo.element;
        if (request.data.action == 'play') {
          queue(async () => {
            await notGenerateEvent(mediaElement, 'play', handlePlay, () => {
              foundElementVideo.element.play();
            });
          });
        } else if (request.data.action == 'pause') {
          queue(async () => {
            await notGenerateEvent(mediaElement, 'pause', handlePause, () => {
              foundElementVideo.element.pause();
            });
          });
        } else if (request.data.action == 'seeked') {
          queue(async () => {
            await notGenerateEvent(
              mediaElement,
              'seeking',
              handleSeeking,
              () => {
                if (request.data.dataSeek) {
                  mediaElement.currentTime = Math.max(
                    0,
                    mediaElement.currentTime + request.data.dataSeek
                  );
                } else {
                  mediaElement.currentTime = Math.max(
                    0,
                    request.data.mediaCurrentTime
                  );
                }
              }
            );
          });
        }
      }
    } else if (request.data.status == 'sending') {
      window.postMessage(
        {
          cmd: request.cmd,
          data: request.data,
        },
        '*'
      );
    }

    // sendResponse('ok')
    return {
      status: 'ok',
    };
  },
  GET_VIDEOS_DATA: () => {
    // getdataPrueba()
    let dataImageVideos = getVideosPage();
    // console.log(dataImageVideos)
    sendMessage({ cmd: 'responseIMGS', data: dataImageVideos });
    return {
      status: 'ok',
    };
  },
  RESULT_CHECK_ELEMENT_VIDEO_SELECTED: (request) => {
    window.postMessage(
      {
        cmd: MESSAGE_TYPES.RESULT_CHECK_ELEMENT_VIDEO_SELECTED,
        data: request.data,
      },
      '*'
    );
    return {
      status: 'ok',
    };
  },
  ADD_EVENTS_ELEMENT: (request) => {
    // console.log('founVi', foundVideos)
    let foundElementVideo = foundVideos.find(
      (d) => d.number == request.data.idNumber
    );
    if (foundElementVideo) {
      console.log('addEvents', request);
      addEventsElement(foundElementVideo.element);
    }
    return {
      status: 'ok',
    };
  },
  REMOVE_EVENTS_ELEMENTS: (request) => {
    let foundElementVideo = foundVideos.find(
      (d) => d.number == request.data.idNumber
    );
    if (foundElementVideo) {
      console.log('Remove Events', request);
      removeEventsElement(foundElementVideo.element);
    }
    return {
      status: 'ok',
    };
  },
  CHECK_CONNECTION: () => {
    return { message: 'connected' };
  },
};

const pageMessageHandlers = {
  ELEMENT_ACTION: (cmd, data) => {
    // console.log('elemt action ', cmd, data)
    if (data.status == 'received') {
      sendMessage({ cmd, data }).catch((e) => {
        console.log(e);
      });
    }
  },
  CHECK_ELEMENT_VIDEO_SELECTED: (cmd, data) => {
    sendMessage({ cmd, data });
  },
};

window.addEventListener(
  'message',
  function (event) {
    if (event.source != window) return;
    let { cmd, data } = event.data;

    const handler = pageMessageHandlers[cmd];
    if (handler) {
      handler(cmd, data);
    }
    // console.log('todo ok')
  },
  false
);

chrome.runtime.onMessage.addListener(async function (
  request,
  sender,
  sendResponse
) {
  let handle = messageHandlers[request.cmd];

  if (handle) {
    try {
      sendResponse(await handle(request, sender));
    } catch (err) {
      sendResponse({ err });
    }

    return true;
  }
  sendResponse({ error: 'no existe tal accion' });
});

// chrome.runtime.sendMessage({ data: "Mensaje desde la página" }, (response) => {
//     console.log(response);
// });

console.log('media-element-selection-extension');
