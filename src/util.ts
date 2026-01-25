declare const browser: any;

export const sendMessage = (message: any) => {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError.message);
      } else {
        resolve(response);
      }
    });
  });
};

export const sendMessageTab = (tabId: number, message: any) => {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(Number(tabId), message, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError.message);
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

const iconCache: any = {};

const getIconDataUrl = async (favIconUrl: string | undefined) => {
  if (!favIconUrl) return '';

  if (iconCache[favIconUrl]) {
    return iconCache[favIconUrl];
  }

  try {
    const res = await fetch(favIconUrl);
    if (!res.ok) return '';

    const blob = await res.blob();
    const reader = new FileReader();
    const dataUrl = await new Promise((resolve) => {
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });

    iconCache[favIconUrl] = dataUrl;
    return dataUrl;
  } catch {
    return '';
  }
};

export const getTabs = () => {
  return new Promise((resolve, reject) => {
    try {
      chrome.tabs.query({}, function (tabs) {
        Promise.all(
          tabs.map(async (tab) => {
            const iconDataUrl = await getIconDataUrl(tab.favIconUrl);
            return {
              id: tab.id,
              favIconUrl: iconDataUrl,
              title: tab.title,
              url: tab.url,
            };
          })
        ).then((data) => resolve(data));
      });
    } catch (e) {
      console.log(e);
      reject(e);
    }
  });
};

export const getVideosData = (tabId: number, msg: any) => {
  //   console.log(tabId, 'tabid');
  return new Promise((resolve, reject) => {
    sendMessageTab(tabId, msg)
      .then((response) => {
        console.log('Mensaje enviado:', response);
        resolve(response);
      })
      .catch((error) => {
        console.log('Error al enviar mensaje:', error);

        const sx =
          typeof browser !== 'undefined' ? browser.scripting : chrome.scripting;

        sx.executeScript({
          target: {
            tabId: Number(tabId),
            allFrames: true,
          },
          files: ['content.js'],
        }).then(() => {
          console.log('script execute');

          sendMessageTab(tabId, msg)
            .then((response) => {
              console.log('Mensaje enviado:', response);
              resolve(response);
            })
            .catch((err) => {
              console.log('Error al enviar mensaje 2:', err);
              reject(err);
            });
        });
      });
  });
};
