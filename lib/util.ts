import { MESSAGE_TYPES, MessageRequest } from '../types/message';

export const sendMessage = (message: any) => {
  return new Promise((resolve, reject) => {
    browser.runtime.sendMessage(message, (response) => {
      if (browser.runtime.lastError) {
        reject(browser.runtime.lastError.message);
      } else {
        resolve(response);
      }
    });
  });
};

export const sendMessageTab = (
  tabId: number,
  message: MessageRequest,
  options?: Browser.tabs.MessageSendOptions
) => {
  return new Promise((resolve, reject) => {
    browser.tabs.sendMessage(Number(tabId), message, options, (response) => {
      if (browser.runtime.lastError) {
        reject(browser.runtime.lastError.message);
      } else {
        resolve(response);
      }
    });
  });
};

export const postMessage = (request: any) => {
  window.postMessage(
    // {
    //   _isExtMsg: true,
    //   body: request,
    // },
    request,
    '*'
  );
};

export const getVideosData = (tabId: number, msg: any) => {
  //   console.log(tabId, 'tabid');
  return new Promise((resolve, reject) => {
    browser.webNavigation.getAllFrames({ tabId }, (frames) => {
      frames?.forEach((frame) => {
        const addScriptGetVideosData = () => {
          browser.scripting
            .executeScript({
              target: {
                tabId: Number(tabId),
                frameIds: [frame.frameId],
                // allFrames: true,
              },
              files: ['/content-scripts/content.js'],
            })
            .then(() => {
              // console.log('script execute', frame.frameId);

              sendMessageTab(tabId, msg, { frameId: frame.frameId })
                .then((response) => {
                  // console.log('Mensaje enviado:', response);
                  resolve(response);
                })
                .catch((err) => {
                  console.log('Error al enviar mensaje 2:', err);
                  reject(err);
                });
            });
        };
        sendMessageTab(tabId, msg, { frameId: frame.frameId })
          .then((response: any) => {
            if (response) {
              resolve(response);
            } else {
              addScriptGetVideosData();
            }
          })
          .catch((error) => {
            console.log('Error al enviar mensaje:', error);
            addScriptGetVideosData();
          });
      });
    });
  });
};

export const InitScriptInAppContent = (urls: string[]) => {
  browser.tabs.query(
    {
      url: urls,
    },
    (tabs) => {
      tabs.forEach((tab) => {
        const tabId = tab.id;
        if (!tabId) return;
        sendMessageTab(tabId, { cmd: MESSAGE_TYPES.CHECK_CONNECTION })
          .then((response: any) => {
            if (response.message == 'connected') {
              console.log(response, 'ya esta conectado');
            }
          })
          .catch((err) => {
            browser.scripting
              .executeScript({
                target: { tabId: tabId },
                files: ['/content-scripts/app-content.js'],
              })
              .then(() => {
                console.log('script execute app-content');
              });
          });
      });
    }
  );
};
