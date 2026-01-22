export const sendMessage = (message) => {
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

export const sendMessageTab = (tabId, message) => {
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

export const postMessage = (request) => {
  window.postMessage(
    // {
    //   _isExtMsg: true,
    //   body: request,
    // },
    request,
    '*'
  );
};

const iconCache = {};

const getIconDataUrl = async (favIconUrl) => {
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

export const getVideosData = (tabId, msg) => {
  //   console.log(tabId, 'tabid');
  return new Promise((resolve, reject) => {
    sendMessageTab(parseInt(tabId), msg)
      .then((response) => {
        console.log('Mensaje enviado:', response);
        resolve(response);
      })
      .catch((error) => {
        console.log('Error al enviar mensaje:', error);
        browser.scripting
          .executeScript({
            target: {
              tabId: parseInt(tabId),
              allFrames: true,
            },
            files: ['content.js'],
          })
          .then(() => {
            console.log('script injected in all jaus');

            sendMessageTab(parseInt(tabId), msg)
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
