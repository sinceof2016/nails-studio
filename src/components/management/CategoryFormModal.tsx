import React, { useState, useEffect } from 'react';
import { ServiceCategory } from '../../types';
import { validateOnlyPlainText, sanitizeToPlainText } from '../../utils/security';

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryToEdit?: ServiceCategory | null;
  onSave: (category: ServiceCategory) => void;
}

export const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
  isOpen,
  onClose,
  categoryToEdit,
  onSave
}) => {
  const [label, setLabel] = useState('');
  const [id, setId] = useState('');
  const [icon, setIcon] = useState('spa');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (categoryToEdit) {
      setLabel(categoryToEdit.label);
      setId(categoryToEdit.id);
      setIcon(categoryToEdit.icon || 'spa');
      setDescription(categoryToEdit.description || '');
      setFormError(null);
    } else {
      setLabel('');
      setId('');
      setIcon('spa');
      setDescription('');
      setFormError(null);
    }
  }, [categoryToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const labelVal = validateOnlyPlainText(label, 'Nombre de la Categoría', 60);
    if (!labelVal.isValid) {
      setFormError(labelVal.reason || 'Nombre de categoría inválido.');
      return;
    }

    const cleanLabel = sanitizeToPlainText(label);
    const cleanId = categoryToEdit
      ? categoryToEdit.id
      : (id.trim() || cleanLabel.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'));

    const category: ServiceCategory = {
      id: cleanId,
      label: cleanLabel,
      icon: sanitizeToPlainText(icon) || 'spa',
      description: sanitizeToPlainText(description)
    };

    onSave(category);
    onClose();
  };

  const AVAILABLE_ICONS = [
    { id: 'palette', label: 'Paleta' },
    { id: 'spa', label: 'Spa & Flor' },
    { id: 'brush', label: 'Pincel' },
    { id: 'diamond', label: 'Diamante' },
    { id: 'health_and_safety', label: 'Cuidado & Salud' },
    { id: 'auto_awesome', label: 'Brillo & Glow' },
    { id: 'favorite', label: 'Corazón' },
    { id: 'clean_hands', label: 'Manos Limpias' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-[#F4EFE9] rounded-3xl p-6 shadow-2xl border border-[#C6BDAC] space-y-4">
        <div className="flex items-center justify-between border-b border-[#C6BDAC]/50 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#BB9C87]/10 text-[#2B2420] flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">category</span>
            </div>
            <h3 className="font-bold text-sm sm:text-base text-[#2B2420] font-['Plus_Jakarta_Sans',sans-serif]">
              {categoryToEdit ? `Editar Tipo: ${categoryToEdit.label}` : 'Nuevo Tipo / Categoría de Servicio'}
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

          <div>
            <label className="block font-semibold text-[#5A4A43] mb-1">Nombre / Título del Tipo de Servicio *</label>
            <input
              type="text"
              required
              value={label}
              onChange={(e) => {
                setLabel(e.target.value);
                if (!categoryToEdit && !id) {
                  setId(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'));
                }
              }}
              placeholder="Ej. Acrílico & Esculturales"
              className="w-full h-9 px-3 rounded-xl bg-white border border-[#C6BDAC] text-xs text-[#2B2420] focus:outline-none focus:ring-2 focus:ring-[#2B2420]/20"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#5A4A43] mb-1">Identificador (Slug) *</label>
            <input
              type="text"
              required
              disabled={Boolean(categoryToEdit)}
              value={id}
              onChange={(e) => setId(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder="ej. acrilico-escultural"
              className={`w-full h-9 px-3 rounded-xl border border-[#C6BDAC] text-xs text-[#2B2420] focus:outline-none ${
                categoryToEdit ? 'bg-neutral-100 cursor-not-allowed text-neutral-500' : 'bg-white'
              }`}
            />
            {categoryToEdit && (
              <p className="text-[10px] text-[#5A4A43] mt-0.5">El slug es el identificador único del sistema y no se puede alterar.</p>
            )}
          </div>

          <div>
            <label className="block font-semibold text-[#5A4A43] mb-1.5">Icono Representativo</label>
            <div className="grid grid-cols-4 gap-2">
              {AVAILABLE_ICONS.map((ic) => (
                <button
                  key={ic.id}
                  type="button"
                  onClick={() => setIcon(ic.id)}
                  className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    icon === ic.id
                      ? 'bg-[#BB9C87] text-[#2B2420] font-bold border-[#BB9C87] shadow-2xs'
                      : 'bg-white text-[#5A4A43] border-[#C6BDAC] hover:bg-[#C6BDAC]/40/50'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">{ic.id}</span>
                  <span className="text-[10px] font-medium truncate w-full text-center">{ic.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#5A4A43] mb-1">Descripción Breve</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción del concepto o técnica para mostrar a los clientes"
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
              {categoryToEdit ? 'Guardar Cambios' : 'Crear Tipo de Servicio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
