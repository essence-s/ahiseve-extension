import { MESSAGE_TYPES, MessageRequest } from './types/message';
import { sendMessage } from './util';

// let isApply = false

function eventQueue() {
  let events = [];
  let executing = false;

  const addEvent = async (event: any) => {
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

function handlePlay() {
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
function handlePause() {
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

function handleSeeking(event: Event) {
  // console.log(event)
  // if (isApply) return isApply = false
  // setTimeout(() => {
  const media = event.target as HTMLMediaElement | null;
  if (!media) return;
  sendMessage({
    cmd: MESSAGE_TYPES.ELEMENT_ACTION,
    data: {
      action: 'seeked',
      status: 'sending',
      mediaCurrentTime: media.currentTime,
    },
  }).catch((e) => {
    console.log(e);
  });
  // }, 3000)
}

function addEventsElement(element: HTMLVideoElement) {
  // console.log('in addEven')
  element.addEventListener('play', handlePlay);
  element.addEventListener('pause', handlePause);
  element.addEventListener('seeking', handleSeeking);
}

function removeEventsElement(element: HTMLVideoElement) {
  element.removeEventListener('seeking', handleSeeking);
  element.removeEventListener('play', handlePlay);
  element.removeEventListener('pause', handlePause);
}

function notGenerateEvent(
  targetElement: any,
  eventElement: any,
  functionElement: any,
  callback: any
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

function obtenerImagenPrevia(videoun: HTMLVideoElement) {
  try {
    videoun.crossOrigin = 'anonymous';
    let canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 56;

    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;
    ctx.drawImage(videoun, 0, 0, canvas.width, canvas.height);
    let previewImage = canvas.toDataURL('image/png');
    return previewImage;
  } catch (e) {
    console.log(e);
  }
}

type foundVideoType = {
  number: string;
  img: string | undefined;
  element: HTMLVideoElement;
  duration: number;
};

let foundVideos: foundVideoType[] = [];
function getVideosPage() {
  let videos = document.querySelectorAll('video');
  const arrayvideos = Array.from(videos).map((videoun, i) => {
    let previewImage = obtenerImagenPrevia(videoun);

    return {
      number: generarID(),
      img: previewImage,
      element: videoun,
      duration: videoun.duration,
    };
  });

  foundVideos = arrayvideos;
  // console.log(arrayvideos)
  // lo que realmente envio a ahiseve
  return arrayvideos.map((v) => ({
    number: v.number,
    img: v.img,
    duration: v.duration,
  }));
}

const messageHandlers = {
  [MESSAGE_TYPES.ELEMENT_ACTION]: async (request: MessageRequest) => {
    if (request.data.status == 'received') {
      // console.log('recived ult 567', request)
      let foundElementVideo = foundVideos.find(
        (d) => d.number == request.data.number
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
    }

    return {
      status: 'ok',
    };
  },
  [MESSAGE_TYPES.GET_VIDEOS_DATA]: async (request: MessageRequest) => {
    // getdataPrueba()
    let dataImageVideos = getVideosPage();
    // console.log(dataImageVideos);
    // sendResponse(dataImageVideos);
    sendMessage({
      ...request,
      cmd: MESSAGE_TYPES.RESULT_VIDEOS_DATA,
      data: dataImageVideos,
    });
    return {
      status: 'ok',
    };
  },
  [MESSAGE_TYPES.ADD_EVENTS_ELEMENT]: async (request: MessageRequest) => {
    // console.log('founVi', foundVideos)
    let foundElementVideo = foundVideos.find(
      (d) => d.number == request.data.number
    );
    if (foundElementVideo) {
      console.log('addEvents', request);
      addEventsElement(foundElementVideo.element);
    }
    return {
      status: 'ok',
    };
  },
  [MESSAGE_TYPES.REMOVE_EVENTS_ELEMENTS]: async (request: MessageRequest) => {
    let foundElementVideo = foundVideos.find(
      (d) => d.number == request.data.number
    );
    if (foundElementVideo) {
      console.log('Remove Events', request);
      removeEventsElement(foundElementVideo.element);
    }
    return {
      status: 'ok',
    };
  },
  [MESSAGE_TYPES.CHECK_CONNECTION]: async () => {
    return { message: 'connected' };
  },
};

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

console.log('ahiseve page');
