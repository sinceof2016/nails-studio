import React, { useState } from 'react';
import { SystemUser, Service, ServiceCategory, Specialist } from '../types';
import { UsersManagementTab } from '../components/management/UsersManagementTab';
import { ServicesManagementTab } from '../components/management/ServicesManagementTab';
import { CategoriesManagementTab } from '../components/management/CategoriesManagementTab';
import { SpecialistsManagementTab } from '../components/management/SpecialistsManagementTab';
import { UserFormModal } from '../components/management/UserFormModal';
import { ServiceFormModal } from '../components/management/ServiceFormModal';
import { CategoryFormModal } from '../components/management/CategoryFormModal';
import { SpecialistFormModal } from '../components/management/SpecialistFormModal';

export type ManagementSubTab = 'usuarios' | 'servicios' | 'categorias' | 'especialistas';

interface UsersManagementScreenProps {
  currentUser: SystemUser;
  systemUsers: SystemUser[];
  onAddUser: (newUser: SystemUser, password?: string) => void;
  onUpdateUser: (updatedUser: SystemUser, password?: string) => void;
  onDeleteUser: (userId: string) => void;
  services: Service[];
  onAddService: (newService: Service) => void;
  onUpdateService: (updatedService: Service) => void;
  onDeleteService: (serviceId: string) => void;
  serviceCategories: ServiceCategory[];
  onAddCategory: (newCategory: ServiceCategory) => void;
  onUpdateCategory: (updatedCategory: ServiceCategory) => void;
  onDeleteCategory: (categoryId: string) => void;
  specialists: Specialist[];
  onAddSpecialist: (newSpecialist: Specialist) => void;
  onUpdateSpecialist: (updatedSpecialist: Specialist) => void;
  onDeleteSpecialist: (specialistId: string) => void;
  onToast?: (message: string) => void;
}

export const UsersManagementScreen: React.FC<UsersManagementScreenProps> = ({
  currentUser,
  systemUsers,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  services,
  onAddService,
  onUpdateService,
  onDeleteService,
  serviceCategories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  specialists,
  onAddSpecialist,
  onUpdateSpecialist,
  onDeleteSpecialist,
  onToast
}) => {
  const [activeSubTab, setActiveSubTab] = useState<ManagementSubTab>('usuarios');

  // Modals state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<SystemUser | null>(null);

  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [serviceToEdit, setServiceToEdit] = useState<Service | null>(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<ServiceCategory | null>(null);

  const [isSpecialistModalOpen, setIsSpecialistModalOpen] = useState(false);
  const [specialistToEdit, setSpecialistToEdit] = useState<Specialist | null>(null);

  // Deletion confirm modal
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'user' | 'service' | 'category' | 'specialist';
    id: string;
    name: string;
  } | null>(null);

  // Security check: Only SuperAdmin can access
  const isSuperAdmin = currentUser.rol === 'SuperAdmin';

  if (!isSuperAdmin) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-rose-200 text-rose-800 max-w-md mx-auto my-8">
        <span className="material-symbols-outlined text-[48px] text-rose-600 mb-2">lock</span>
        <h3 className="text-lg font-bold">Acceso Restringido</h3>
        <p className="text-xs text-[#5A4A43] mt-1">
          Esta sección está reservada exclusivamente para el rol de Super Administrador.
        </p>
      </div>
    );
  }

  // User actions
  const handleOpenCreateUser = () => {
    setUserToEdit(null);
    setIsUserModalOpen(true);
  };

  const handleEditUser = (user: SystemUser) => {
    setUserToEdit(user);
    setIsUserModalOpen(true);
  };

  const handleSaveUser = (user: SystemUser, password?: string) => {
    if (userToEdit) {
      onUpdateUser(user, password);
      if (onToast) onToast(`Perfil "${user.nombre}" actualizado.`);
    } else {
      onAddUser(user, password);
      if (onToast) onToast('Esta lista es solo local. Para dar acceso, crea la cuenta en la consola de Firebase y el perfil con el UID.');
    }
  };

  // Service actions
  const handleOpenCreateService = () => {
    setServiceToEdit(null);
    setIsServiceModalOpen(true);
  };

  const handleEditService = (service: Service) => {
    setServiceToEdit(service);
    setIsServiceModalOpen(true);
  };

  const handleSaveService = (service: Service) => {
    if (serviceToEdit) {
      onUpdateService(service);
      if (onToast) onToast(`Servicio "${service.name}" actualizado.`);
    } else {
      onAddService(service);
      if (onToast) onToast(`Servicio "${service.name}" agregado a la carta.`);
    }
  };

  // Category actions
  const handleOpenCreateCategory = () => {
    setCategoryToEdit(null);
    setIsCategoryModalOpen(true);
  };

  const handleEditCategory = (cat: ServiceCategory) => {
    setCategoryToEdit(cat);
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = (cat: ServiceCategory) => {
    if (categoryToEdit) {
      onUpdateCategory(cat);
      if (onToast) onToast(`Tipo de servicio "${cat.label}" actualizado.`);
    } else {
      onAddCategory(cat);
      if (onToast) onToast(`Tipo de servicio "${cat.label}" creado.`);
    }
  };

  // Specialist actions
  const handleOpenCreateSpecialist = () => {
    setSpecialistToEdit(null);
    setIsSpecialistModalOpen(true);
  };

  const handleEditSpecialist = (spec: Specialist) => {
    setSpecialistToEdit(spec);
    setIsSpecialistModalOpen(true);
  };

  const handleSaveSpecialist = (spec: Specialist) => {
    if (specialistToEdit) {
      onUpdateSpecialist(spec);
      if (onToast) onToast(`Manicurista "${spec.name}" actualizada.`);
    } else {
      onAddSpecialist(spec);
      if (onToast) onToast(`Manicurista "${spec.name}" registrada en el equipo.`);
    }
  };

  // Confirm delete
  const handleConfirmDelete = () => {
    if (!deleteConfirm) return;

    if (deleteConfirm.type === 'user') {
      onDeleteUser(deleteConfirm.id);
      if (onToast) onToast(`Usuario "${deleteConfirm.name}" eliminado.`);
    } else if (deleteConfirm.type === 'service') {
      onDeleteService(deleteConfirm.id);
      if (onToast) onToast(`Servicio "${deleteConfirm.name}" eliminado de la carta.`);
    } else if (deleteConfirm.type === 'category') {
      onDeleteCategory(deleteConfirm.id);
      if (onToast) onToast(`Tipo de servicio "${deleteConfirm.name}" eliminado.`);
    } else if (deleteConfirm.type === 'specialist') {
      onDeleteSpecialist(deleteConfirm.id);
      if (onToast) onToast(`Manicurista "${deleteConfirm.name}" eliminada del equipo.`);
    }

    setDeleteConfirm(null);
  };

  return (
    <div className="w-full space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-[#F4EFE9] via-[#C6BDAC]/30 to-[#F4EFE9] p-6 sm:p-8 text-[#2B2420] border border-[#C6BDAC]/80 shadow-xs relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full bg-[#C6BDAC]/40/20 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#BB9C87]/10 text-[#2B2420] text-xs font-semibold mb-2 border border-[#BB9C87]/20">
              <span className="material-symbols-outlined text-[15px] fill">stars</span>
              Panel de Control Maestro · SuperAdmin
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-['Plus_Jakarta_Sans',sans-serif] text-[#2B2420]">
              Gestión Integral del Santuario
            </h2>
            <p className="text-xs sm:text-sm text-[#5A4A43] mt-1 max-w-xl">
              Configura y administra la carta de servicios, manicuristas, tipos y categorías, y las cuentas de personal con acceso al sistema.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white/80 backdrop-blur-xs p-1.5 rounded-2xl border border-[#C6BDAC] text-xs">
            <span className="material-symbols-outlined text-[18px] text-emerald-600">verified_user</span>
            <div>
              <span className="font-bold text-[#2B2420] block leading-tight">{currentUser.nombre}</span>
              <span className="text-[10px] text-[#5A4A43] uppercase font-bold tracking-wider">Super Administrador</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-[#C6BDAC] pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveSubTab('usuarios')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeSubTab === 'usuarios'
              ? 'bg-[#BB9C87] text-[#2B2420] font-bold shadow-xs'
              : 'bg-white text-[#5A4A43] hover:bg-[#C6BDAC]/40/60 border border-[#C6BDAC]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">manage_accounts</span>
          <span>Usuarios ({systemUsers.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('servicios')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeSubTab === 'servicios'
              ? 'bg-[#BB9C87] text-[#2B2420] font-bold shadow-xs'
              : 'bg-white text-[#5A4A43] hover:bg-[#C6BDAC]/40/60 border border-[#C6BDAC]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">spa</span>
          <span>Servicios ({services.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('categorias')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeSubTab === 'categorias'
              ? 'bg-[#BB9C87] text-[#2B2420] font-bold shadow-xs'
              : 'bg-white text-[#5A4A43] hover:bg-[#C6BDAC]/40/60 border border-[#C6BDAC]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">category</span>
          <span>Tipos de Servicios ({serviceCategories.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('especialistas')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeSubTab === 'especialistas'
              ? 'bg-[#BB9C87] text-[#2B2420] font-bold shadow-xs'
              : 'bg-white text-[#5A4A43] hover:bg-[#C6BDAC]/40/60 border border-[#C6BDAC]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">brush</span>
          <span>Manicuristas ({specialists.length})</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeSubTab === 'usuarios' && (
        <UsersManagementTab
          systemUsers={systemUsers}
          currentUserId={currentUser.id}
          onOpenCreateModal={handleOpenCreateUser}
          onEditUser={handleEditUser}
          onDeleteUser={(u) => setDeleteConfirm({ type: 'user', id: u.id, name: u.nombre })}
        />
      )}

      {activeSubTab === 'servicios' && (
        <ServicesManagementTab
          services={services}
          categories={serviceCategories}
          onOpenCreateModal={handleOpenCreateService}
          onEditService={handleEditService}
          onDeleteService={(s) => setDeleteConfirm({ type: 'service', id: s.id, name: s.name })}
          onUpdateService={onUpdateService}
        />
      )}

      {activeSubTab === 'categorias' && (
        <CategoriesManagementTab
          categories={serviceCategories}
          services={services}
          onOpenCreateModal={handleOpenCreateCategory}
          onEditCategory={handleEditCategory}
          onDeleteCategory={(c) => setDeleteConfirm({ type: 'category', id: c.id, name: c.label })}
        />
      )}

      {activeSubTab === 'especialistas' && (
        <SpecialistsManagementTab
          specialists={specialists}
          onOpenCreateModal={handleOpenCreateSpecialist}
          onEditSpecialist={handleEditSpecialist}
          onDeleteSpecialist={(spec) => setDeleteConfirm({ type: 'specialist', id: spec.id, name: spec.name })}
          onUpdateSpecialist={onUpdateSpecialist}
        />
      )}

      {/* User Form Modal */}
      <UserFormModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        userToEdit={userToEdit}
        onSave={handleSaveUser}
      />

      {/* Service Form Modal */}
      <ServiceFormModal
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        serviceToEdit={serviceToEdit}
        categories={serviceCategories}
        onSave={handleSaveService}
      />

      {/* Category Form Modal */}
      <CategoryFormModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categoryToEdit={categoryToEdit}
        onSave={handleSaveCategory}
      />

      {/* Specialist Form Modal */}
      <SpecialistFormModal
        isOpen={isSpecialistModalOpen}
        onClose={() => setIsSpecialistModalOpen(false)}
        specialistToEdit={specialistToEdit}
        onSave={handleSaveSpecialist}
      />

      {/* Deletion Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-rose-100 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[28px]">warning</span>
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="font-bold text-base text-[#2B2420] font-['Plus_Jakarta_Sans',sans-serif]">
                ¿Confirmas la eliminación?
              </h3>
              <p className="text-xs text-[#5A4A43] leading-relaxed">
                Estás a punto de eliminar {deleteConfirm.type === 'user' ? 'al usuario' : deleteConfirm.type === 'service' ? 'el servicio' : deleteConfirm.type === 'category' ? 'el tipo de servicio' : 'a la manicurista'}:
              </p>
              <strong className="block text-sm text-[#2B2420] font-semibold bg-[#F4EFE9] p-2 rounded-xl border border-[#C6BDAC]">
                {deleteConfirm.name}
              </strong>
              <p className="text-[11px] text-rose-700">Esta acción no se puede deshacer.</p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl bg-white hover:bg-neutral-100 text-[#5A4A43] font-semibold text-xs border border-[#C6BDAC] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-[#ba1a1a] hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
