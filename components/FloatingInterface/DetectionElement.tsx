'use client';
type DetectionElementProps = {
  isMinimized: boolean;
  isOpen: boolean;
};

export default function DetectionElement({
  isMinimized,
  isOpen,
}: DetectionElementProps) {
  return (
    <div className='px-4 '>
      <div
        className={`relative animate-interface-slide-in opacity-0 rounded-2xl backdrop-blur-md border border-muted shadow-2xl w-60 bg-[#141414f2] transition-all ${isMinimized ? 'p-5' : 'p-6'} ${isOpen ? 'animate-interface-slide-in' : 'animate-interface-slide-out'}`}
      >
        <div className={isMinimized ? 'relative z-1 mb-0' : 'mb-3'}>
          <p className='text-xs text-foreground font-semibold text-center'>
            Ponga a reproducir su video y lo detectaremos
          </p>
        </div>

        {/* Scanning animation */}
        <div
          className={`overflow-hidden rounded-lg  ${isMinimized ? 'animate-detection-element' : 'relative h-24 rounded-lg'} `}
        >
          <div
            className='absolute inset-0'
            style={{
              backgroundColor: isMinimized
                ? 'rgba(149, 149, 149, 0.05)'
                : 'rgba(149, 149, 149, 0.05)',
              backgroundImage: `linear-gradient(
                  90deg,            
                  rgba(149, 149, 149, 0.25),
                  transparent,
                  rgba(149, 149, 149, 0.25)           
                )`,
              backgroundSize: '200% 100%' /* espacio extra para moverse */,
              animation: 'scan 4s linear  infinite' /* lineal + infinito */,
            }}
          />

          {/* Scan lines */}
          <div className='absolute inset-0 flex flex-col justify-around opacity-30'>
            <div className='h-px bg-gradient-to-r from-transparent via-muted-foreground/20 to-transparent' />
            <div className='h-px bg-gradient-to-r from-transparent via-muted-foreground/20 to-transparent' />
            <div className='h-px bg-gradient-to-r from-transparent via-muted-foreground/20 to-transparent' />
          </div>

          {/* Center focus */}
          <div className='absolute inset-0 flex items-center justify-center'>
            <div
              className='w-8 h-8 rounded-full border-2'
              style={{
                borderColor: 'rgba(149, 149, 149, 0.5)',
                boxShadow: '0 0 12px rgba(149, 149, 149, 0.2)',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
