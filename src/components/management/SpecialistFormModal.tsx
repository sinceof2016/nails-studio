import React, { useState, useEffect } from 'react';
import { Specialist } from '../../types';
import { validateAndClean, validateColombianPhone } from '../../utils/security';
import { compressImageFile } from '../../utils/imageCompressor';
import { DEFAULT_COMMISSION_RATE } from '../../config/businessConfig';

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
  const [phone, setPhone] = useState('');
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
      setPhone(specialistToEdit.phone || specialistToEdit.telefono || '');
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
      setPhone('');
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

    const nameRes = validateAndClean(name, 'Nombre de la Especialista', 80);
    if (!nameRes.ok) {
      setFormError(nameRes.error || 'Nombre inválido.');
      return;
    }
    if (!nameRes.value.trim()) {
      setFormError('El nombre de la especialista es obligatorio.');
      return;
    }

    const roleRes = validateAndClean(role, 'Cargo o Rol', 60);
    if (!roleRes.ok) {
      setFormError(roleRes.error || 'Cargo inválido.');
      return;
    }

    const bioRes = validateAndClean(bio, 'Biografía', 500);
    if (!bioRes.ok) {
      setFormError(bioRes.error || 'Biografía inválida.');
      return;
    }

    const avatarRes = validateAndClean(avatar, 'Avatar', 150000);
    if (!avatarRes.ok) {
      setFormError(avatarRes.error || 'Avatar inválido.');
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

    let cleanPhone = '';
    if (phone.trim()) {
      const phoneCheck = validateColombianPhone(phone);
      if (!phoneCheck.isValid) {
        setFormError(phoneCheck.reason || 'Teléfono no válido.');
        return;
      }
      cleanPhone = phone.replace(/\D/g, '').slice(-10);
    }

    const cleanName = nameRes.value;
    const idSlug = specialistToEdit
      ? specialistToEdit.id
      : cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 20) || `spec-${Date.now().toString().slice(-4)}`;

    const cleanSpecialties: string[] = [];
    for (const s of specialtiesText.split(',')) {
      const trimmed = s.trim();
      if (!trimmed) continue;
      const specRes = validateAndClean(trimmed, 'Especialidad', 60);
      if (!specRes.ok) {
        setFormError(specRes.error || 'Especialidad inválida.');
        return;
      }
      cleanSpecialties.push(specRes.value);
    }

    const cleanCertifications: string[] = [];
    for (const c of certificationsText.split(',')) {
      const trimmed = c.trim();
      if (!trimmed) continue;
      const certRes = validateAndClean(trimmed, 'Certificación', 80);
      if (!certRes.ok) {
        setFormError(certRes.error || 'Certificación inválida.');
        return;
      }
      cleanCertifications.push(certRes.value);
    }

    const specialist: Specialist = {
      id: idSlug,
      name: cleanName,
      role: roleRes.value || 'Master Manicurista',
      rating: specialistToEdit ? specialistToEdit.rating : 5.0,
      reviewsCount: specialistToEdit ? specialistToEdit.reviewsCount : 0,
      avatar: avatarRes.value || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
      bio: bioRes.value,
      certifications: cleanCertifications.length > 0 ? cleanCertifications : ['Técnica Certificada en Manicura'],
      availableDays,
      specialties: cleanSpecialties.length > 0 ? cleanSpecialties : ['Manicura Rusa', 'Esmaltado Semipermanente'],
      commissionRate: Number.isFinite(Number(commissionRate)) ? Number(commissionRate) : DEFAULT_COMMISSION_RATE,
      phone: cleanPhone || undefined,
      telefono: cleanPhone || undefined
    };

    onSave(specialist);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-[#F4EFE9] rounded-3xl p-6 shadow-2xl border border-[#C6BDAC] space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#C6BDAC]/50 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#BB9C87]/10 text-[#2B2420] flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">brush</span>
            </div>
            <h3 className="font-bold text-sm sm:text-base text-[#2B2420] font-['Plus_Jakarta_Sans',sans-serif]">
              {specialistToEdit ? `Editar Manicurista: ${specialistToEdit.name}` : 'Registrar Nueva Manicurista'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-[#C6BDAC]/40 flex items-center justify-center text-[#5A4A43] cursor-pointer"
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
              <label className="block font-semibold text-[#5A4A43] mb-1">Nombre Completo / Firma *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Valentina R."
                className="w-full h-9 px-3 rounded-xl bg-white border border-[#C6BDAC] text-xs text-[#2B2420] focus:outline-none focus:ring-2 focus:ring-[#2B2420]/20"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#5A4A43] mb-1">Cargo / Especialidad *</label>
              <input
                type="text"
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Ej. Master Manicurista Rusa"
                className="w-full h-9 px-3 rounded-xl bg-white border border-[#C6BDAC] text-xs text-[#2B2420] focus:outline-none focus:ring-2 focus:ring-[#2B2420]/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#5A4A43] mb-1">Comisión (%) para Liquidación *</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(Number(e.target.value))}
                  placeholder="50"
                  className="w-full h-9 px-3 rounded-xl bg-white border border-[#C6BDAC] text-xs text-[#2B2420] focus:outline-none focus:ring-2 focus:ring-[#2B2420]/20"
                />
                <span className="absolute right-3 top-2 text-xs text-[#5A4A43] font-bold">%</span>
              </div>
            </div>

            <div>
              <label htmlFor="specialist-phone" className="block font-semibold text-[#5A4A43] mb-1">
                Teléfono / WhatsApp (privado)
              </label>
              <input
                id="specialist-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ej. 3101234567"
                maxLength={15}
                className="w-full h-9 px-3 rounded-xl bg-white border border-[#C6BDAC] text-xs text-[#2B2420] focus:outline-none focus:ring-2 focus:ring-[#2B2420]/20"
              />
              <p className="text-[10px] text-[#5A4A43] mt-0.5">
                Uso interno exclusivo del personal para avisar turnos por WhatsApp. No es visible para clientes.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block font-semibold text-[#5A4A43]">Foto de Perfil</label>
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-[#C6BDAC]">
              <img
                src={avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200'}
                alt="Vista previa"
                className="w-12 h-12 rounded-full object-cover shrink-0 border border-[#C6BDAC] ring-2 ring-[#BB9C87]/30"
              />
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center gap-2">
                  <label className="px-3 py-1.5 rounded-xl bg-[#F4EFE9] hover:bg-[#C6BDAC]/40 text-[#2B2420] border border-[#C6BDAC] font-bold text-[11px] cursor-pointer inline-flex items-center gap-1.5 transition-all shadow-2xs">
                    <span className="material-symbols-outlined text-[15px]">upload_file</span>
                    <span>Subir archivo local</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const optimized = await compressImageFile(file, 400, 400);
                            setAvatar(optimized);
                          } catch (err: unknown) {
                            setFormError(err instanceof Error ? err.message : 'Error al procesar la imagen local.');
                          }
                        }
                      }}
                    />
                  </label>
                  {avatar && (
                    <button
                      type="button"
                      onClick={() => setAvatar('')}
                      className="px-2 py-1.5 rounded-xl hover:bg-rose-50 text-rose-700 text-[11px] font-semibold flex items-center gap-0.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[14px]">delete</span>
                      <span>Quitar</span>
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="O pega una URL: https://..."
                  className="w-full h-8 px-2.5 rounded-lg bg-[#F4EFE9]/60 border border-[#C6BDAC]/70 text-[11px] text-[#2B2420] focus:outline-none focus:ring-1 focus:ring-[#2B2420]/30"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#5A4A43] mb-1">Días Disponibles para Citas</label>
            <p className="text-[11px] text-[#5A4A43] mb-2 leading-relaxed">
              Los días de descanso fijos (Dayana y Natalia: miércoles; Geraldine: lunes; Diana: sin día fijo) y la rotación dominical de la agenda mandan sobre los días seleccionados aquí.
            </p>
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
                        ? 'bg-[#BB9C87] text-[#2B2420] font-bold shadow-2xs'
                        : 'bg-white text-[#5A4A43] border border-[#C6BDAC] hover:bg-[#C6BDAC]/40/60'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#5A4A43] mb-1">Especialidades (separadas por coma)</label>
            <input
              type="text"
              value={specialtiesText}
              onChange={(e) => setSpecialtiesText(e.target.value)}
              placeholder="Manicura Rusa, Glazed Nails, Kapping Gel, Soft Gel"
              className="w-full h-9 px-3 rounded-xl bg-white border border-[#C6BDAC] text-xs text-[#2B2420] focus:outline-none focus:ring-2 focus:ring-[#2B2420]/20"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#5A4A43] mb-1">Certificaciones (separadas por coma)</label>
            <input
              type="text"
              value={certificationsText}
              onChange={(e) => setCertificationsText(e.target.value)}
              placeholder="Russian Manicure Master E.Mi, Esterilización Hospitalaria"
              className="w-full h-9 px-3 rounded-xl bg-white border border-[#C6BDAC] text-xs text-[#2B2420] focus:outline-none focus:ring-2 focus:ring-[#2B2420]/20"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#5A4A43] mb-1">Biografía Profesional</label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Experiencia, trayectoria, enfoque en salud ungueal..."
              className="w-full p-2.5 rounded-xl bg-white border border-[#C6BDAC] text-xs text-[#2B2420] focus:outline-none focus:ring-2 focus:ring-[#2B2420]/20"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#C6BDAC]/50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white hover:bg-neutral-100 text-[#5A4A43] font-semibold text-xs border border-[#C6BDAC] cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#BB9C87] hover:bg-[#AA8A74] text-[#2B2420] font-bold font-bold text-xs shadow-xs transition-all cursor-pointer"
            >
              {specialistToEdit ? 'Guardar Cambios' : 'Registrar Manicurista'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
