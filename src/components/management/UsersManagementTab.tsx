import React from 'react';
import { SystemUser } from '../../types';

interface UsersManagementTabProps {
  systemUsers: SystemUser[];
  currentUserId: string;
  onOpenCreateModal: () => void;
  onEditUser: (user: SystemUser) => void;
  onDeleteUser: (user: SystemUser) => void;
}

export const UsersManagementTab: React.FC<UsersManagementTabProps> = ({
  systemUsers,
  currentUserId,
  onOpenCreateModal,
  onEditUser,
  onDeleteUser
}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#EAD6D9]/70 shadow-2xs">
        <div>
          <h3 className="font-bold text-base text-[#1F1417] font-['Plus_Jakarta_Sans',sans-serif]">
            Personal y Cuentas de Acceso ({systemUsers.length})
          </h3>
          <p className="text-xs text-[#644E53]">
            Cuentas con permisos para libro de citas, cobros de caja menor y arqueos diarios.
          </p>
        </div>
        <button
          onClick={onOpenCreateModal}
          className="px-4 py-2 rounded-full bg-[#64444B] hover:bg-[#52363C] text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <span className="material-symbols-outlined text-[16px]">person_add</span>
          <span>+ Nuevo Usuario</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {systemUsers.map((user) => {
          const isMaster = user.id === 'USR-DAVID-01' || user.rol === 'SuperAdmin';
          const isSelf = user.id === currentUserId;

          return (
            <div
              key={user.id}
              className="bg-white rounded-2xl p-5 border border-[#EAD6D9]/70 shadow-2xs flex flex-col justify-between space-y-4 hover:border-[#64444B]/40 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={user.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200'}
                      alt={user.nombre}
                      className="w-11 h-11 rounded-full object-cover ring-2 ring-[#C5838D]/50 shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-[#1F1417] font-['Plus_Jakarta_Sans',sans-serif] truncate">
                        {user.nombre}
                      </h4>
                      <span className="text-xs text-[#644E53] truncate block">{user.email}</span>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase shrink-0 ${
                      user.rol === 'SuperAdmin'
                        ? 'bg-[#C5838D]/20 text-[#64444B] border border-[#C5838D]/40'
                        : user.rol === 'Administrador'
                        ? 'bg-blue-50 text-blue-800 border border-blue-200'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    ★ {user.rol}
                  </span>
                </div>

                <div className="mt-3.5 pt-3 border-t border-[#ebe8e2] space-y-1.5 text-xs text-[#644E53]">
                  <div className="flex justify-between">
                    <span>Sede Asignada:</span>
                    <strong className="text-[#1F1417] capitalize">{user.sucursalAsignada}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Consola API:</span>
                    <strong className={user.puedeVerApi ? 'text-emerald-700' : 'text-[#644E53]'}>
                      {user.puedeVerApi ? 'Habilitado' : 'Sin acceso'}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Gestión Total:</span>
                    <strong className={user.puedeVerUsuarios ? 'text-emerald-700' : 'text-[#644E53]'}>
                      {user.puedeVerUsuarios ? 'Habilitado' : 'Sin acceso'}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#ebe8e2] flex items-center justify-between text-xs">
                <span className="font-mono text-[10px] text-[#8C767B] bg-[#F6E3E6]/60 px-1.5 py-0.5 rounded">
                  {user.id}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onEditUser(user)}
                    className="p-1.5 rounded-lg bg-white hover:bg-[#F6E3E6] text-[#64444B] border border-[#EAD6D9] transition-colors cursor-pointer flex items-center gap-1"
                    title="Modificar Usuario"
                  >
                    <span className="material-symbols-outlined text-[15px]">edit</span>
                    <span className="text-[11px] font-semibold pr-0.5">Editar</span>
                  </button>

                  {!isMaster && !isSelf && (
                    <button
                      onClick={() => onDeleteUser(user)}
                      className="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-[#ba1a1a] border border-rose-200 transition-colors cursor-pointer flex items-center gap-1"
                      title="Eliminar Usuario"
                    >
                      <span className="material-symbols-outlined text-[15px]">delete</span>
                      <span className="text-[11px] font-semibold pr-0.5">Eliminar</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
