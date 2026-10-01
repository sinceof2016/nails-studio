import React, { useState, useEffect } from 'react';
import { Specialist } from '../../types';
import { validateOnlyPlainText, sanitizeToPlainText } from '../../utils/security';

interface SpecialistFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  specialistToEdit?: Specialist | null;
  onSave: (specialist: Specialist) => void;
}

const ALL_WEEK_DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export const SpecialistFormModal: React.FC<SpecialistFormModalProps> = ({
  isOpen,
  onClose,
  specialistToEdit,
  onSave
}) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('Master Manicurista');
  const [avatar, setAvatar] = useState('');
  const [commissionRate, setCommissionRate] = useState<number>(50);
  const [bio, setBio] = useState('');
  const [specialtiesText, setSpecialtiesText] = useState('');
  const [certificationsText, setCertificationsText] = useState('');
  const [availableDays, setAvailableDays] = useState<string[]>(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (specialistToEdit) {
      setName(specialistToEdit.name);
      setRole(specialistToEdit.role);
      setAvatar(specialistToEdit.avatar || '');
      setCommissionRate(specialistToEdit.commissionRate ?? 50);
      setBio(specialistToEdit.bio || '');
      setSpecialtiesText((specialistToEdit.specialties || []).join(', '));
      setCertificationsText((specialistToEdit.certifications || []).join(', '));
      setAvailableDays(specialistToEdit.availableDays || ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']);
      setFormError(null);
    } else {
      setName('');
      setRole('Master Manicurista');
      setAvatar('https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200');
      setCommissionRate(50);
      setBio('Especialista certificada en técnicas avanzadas de manicura, estructura y cuidado holístico de manos.');
      setSpecialtiesText('Manicura Rusa, Glazed Nails, Kapping');
      setCertificationsText('Certified Russian Manicure Master, Hospital-Grade Sterilization');
      setAvailableDays(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']);
      setFormError(null);
    }
  }, [specialistToEdit, isOpen]);

  if (!isOpen) return null;

  const handleToggleDay = (day: string) => {
    setAvailableDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const nameVal = validateOnlyPlainText(name, 'Nombre de la Especialista', 80);
    if (!nameVal.isValid) {
      setFormError(nameVal.reason || 'Nombre inválido.');
      return;
    }

    if (commissionRate < 0 || commissionRate > 100) {
      setFormError('La tasa de comisión debe estar entre 0% y 100%.');
      return;
    }

    if (availableDays.length === 0) {
      setFormError('Selecciona al menos un día disponible para agendamiento.');
      return;
    }

    const cleanName = sanitizeToPlainText(name);
    const idSlug = specialistToEdit
      ? specialistToEdit.id
      : cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 20) || `spec-${Date.now().toString().slice(-4)}`;

    const specialties = specialtiesText
      .split(',')
      .map((s) => sanitizeToPlainText(s))
      .filter((s) => s.length > 0);

    const certifications = certificationsText
      .split(',')
      .map((s) => sanitizeToPlainText(s))
      .filter((s) => s.length > 0);

    const specialist: Specialist = {
      id: idSlug,
      name: cleanName,
      role: sanitizeToPlainText(role) || 'Master Manicurista',
      rating: specialistToEdit ? specialistToEdit.rating : 5.0,
      reviewsCount: specialistToEdit ? specialistToEdit.reviewsCount : 0,
      avatar: sanitizeToPlainText(avatar) || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
      bio: sanitizeToPlainText(bio),
      certifications: certifications.length > 0 ? certifications : ['Técnica Certificada en Manicura'],
      availableDays,
      specialties: specialties.length > 0 ? specialties : ['Manicura Rusa', 'Esmaltado Semipermanente'],
      commissionRate: Number(commissionRate) || 50
    };

    onSave(specialist);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-[#FAF4F5] rounded-3xl p-6 shadow-2xl border border-[#EAD6D9] space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#EAD6D9]/50 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#64444B]/10 text-[#64444B] flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">brush</span>
            </div>
            <h3 className="font-bold text-sm sm:text-base text-[#1F1417] font-['Plus_Jakarta_Sans',sans-serif]">
              {specialistToEdit ? `Editar Manicurista: ${specialistToEdit.name}` : 'Registrar Nueva Manicurista'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-[#F6E3E6] flex items-center justify-center text-[#644E53] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {formError && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-start gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-rose-600 shrink-0">error</span>
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#644E53] mb-1">Nombre Completo / Firma *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Valentina R."
                className="w-full h-9 px-3 rounded-xl bg-white border border-[#EAD6D9] text-xs text-[#1F1417] focus:outline-none focus:ring-2 focus:ring-[#64444B]/20"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#644E53] mb-1">Cargo / Especialidad *</label>
              <input
                type="text"
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Ej. Master Manicurista Rusa"
                className="w-full h-9 px-3 rounded-xl bg-white border border-[#EAD6D9] text-xs text-[#1F1417] focus:outline-none focus:ring-2 focus:ring-[#64444B]/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#644E53] mb-1">Comisión (%) para Liquidación *</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(Number(e.target.value))}
                  placeholder="50"
                  className="w-full h-9 px-3 rounded-xl bg-white border border-[#EAD6D9] text-xs text-[#1F1417] focus:outline-none focus:ring-2 focus:ring-[#64444B]/20"
                />
                <span className="absolute right-3 top-2 text-xs text-[#644E53] font-bold">%</span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#644E53] mb-1">URL de Foto de Perfil</label>
              <input
                type="url"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="https://..."
                className="w-full h-9 px-3 rounded-xl bg-white border border-[#EAD6D9] text-xs text-[#1F1417] focus:outline-none focus:ring-2 focus:ring-[#64444B]/20"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#644E53] mb-1.5">Días Disponibles para Citas</label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_WEEK_DAYS.map((day) => {
                const isSelected = availableDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleToggleDay(day)}
                    className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#64444B] text-white shadow-2xs'
                        : 'bg-white text-[#644E53] border border-[#EAD6D9] hover:bg-[#F6E3E6]/60'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#644E53] mb-1">Especialidades (separadas por coma)</label>
            <input
              type="text"
              value={specialtiesText}
              onChange={(e) => setSpecialtiesText(e.target.value)}
              placeholder="Manicura Rusa, Glazed Nails, Kapping Gel, Soft Gel"
              className="w-full h-9 px-3 rounded-xl bg-white border border-[#EAD6D9] text-xs text-[#1F1417] focus:outline-none focus:ring-2 focus:ring-[#64444B]/20"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#644E53] mb-1">Certificaciones (separadas por coma)</label>
            <input
              type="text"
              value={certificationsText}
              onChange={(e) => setCertificationsText(e.target.value)}
              placeholder="Russian Manicure Master E.Mi, Esterilización Hospitalaria"
              className="w-full h-9 px-3 rounded-xl bg-white border border-[#EAD6D9] text-xs text-[#1F1417] focus:outline-none focus:ring-2 focus:ring-[#64444B]/20"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#644E53] mb-1">Biografía Profesional</label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Experiencia, trayectoria, enfoque en salud ungueal..."
              className="w-full p-2.5 rounded-xl bg-white border border-[#EAD6D9] text-xs text-[#1F1417] focus:outline-none focus:ring-2 focus:ring-[#64444B]/20"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#EAD6D9]/50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white hover:bg-neutral-100 text-[#644E53] font-semibold text-xs border border-[#EAD6D9] cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#64444B] hover:bg-[#52363C] text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
            >
              {specialistToEdit ? 'Guardar Cambios' : 'Registrar Manicurista'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
