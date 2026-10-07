import React from 'react';

interface ReservaBannerProps {
  onExplorar?: () => void;
}

const BASE = import.meta.env.BASE_URL;
const ICON = (f: string) => `${BASE}icons/${f}`;

// Banner de "Reserva de Turno": imagen de fondo + texto y botones reales encima.
// Escritorio: proporción 3285 x 718 y medidas en cqw (escalan con el ancho). Celular: tarjeta 366 x 291.
export const ReservaBanner: React.FC<ReservaBannerProps> = ({ onExplorar }) => {
  const btn = 'inline-flex items-center justify-center gap-[0.8cqw] sm:gap-[0.6cqw] rounded-full uppercase tracking-[0.06em] sm:tracking-[0.16em] font-["Poppins",sans-serif] cursor-pointer transition-colors';
  return (
    <div className="relative overflow-hidden rounded-3xl border border-[#C6BDAC] shadow-xs bg-[#CEB5A4] text-[#110F0E] [container-type:inline-size]">
      <picture>
        <source media="(max-width: 639px)" srcSet={`${BASE}banner-reserva-movil.webp`} />
        <img src={`${BASE}banner-reserva-escritorio.webp`} alt="" aria-hidden="true" width={2600} height={568} className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
      </picture>
      <div className="relative z-10 aspect-[366/205] sm:aspect-[3285/718]">
        <h1 className="absolute left-[6.5cqw] top-[6cqw] sm:left-[9.2cqw] sm:top-[4cqw] leading-[1.05] font-['Poppins',sans-serif] font-semibold tracking-[-0.04em] text-[6.6cqw] sm:text-[4.29cqw]">
          UN MOMENTO<br className="sm:hidden" /> <span className="font-['Cormorant_Garamond',serif] italic font-light tracking-normal text-[7.6cqw] sm:text-[5.28cqw]">solo para ti</span>
        </h1>
        <p className="absolute left-[6.5cqw] top-[23cqw] w-[54cqw] sm:w-auto sm:left-[9.2cqw] sm:top-[10.2cqw] font-['Poppins',sans-serif] text-[2.9cqw] sm:text-[1.53cqw] leading-snug">
          Uñas que reflejan tu estilo y un espacio para disfrutar del cuidado que mereces
        </p>
        <div className="absolute left-[6.5cqw] right-[6.5cqw] bottom-[5cqw] sm:right-auto sm:left-[9.2cqw] sm:bottom-auto sm:top-[14cqw] flex gap-[2.5cqw] sm:gap-[3.6cqw]">
          {onExplorar && (
            <button type="button" onClick={onExplorar} className={`${btn} border border-[#110F0E] bg-transparent hover:bg-[#F1EDE8]/40 h-[9.5cqw] sm:h-[4.2cqw] flex-1 sm:flex-none sm:w-[29cqw] max-w-[62cqw] sm:max-w-none text-[2.6cqw] sm:text-[1.5cqw]`}>
              <img src={ICON('icono-servicios.svg')} alt="" aria-hidden="true" className="w-[4.6cqw] h-[4.6cqw] sm:w-[2.2cqw] sm:h-[2.2cqw]" />
              Explorar servicios
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

