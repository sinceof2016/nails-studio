import React, { useState } from 'react';
import { Specialist, SystemUser } from '../types';
import { compressImageFile } from '../utils/imageCompressor';

interface SpecialistModalProps {
  specialist: Specialist | null;
  onClose: () => void;
  onBookWithSpecialist: (specialist: Specialist) => void;
  currentUser?: SystemUser | null;
  onUpdateSpecialistAvatar?: (specialistId: string, newAvatar: string) => void;
  onOpenLogin?: () => void;
}

export const SpecialistModal: React.FC<SpecialistModalProps> = ({
  specialist,
  onClose,
  onBookWithSpecialist,
  currentUser,
  onUpdateSpecialistAvatar,
  onOpenLogin
}) => {
  const [uploading, setUploading] = useState(false);

  if (!specialist) return null;

  const isSuperAdmin = currentUser?.rol === 'SuperAdmin';

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUpdateSpecialistAvatar) return;

    try {
      setUploading(true);
      const compressed = await compressImageFile(file, 400, 400);
      onUpdateSpecialistAvatar(specialist.id, compressed);
    } catch (err) {
      console.warn('Error subiendo foto local de especialista:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md bg-[#F4EFE9] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col z-10 animate-in slide-in-from-bottom duration-300">
        {/* Grab handle for touch ergonomics */}
        <div className="w-12 h-1.5 bg-[#d4c2c3] rounded-full mx-auto mt-3 mb-1 shrink-0" />

        {/* Header bar */}
        <div className="px-5 pt-2 pb-3 flex items-center justify-between border-b border-[#C6BDAC]/20">
          <span className="text-xs uppercase tracking-wider text-[#5A4A43] font-semibold font-['Plus_Jakarta_Sans',sans-serif]">
            Perfil de Especialista
          </span>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-[#ebe8e2] flex items-center justify-center text-[#5A4A43] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto px-5 py-4 space-y-4">
          {/* Avatar and basic info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div className="relative">
                <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-[#C6BDAC] ring-offset-2 ring-offset-[#F4EFE9] bg-[#C6BDAC]/40">
                  <img
                    src={specialist.avatar}
                    alt={specialist.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span
                  className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-[#52b788] ring-2 ring-white"
                  title="Disponible hoy"
                />
              </div>

              {/* SuperAdmin: Subir foto de perfil desde archivo local */}
              {isSuperAdmin && onUpdateSpecialistAvatar && (
                <label className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#2B2420] hover:bg-black text-white text-[10px] font-bold shadow-xs transition-all select-none">
                  <span className="material-symbols-outlined text-[13px]">
                    {uploading ? 'sync' : 'photo_camera'}
                  </span>
                  <span>{uploading ? 'Cargando...' : '📷 Subir foto local'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploading}
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                </label>
              )}

              {!isSuperAdmin && onOpenLogin && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenLogin();
                  }}
                  className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F4EFE9] border border-[#C6BDAC] hover:bg-[#C6BDAC]/40 text-[#2B2420] text-[9px] font-semibold transition-all select-none"
                  title="Inicia sesión con rol SuperAdmin para cambiar esta foto desde tu equipo"
                >
                  <span className="material-symbols-outlined text-[12px]">photo_camera</span>
                  <span>Cambiar foto</span>
                </button>
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#2B2420] font-['Plus_Jakarta_Sans',sans-serif]">
                {specialist.name}
              </h3>
              <p className="text-xs font-semibold text-[#5A4A43]">
                {specialist.role}
              </p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="material-symbols-outlined text-[#5A4A43] text-[16px] fill">
                  star
                </span>
                <span className="text-xs font-bold text-[#2B2420]">
                  {specialist.rating}
                </span>
                <span className="text-xs text-[#5A4A43]">
                  ({specialist.reviewsCount} reseñas verificadas)
                </span>
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="p-3.5 rounded-2xl bg-white/80 border border-[#C6BDAC]/30 shadow-sm">
            <h4 className="text-xs font-semibold text-[#2B2420] mb-1 font-['Plus_Jakarta_Sans',sans-serif]">
              Sobre mí
            </h4>
            <p className="text-xs text-[#5A4A43] leading-relaxed">
              {specialist.bio}
            </p>
          </div>

          {/* Specialties */}
          <div>
            <h4 className="text-xs font-semibold text-[#2B2420] mb-2 font-['Plus_Jakarta_Sans',sans-serif]">
              Especialidades Destacadas
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {specialist.specialties.map((spec, i) => (
                <span
                  key={i}
                  className="text-xs px-2.5 py-1 rounded-full bg-[#C6BDAC]/30 text-[#2B2420] font-medium border border-[#C6BDAC]/50"
                >
                  {spec}
                </span>
              ))}
            </div>
          </div>

          {/* Certifications */}
          <div>
            <h4 className="text-xs font-semibold text-[#2B2420] mb-2 font-['Plus_Jakarta_Sans',sans-serif]">
              Certificaciones &amp; Higiene
            </h4>
            <div className="space-y-1.5">
              {specialist.certifications.map((cert, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-[#5A4A43]">
                  <span className="material-symbols-outlined text-[#52b788] text-[16px]">
                    verified
                  </span>
                  <span>{cert}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Days available */}
          <div className="p-3 rounded-2xl bg-[#F4EFE9] border border-[#C6BDAC]">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#2B2420] mb-1 font-['Plus_Jakarta_Sans',sans-serif]">
              <span className="material-symbols-outlined text-[16px] text-[#5A4A43]">
                calendar_month
              </span>
              Días de atención en salón
            </div>
            <div className="flex flex-wrap gap-1 text-[11px] text-[#5A4A43]">
              {specialist.availableDays.map((day, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-md bg-white border border-[#C6BDAC] font-medium"
                >
                  {day}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="p-4 bg-white/90 border-t border-[#C6BDAC]/20 flex gap-2">
          <button
            onClick={() => {
              onBookWithSpecialist(specialist);
              onClose();
            }}
            className="w-full py-3 px-4 rounded-full bg-primary hover:bg-[#AA8A74] text-on-primary font-bold text-sm shadow-xs active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Reservar Cita con {specialist.name}</span>
            <span className="material-symbols-outlined text-[18px]">
              calendar_add_on
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
