import React, { useState, useEffect } from 'react';
import { SystemUser } from '../../types';
import { validateOnlyPlainText, sanitizeToPlainText } from '../../utils/security';
import { BUSINESS_CONFIG } from '../../config/businessConfig';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  userToEdit?: SystemUser | null;
  onSave: (user: SystemUser) => void;
}

export const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  onClose,
  userToEdit,
  onSave
}) => {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [rol, setRol] = useState<'SuperAdmin' | 'Administrador' | 'Caja'>('Caja');
  const [sucursal, setSucursal] = useState('chico');
  const [avatar, setAvatar] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (userToEdit) {
      setNombre(userToEdit.nombre);
      setEmail(userToEdit.email);
      setRol(userToEdit.rol);
      setSucursal(userToEdit.sucursalAsignada || 'chico');
      setAvatar(userToEdit.avatar || '');
      setFormError(null);
    } else {
      setNombre('');
      setEmail('');
      setRol('Caja');
      setSucursal('chico');
      setAvatar('');
      setFormError(null);
    }
  }, [userToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const nameVal = validateOnlyPlainText(nombre, 'Nombre Completo', 100);
    if (!nameVal.isValid) {
      setFormError(nameVal.reason || 'Nombre inválido.');
      return;
    }

    const emailVal = validateOnlyPlainText(email, 'Correo', 100);
    if (!emailVal.isValid) {
      setFormError(emailVal.reason || 'Correo inválido.');
      return;
    }

    const cleanNombre = sanitizeToPlainText(nombre);
    const cleanEmail = sanitizeToPlainText(email).toLowerCase();
    const cleanAvatar = sanitizeToPlainText(avatar);

    const user: SystemUser = {
      id: userToEdit ? userToEdit.id : `USR-${Date.now().toString().slice(-4)}`,
      nombre: cleanNombre,
      email: cleanEmail,
      rol,
      sucursalAsignada: sucursal,
      avatar: cleanAvatar || (rol === 'SuperAdmin'
        ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200'
        : 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200'),
      creadoEn: userToEdit?.creadoEn || new Date().toISOString(),
      puedeVerApi: rol === 'SuperAdmin',
      puedeVerUsuarios: rol === 'SuperAdmin'
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
              {userToEdit ? `Editar Usuario: ${userToEdit.nombre}` : 'Registrar Perfil de Usuario'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-[#C6BDAC]/40 flex items-center justify-center text-[#5A4A43] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-2">
          <span className="material-symbols-outlined text-[16px] text-amber-700 shrink-0 mt-0.5">info</span>
          <div>
            <strong>Nota de Acceso:</strong> Esta lista gestiona los perfiles locales. Para otorgar credenciales de inicio de sesión reales, crea la cuenta en la consola de Firebase Authentication y vincula el UID correspondiente en Firestore.
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
                onChange={(e) => setRol(e.target.value as any)}
                className="w-full h-9 px-2 rounded-xl bg-white border border-[#C6BDAC] text-xs text-[#2B2420] focus:outline-none focus:ring-2 focus:ring-[#2B2420]/20"
              >
                <option value="SuperAdmin">SuperAdmin (Maestro)</option>
                <option value="Administrador">Administrador</option>
                <option value="Caja">Cajero / Recepción</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#5A4A43] mb-1">Sede Asignada *</label>
              <select
                value={sucursal}
                onChange={(e) => setSucursal(e.target.value)}
                className="w-full h-9 px-2 rounded-xl bg-white border border-[#C6BDAC] text-xs text-[#2B2420] focus:outline-none focus:ring-2 focus:ring-[#2B2420]/20"
              >
                <option value="todas">Todas las Sedes</option>
                <option value="chico">{BUSINESS_CONFIG.branchName}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#5A4A43] mb-1">URL de Foto / Avatar</label>
            <input
              type="url"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              placeholder="https://..."
              className="w-full h-9 px-3 rounded-xl bg-white border border-[#C6BDAC] text-xs text-[#2B2420] focus:outline-none focus:ring-2 focus:ring-[#2B2420]/20"
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
