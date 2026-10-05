import React, { useState, useEffect } from 'react';
import { SystemUser } from '../../types';
import { validateAndClean, validateEmail } from '../../utils/security';
import { BUSINESS_CONFIG } from '../../config/businessConfig';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  userToEdit?: SystemUser | null;
  currentUserId?: string;
  onSave: (user: SystemUser) => void;
}

export const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  onClose,
  userToEdit,
  currentUserId,
  onSave
}) => {
  const [uid, setUid] = useState('');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [rol, setRol] = useState<'SuperAdmin' | 'Administrador' | 'Caja'>('Caja');
  const [sucursal, setSucursal] = useState('santuario-patio-bonito');
  const [avatar, setAvatar] = useState('');
  const [puedeVerApi, setPuedeVerApi] = useState(false);
  const [puedeVerUsuarios, setPuedeVerUsuarios] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isSelf = Boolean(userToEdit && currentUserId && userToEdit.id === currentUserId);

  useEffect(() => {
    if (userToEdit) {
      setUid(userToEdit.id);
      setNombre(userToEdit.nombre);
      setEmail(userToEdit.email);
      setRol(userToEdit.rol);
      setSucursal(userToEdit.sucursalAsignada || 'santuario-patio-bonito');
      setAvatar(userToEdit.avatar || '');
      setPuedeVerApi(Boolean(userToEdit.puedeVerApi || userToEdit.rol === 'SuperAdmin'));
      setPuedeVerUsuarios(Boolean(userToEdit.puedeVerUsuarios || userToEdit.rol === 'SuperAdmin'));
      setFormError(null);
    } else {
      setUid('');
      setNombre('');
      setEmail('');
      setRol('Caja');
      setSucursal('santuario-patio-bonito');
      setAvatar('');
      setPuedeVerApi(false);
      setPuedeVerUsuarios(false);
      setFormError(null);
    }
  }, [userToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const uidClean = validateAndClean(uid, 'UID de Firebase Authentication', 128);
    if (!uidClean.ok) {
      setFormError(uidClean.error || 'UID inválido.');
      return;
    }
    const cleanUid = uidClean.value.trim();
    if (!cleanUid) {
      setFormError('El UID de Firebase Authentication es obligatorio.');
      return;
    }

    const nameClean = validateAndClean(nombre, 'Nombre Completo', 100);
    if (!nameClean.ok) {
      setFormError(nameClean.error || 'Nombre inválido.');
      return;
    }
    if (!nameClean.value.trim()) {
      setFormError('El nombre completo es obligatorio.');
      return;
    }

    const emailCheck = validateEmail(email, 'Correo', 100);
    if (!emailCheck.isValid) {
      setFormError(emailCheck.reason || 'Correo inválido.');
      return;
    }

    const avatarClean = validateAndClean(avatar, 'Avatar', 150000);
    if (!avatarClean.ok) {
      setFormError(avatarClean.error || 'Avatar inválido.');
      return;
    }

    const cleanNombre = nameClean.value;
    const cleanEmail = email.trim().toLowerCase();
    const cleanAvatar = avatarClean.value;

    const user: SystemUser = {
      id: cleanUid,
      nombre: cleanNombre,
      email: cleanEmail,
      rol: isSelf ? 'SuperAdmin' : rol,
      sucursalAsignada: sucursal,
      avatar: cleanAvatar || (rol === 'SuperAdmin'
        ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200'
        : 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200'),
      creadoEn: userToEdit?.creadoEn || new Date().toISOString(),
      puedeVerApi: isSelf || rol === 'SuperAdmin' ? true : puedeVerApi,
      puedeVerUsuarios: isSelf || rol === 'SuperAdmin' ? true : puedeVerUsuarios
    };

    onSave(user);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-[#F4EFE9] rounded-3xl p-6 shadow-2xl border border-[#C6BDAC] space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#C6BDAC]/50 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#BB9C87]/10 text-[#2B2420] flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">
                {userToEdit ? 'manage_accounts' : 'person_add'}
              </span>
            </div>
            <h3 className="font-bold text-sm sm:text-base text-[#2B2420] font-['Plus_Jakarta_Sans',sans-serif]">
              {userToEdit ? `Editar Perfil: ${userToEdit.nombre}` : 'Registrar Perfil en Firestore (users/{uid})'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-[#C6BDAC]/40 flex items-center justify-center text-[#5A4A43] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="p-3 rounded-2xl bg-amber-50/90 border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-2">
          <span className="material-symbols-outlined text-[16px] text-amber-700 shrink-0 mt-0.5">info</span>
          <div>
            <strong>Paso Previo:</strong> Crea primero la cuenta con correo y contraseña en Firebase Authentication, copia su <strong>UID</strong> y pégalo aquí para vincular su perfil y permisos.
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {formError && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-start gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-rose-600 shrink-0">error</span>
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-[#5A4A43] mb-1">
              UID de Firebase Authentication * {userToEdit ? '(Inmutable)' : ''}
            </label>
            <input
              type="text"
              required
              disabled={Boolean(userToEdit)}
              value={uid}
              onChange={(e) => setUid(e.target.value)}
              placeholder="Ej. w2J8b4XyZ9a0KlmNoPqRstUvwX"
              className="w-full h-9 px-3 rounded-xl bg-white border border-[#C6BDAC] text-xs text-[#2B2420] font-mono focus:outline-none focus:ring-2 focus:ring-[#2B2420]/20 disabled:bg-neutral-100 disabled:text-neutral-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#5A4A43] mb-1">Nombre Completo *</label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Carolina Medina"
              className="w-full h-9 px-3 rounded-xl bg-white border border-[#C6BDAC] text-xs text-[#2B2420] focus:outline-none focus:ring-2 focus:ring-[#2B2420]/20"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#5A4A43] mb-1">Correo Electrónico *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@ejemplo.com"
              className="w-full h-9 px-3 rounded-xl bg-white border border-[#C6BDAC] text-xs text-[#2B2420] focus:outline-none focus:ring-2 focus:ring-[#2B2420]/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#5A4A43] mb-1">Rol de Acceso *</label>
              <select
                value={rol}
                disabled={isSelf}
                onChange={(e) => {
                  const newRol = e.target.value as 'SuperAdmin' | 'Administrador' | 'Caja';
                  setRol(newRol);
                  if (newRol === 'SuperAdmin') {
                    setPuedeVerApi(true);
                    setPuedeVerUsuarios(true);
                  }
                }}
                className="w-full h-9 px-2 rounded-xl bg-white border border-[#C6BDAC] text-xs text-[#2B2420] focus:outline-none focus:ring-2 focus:ring-[#2B2420]/20 disabled:bg-neutral-100 disabled:text-neutral-500"
              >
                <option value="SuperAdmin">SuperAdmin (Maestro)</option>
                <option value="Administrador">Administrador</option>
                <option value="Caja">Cajero / Recepción</option>
              </select>
              {isSelf && (
                <span className="text-[10px] text-amber-700 block mt-0.5">
                  No puedes removerte tu propio rol SuperAdmin.
                </span>
              )}
            </div>

            <div>
              <label className="block font-semibold text-[#5A4A43] mb-1">Sede Asignada *</label>
              <select
                value={sucursal}
                onChange={(e) => setSucursal(e.target.value)}
                className="w-full h-9 px-2 rounded-xl bg-white border border-[#C6BDAC] text-xs text-[#2B2420] focus:outline-none focus:ring-2 focus:ring-[#2B2420]/20"
              >
                <option value="todas">Todas las Sedes</option>
                <option value="santuario-patio-bonito">{BUSINESS_CONFIG.branchName}</option>
              </select>
            </div>
          </div>

          {/* Permisos Especiales */}
          <div className="space-y-2 p-3 rounded-2xl bg-white border border-[#C6BDAC]/60">
            <span className="block font-semibold text-[#2B2420] text-[11px]">Permisos Adicionales</span>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rol === 'SuperAdmin' || puedeVerApi}
                disabled={rol === 'SuperAdmin'}
                onChange={(e) => setPuedeVerApi(e.target.checked)}
                className="w-4 h-4 rounded text-[#BB9C87] border-[#C6BDAC] focus:ring-[#BB9C87]"
              />
              <span className="text-[#5A4A43] text-[11px]">Permitir ver consola de pruebas / API</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rol === 'SuperAdmin' || puedeVerUsuarios}
                disabled={rol === 'SuperAdmin'}
                onChange={(e) => setPuedeVerUsuarios(e.target.checked)}
                className="w-4 h-4 rounded text-[#BB9C87] border-[#C6BDAC] focus:ring-[#BB9C87]"
              />
              <span className="text-[#5A4A43] text-[11px]">Permitir gestionar usuarios del sistema</span>
            </label>
          </div>

          <div className="space-y-1.5">
            <label className="block font-semibold text-[#5A4A43]">Foto de Perfil / Avatar</label>
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-[#C6BDAC]">
              <img
                src={avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
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
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            if (typeof event.target?.result === 'string') {
                              setAvatar(event.target.result);
                            }
                          };
                          reader.readAsDataURL(file);
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
              className="px-5 py-2 rounded-xl bg-[#BB9C87] hover:bg-[#AA8A74] text-[#2B2420] font-bold text-xs shadow-xs transition-all cursor-pointer"
            >
              {userToEdit ? 'Guardar Cambios' : 'Registrar Perfil'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
