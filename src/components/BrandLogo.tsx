import React from 'react';

interface BrandLogoProps {
  className?: string;
  /** Alto en pixeles (el ancho se ajusta solo para no deformar el logo). */
  size?: number;
}

// Logo oficial de La Pelu SPA (public/logo-la-pelu-icono.webp, 192 x 192 px; se recorta en circulo desde el Header)
export const BrandLogo: React.FC<BrandLogoProps> = ({ className = 'h-9 sm:h-10 w-auto', size }) => {
  return (
    <img
      src={`${import.meta.env.BASE_URL}logo-la-pelu-icono.webp`}
      alt="La Pelu SPA"
      width={192}
      height={192}
      decoding="async"
      className={className}
      style={size ? { height: size, width: 'auto' } : undefined}
    />
  );
};
