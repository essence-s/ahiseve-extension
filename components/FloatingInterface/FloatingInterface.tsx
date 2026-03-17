'use client';
import { useEffect, useRef, useState } from 'preact/compat';
import DetectionElement from './DetectionElement';
import ResultsPanel from './ResultsPanel';
import { MESSAGE_TYPES, type MessageRequest } from '../../types/message';
import { type Video } from './types/FloatingInterface';

// const mockVideos: Video[] = [
//   {
//     number: '1',
//     title: 'Documentario Tech',
//     duration: 231,
//     img: '',
//     frameId: 2,
//   },
//   { number: '2', title: 'Tutorial Diseño', duration: 312, img: '', frameId: 4 },
// ];

export default function FloatingInterface() {
  const [isVisible, setIsVisible] = useState(false);
  const [videos, setVideos] = useState([] as Video[]);
  const [isOpen, setIsOpen] = useState(true);
  const [shouldRender, setShouldRender] = useState(true);
  const videosPackages = useRef({} as any);
  const interval: any = useRef();
  const timerId2: any = useRef();

  const handleSelectedVideo = (video: Video) => {
    // console.log('handleSelect');

    browser.runtime.sendMessage({
      cmd: MESSAGE_TYPES.ADD_EVENTS_ELEMENT,
      data: {
        number: video.number,
        img: video.img,
        frameId: video.frameId,
      },
    });
    setIsVisible(false);
    cleanInterval();
    clearTimeout(timerId2.current);

    // setTimeout(() => {
    //   setIsVisible(true);
    //   setIsOpen(true);
    //   setShouldRender(true);
    //   handleInteractive();
    // }, 10000);
  };

  const handleClose = () => {
    setIsOpen(false);
    cleanInterval();
    setTimeout(() => {
      setShouldRender(false);
    }, 300);
  };

  const createInterval = () => {
    cleanInterval();
    browser.runtime.sendMessage({
      cmd: MESSAGE_TYPES.GET_VIDEOS_DATA,
    });
    interval.current = setInterval(() => {
      // console.log('intervalooo');
      if (!browser.runtime?.id) {
        setIsVisible(false);
        cleanInterval();
        clearTimeout(timerId2.current);
        return;
      }
      browser.runtime.sendMessage({
        cmd: MESSAGE_TYPES.GET_VIDEOS_DATA,
      });
    }, 1800);

    return () => clearInterval(interval.current);
  };

  const cleanInterval = () => clearInterval(interval.current);

  const handleInteractive = () => {
    // console.log('interacty');
    if (timerId2.current) clearTimeout(timerId2.current);
    timerId2.current = setTimeout(() => {
      handleClose();
    }, 15000);
  };

  useEffect(() => {
    // setTimeout(() => {
    //   setVideos(mockVideos);
    // }, 1500);
    // console.log('ui');

    const messageHandlers = {
      [MESSAGE_TYPES.RESULT_VIDEOS_DATA]: async (request: MessageRequest) => {
        const videosPackageID = request.data.videosPackageID;
        const videosPackage = request.data.videos;
        videosPackages.current[videosPackageID] = videosPackage;

        setVideos(Object.values(videosPackages.current).flat() as Video[]);
        return {
          status: 'ok',
        };
      },
      [MESSAGE_TYPES.CHECK_CONNECTION_UI]: async () => {
        setIsVisible(true);
        setIsOpen(true);
        setShouldRender(true);
        handleInteractive();
        createInterval();
        return {
          status: 'ok',
        };
      },
      [MESSAGE_TYPES.HIDDEN_UI]: async () => {
        setIsVisible(false);
        cleanInterval();
        clearTimeout(timerId2.current);
      },
      // [MESSAGE_TYPES.SAVE_TAB_INFO]: async (request:MessageRequest) => {
      //  console.log(request)
      // },
    };

    browser.runtime.onMessage.addListener(function (request, _, sendResponse) {
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
      return false;
      // sendResponse({ addScript: addScriptOnce() });
    });

    const timerId = setTimeout(() => {
      setIsVisible(true);
    }, 400);

    createInterval();
    handleInteractive();

    return () => {
      cleanInterval();
      clearTimeout(timerId);
      clearTimeout(timerId2.current);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className={`dark text-foreground fixed bottom-40 right-2 flex flex-col gap-0.5 font-inter z-999`}
      onClick={handleInteractive}
      onMouseMove={handleInteractive}
    >
      {shouldRender ? (
        <>
          {videos?.length > 0 && (
            <ResultsPanel
              videos={videos}
              onVideoSelect={handleSelectedVideo}
              onClose={handleClose}
              isOpen={isOpen}
            />
          )}
          <DetectionElement isMinimized={videos.length > 0} isOpen={isOpen} />
        </>
      ) : (
        <button
          class='animate-interface-slide-in p-2.5 rounded-full transition-all duration-300 bg-[#141414f2] border border-[#353535] relative bottom-76 right-7.5 group'
          onClick={() => {
            setIsOpen(true);
            setShouldRender(true);
            createInterval();
          }}
          aria-label='Close results panel'
        >
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width='24'
            height='24'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            stroke-width='2'
            stroke-linecap='round'
            stroke-linejoin='round'
            // class='lucide lucide-panel-right-close-icon lucide-panel-right-close'
            className='w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors duration-300 rotate-180'
          >
            <rect width='18' height='18' x='3' y='3' rx='2' />
            <path d='M15 3v18' />
            <path d='m8 9 3 3-3 3' />
          </svg>
        </button>
      )}
    </div>
  );
}
