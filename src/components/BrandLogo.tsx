import React from 'react';

interface BrandLogoProps {
  className?: string;
  /** Alto en pixeles (el ancho se ajusta solo para no deformar el logo). */
  size?: number;
}

// Logo oficial de La Pelu SPA (public/logo-la-pelu-400.webp, 400 x 306 px, con esquinas transparentes)
export const BrandLogo: React.FC<BrandLogoProps> = ({ className = 'h-9 sm:h-10 w-auto', size }) => {
  return (
    <img
      src={`${import.meta.env.BASE_URL}logo-la-pelu-400.webp`}
      alt="La Pelu SPA"
      width={400}
      height={306}
      decoding="async"
      className={className}
      style={size ? { height: size, width: 'auto' } : undefined}
    />
  );
};
