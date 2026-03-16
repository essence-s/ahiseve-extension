'use client';

import type { Video } from './types/FloatingInterface';

type ResultsPanelProps = {
  videos: Video[];
  onVideoSelect: (video: Video) => void;
  onClose: () => void;
  isOpen: boolean;
};

const formatTime = (seconds: number) => {
  const totalSeconds = Math.round(seconds);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return h > 0
    ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    : `${m}:${s.toString().padStart(2, '0')}`;
};

export default function ResultsPanel({
  videos,
  onVideoSelect,
  onClose,
  isOpen,
}: ResultsPanelProps) {
  return (
    <div className='w-full px-4 sm:w-auto'>
      <div
        className={`opacity-0 backdrop-blur-md relative rounded-2xl border border-muted p-4 shadow-2xl mx-auto sm:mx-0 flex flex-col overflow-hidden h-70 w-60 bg-[#141414f2] ${isOpen ? 'animate-interface-slide-in' : 'animate-interface-slide-out'}`}
      >
        <div className='flex justify-between mb-3'>
          <div className=''>
            <h2 className='text-xs font-semibold text-foreground'>
              Videos Detectados
            </h2>
            <p className='text-xs text-muted-foreground mt-0.5'>
              {videos.length ? videos.length : 0} encontrados
            </p>
          </div>
          <button
            class='p-1.5 rounded-lg transition-all duration-300 hover:bg-muted/40 group'
            onClick={onClose}
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
              className='w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors duration-300'
            >
              <rect width='18' height='18' x='3' y='3' rx='2' />
              <path d='M15 3v18' />
              <path d='m8 9 3 3-3 3' />
            </svg>
          </button>
        </div>

        <div className='flex-1 overflow-y-auto space-y-1.5 pr-1'>
          {videos && videos.length > 0
            ? videos.map((video, index) => (
                <div
                  key={video.number}
                  className='group cursor-pointer flex-shrink-0'
                  onClick={() => onVideoSelect(video)}
                  style={{
                    animation: `fade-in-scale 0.5s ease-out`,
                    animationDelay: `${index * 0.1}s`,
                    animationFillMode: 'both',
                  }}
                >
                  {/* Video card - Mini */}
                  <div
                    className='relative rounded-lg overflow-hidden
                  border border-muted transition-all duration-300
                  hover:border-accent hover:shadow-lg flex gap-2'
                    style={{
                      backgroundColor: 'rgba(40, 40, 40, 0.5)',
                      padding: '0.5rem',
                    }}
                  >
                    {/* Thumbnail area - Mini */}
                    <div
                      className='relative w-2/4 h-14 flex-shrink-0 flex items-center justify-center
                    overflow-hidden group-hover:bg-opacity-80 transition-all duration-300 rounded-md'
                    >
                      {/* Overlay gradient */}
                      <div
                        className='absolute inset-0'
                        style={{
                          background:
                            'linear-gradient(0deg, rgba(0, 0, 0, 0.87) 0%, rgba(0, 0, 0, 0.11) 100%)',
                        }}
                      />

                      <img
                        src={video.img}
                        className='object-cover w-full h-full'
                        alt={video.number}
                      />
                      {/* Play button */}
                      <div
                        className='absolute z-10 backdrop-blur-[2px] flex items-center justify-center w-5 h-5 rounded-full group-hover:scale-110 transition-transform duration-300'
                        style={{
                          backgroundColor: 'rgba(149, 149, 149, 0.2)',
                          border: '1.5px solid rgba(149, 149, 149, 0.4)',
                        }}
                      >
                        <div
                          className='w-0 h-0'
                          style={{
                            borderLeft: '5px solid rgb(149, 149, 149)',
                            borderTop: '3.5px solid transparent',
                            borderBottom: '3.5px solid transparent',
                            marginLeft: '1px',
                          }}
                        />
                      </div>

                      {/* Duration badge */}
                      <div className='absolute bottom-0.5 right-0.5 px-1 py-0.5 rounded text-[9.6px] font-medium text-foreground backdrop-blur-sm leading-none bg-[#141414e6]'>
                        {formatTime(video.duration)}
                      </div>
                    </div>

                    {/* Info section */}
                    <div className='flex-1 min-w-0'>
                      <h3 className='text-xs font-medium text-foreground truncate'>
                        {video.number}
                      </h3>
                      <p className='text-xs text-muted-foreground truncate'>
                        Detectado
                      </p>
                    </div>
                  </div>
                </div>
              ))
            : 'no encontrados'}
        </div>
      </div>
    </div>
  );
}
