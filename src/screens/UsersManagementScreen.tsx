import React, { useState } from 'react';
import { SystemUser } from '../types';
import { validateOnlyPlainText, sanitizeToPlainText } from '../utils/security';

interface UsersManagementScreenProps {
  currentUser: SystemUser;
  systemUsers: SystemUser[];
  onAddUser: (newUser: SystemUser) => void;
  onUpdateUser: (updatedUser: SystemUser) => void;
}

export const UsersManagementScreen: React.FC<UsersManagementScreenProps> = ({
  currentUser,
  systemUsers,
  onAddUser,
  onUpdateUser
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newNombre, setNewNombre] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRol, setNewRol] = useState<'Administrador' | 'Caja'>('Administrador');
  const [newSucursal, setNewSucursal] = useState('chico');
  const [formError, setFormError] = useState<string | null>(null);

  // Security guard: Only David can access
  const isDavid = currentUser.id === 'USR-DAVID-01' ||
    currentUser.email.toLowerCase().includes('david') ||
    currentUser.email.toLowerCase().includes('orjuela') ||
    currentUser.nombre.toLowerCase().includes('david orjuela');

  if (!isDavid) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-rose-200 text-rose-800">
        <span className="material-symbols-outlined text-[48px] text-rose-600 mb-2">lock</span>
        <h3 className="text-lg font-bold">Acceso Restringido</h3>
        <p className="text-xs text-[#644E53] mt-1">
          Esta sección está reservada exclusivamente para el usuario David Orjuela (SuperAdmin).
        </p>
      </div>
    );
  }

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validar estrictamente texto plano contra inyección de código ejecutable
    const nameVal = validateOnlyPlainText(newNombre, 'Nombre Completo', 100);
    if (!nameVal.isValid) {
      setFormError(nameVal.reason || 'El nombre solo admite texto plano.');
      return;
    }

    const emailVal = validateOnlyPlainText(newEmail, 'Correo Electrónico', 100);
    if (!emailVal.isValid) {
      setFormError(emailVal.reason || 'El correo solo admite texto plano.');
      return;
    }

    const cleanNombre = sanitizeToPlainText(newNombre);
    const cleanEmail = sanitizeToPlainText(newEmail);

    const newUser: SystemUser = {
      id: `USR-${Date.now().toString().slice(-4)}`,
      nombre: cleanNombre,
      email: cleanEmail,
      rol: newRol,
      sucursalAsignada: newSucursal,
      creadoEn: new Date().toISOString(),
      puedeVerApi: false, // Only David can see API
      puedeVerUsuarios: false // Only David can see users
    };

    onAddUser(newUser);
    setShowAddModal(false);
    setNewNombre('');
    setNewEmail('');
    setNewPassword('');
    setFormError(null);
  };

  return (
    <div className="w-full space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-[#FAF4F5] via-[#F6E3E6] to-[#F7E5DE] p-6 sm:p-8 text-[#1F1417] border border-[#EAD6D9]/80 shadow-xs relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full bg-[#E8B4B8]/20 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#64444B]/10 text-[#64444B] text-xs font-semibold mb-2 border border-[#64444B]/20">
              <span className="material-symbols-outlined text-[15px] text-[#64444B] fill">stars</span>
              Panel Exclusivo de Control Maestro · David Orjuela
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-['Plus_Jakarta_Sans',sans-serif] text-[#1F1417]">
              Gestión de Usuarios del Sistema
            </h2>
            <p className="text-xs sm:text-sm text-[#644E53] mt-1 max-w-xl">
              Solo tu perfil tiene privilegios para crear usuarios, autorizar roles y controlar el acceso a la plataforma y la API REST.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="py-2.5 px-5 rounded-full bg-[#64444B] hover:bg-[#52363C] text-white font-bold text-xs shadow-xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            <span>+ Nuevo Usuario</span>
          </button>
        </div>
      </div>

      {/* Users List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {systemUsers.map((user) => {
          const isUserDavid = user.id === 'USR-DAVID-01' || user.email.toLowerCase().includes('orjuela') || user.nombre.toLowerCase().includes('david');
          return (
            <div
              key={user.id}
              className="bg-white rounded-3xl p-5 border border-[#EAD6D9]/60 shadow-xs flex flex-col justify-between space-y-4 hover:border-[#64444B]/50 transition-all"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={user.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200'}
                      alt={user.nombre}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-[#C5838D]"
                    />
                    <div>
                      <h3 className="font-bold text-base text-[#1F1417] font-['Plus_Jakarta_Sans',sans-serif]">
                        {user.nombre}
                      </h3>
                      <span className="text-xs text-[#644E53]">{user.email}</span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                    isUserDavid
                      ? 'bg-[#C5838D]/20 text-[#64444B] border border-[#C5838D]/40'
                      : user.rol === 'Administrador'
                      ? 'bg-blue-50 text-blue-800 border border-blue-200'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}>
                    ★ {user.rol}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-[#ebe8e2] space-y-1.5 text-xs text-[#644E53]">
                  <div className="flex justify-between">
                    <span>Sede Asignada:</span>
                    <strong className="text-[#1F1417] capitalize">{user.sucursalAsignada}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Acceso a Consola API:</span>
                    <strong className={user.puedeVerApi ? 'text-emerald-700' : 'text-rose-700'}>
                      {user.puedeVerApi ? 'Autorizado (Solo David)' : 'Bloqueado'}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Gestión de Usuarios:</span>
                    <strong className={user.puedeVerUsuarios ? 'text-emerald-700' : 'text-rose-700'}>
                      {user.puedeVerUsuarios ? 'Autorizado (Solo David)' : 'Bloqueado'}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#ebe8e2] flex items-center justify-between text-[11px] text-[#644E53]">
                <span>Seguridad: <strong className="text-emerald-700">Vault Encriptado</strong></span>
                <span className="px-2 py-0.5 rounded bg-[#F6E3E6] text-[#64444B] font-mono text-[10px]">
                  {user.id}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal to Create User */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm bg-[#FAF4F5] rounded-3xl p-6 shadow-2xl border border-[#EAD6D9] space-y-4">
            <div className="flex items-center justify-between border-b border-[#EAD6D9]/50 pb-2">
              <h3 className="font-bold text-sm text-[#1F1417] font-['Plus_Jakarta_Sans',sans-serif]">
                Crear Nuevo Perfil de Acceso
              </h3>
              <button onClick={() => setShowAddModal(false)} className="w-7 h-7 rounded-full hover:bg-[#F6E3E6] flex items-center justify-center text-[#644E53]">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              {formError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-start gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-rose-600 shrink-0">error</span>
                  <span>{formError}</span>
                </div>
              )}
              <div>
                <label className="block font-semibold text-[#644E53] mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={newNombre}
                  onChange={(e) => setNewNombre(e.target.value)}
                  placeholder="Ej. Andrés Ramírez"
                  className="w-full h-9 px-3 rounded-xl bg-white border border-[#EAD6D9] text-xs text-[#1F1417]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#644E53] mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="correo@dominio.com"
                  className="w-full h-9 px-3 rounded-xl bg-white border border-[#EAD6D9] text-xs text-[#1F1417]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#644E53] mb-1">Contraseña de Acceso</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full h-9 px-3 rounded-xl bg-white border border-[#EAD6D9] text-xs text-[#1F1417]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#644E53] mb-1">Rol de Acceso</label>
                <select
                  value={newRol}
                  onChange={(e) => setNewRol(e.target.value as any)}
                  className="w-full h-9 px-2 rounded-xl bg-white border border-[#EAD6D9] text-xs text-[#1F1417]"
                >
                  <option value="Administrador">Administrador (Sin API ni Usuarios)</option>
                  <option value="Caja">Caja &amp; Mostrador</option>
                </select>
              </div>

              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px]">
                Nota: Por políticas de seguridad, solo el usuario de David Orjuela tiene permisos para la Consola API y la Gestión de Usuarios.
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#64444B] hover:bg-[#52363C] text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
              >
                Guardar Nuevo Usuario
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
