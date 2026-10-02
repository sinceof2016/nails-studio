import { Appointment, AppNotification, SavedDesign } from '../../types';

/**
 * DATOS HISTÓRICOS DE DEMOSTRACIÓN (NO IMPORTAR EN PRODUCCIÓN).
 * Este archivo se mantiene exclusivamente como referencia de esquemas demo y pruebas locales aisladas.
 */

export const DEMO_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt-demo-101',
    serviceId: 'manicura-rusa-glazed',
    serviceName: 'Manicura Rusa Glazed Donut',
    servicePrice: 95000,
    serviceDuration: 60,
    serviceImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAOfsdpH3e7HqaUOQScax9N0X6CRAnPtA-lCzqugxKKHVPgZ98B7pxhj8n9gkHy7C8NLmXolhp2KC_Wsz7Hth3npWrcmmrHhGcey6QZWmEv1Cfut4cLpP8kvSUxzrOcLHWzVWOuV2Mat3bdkTPBjt96btPbJlUoCR7utNckLGq1h6HtkPRmTJwqO4E7ZyRhTQaDqLH00aZUkXUTWUOZlvlI8wggEeiJzkPmt4XgrFQex80j4vSTpf-pHQ',
    specialistId: 'valentina',
    specialistName: 'Valentina R.',
    specialistRole: 'Master Manicurista',
    specialistAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAVrZXlC9XV7Jr5Ckz3Ejf4PnGseAb9_LjfKYMrbJoppy_LiDKhDwinR0vBsGhUvZvHGPbp5iUnHxfjSiI0q1x_ezt5EWE4msKhGYnuJ_bi2to_l-CAY9vsgwQCGTZuO9aGH29UKCzWusAaS4s7B4tkRYb32MZNdhVDHGKJcjFGCBXJNRmu77q3s_K2o3AfWZrhAQp1ovuHTFfpYunmehQGLKlfeXfbRZw_xe-Mjukl7Dszb37eqX5jMg',
    date: 'Mañana',
    time: '11:00 AM',
    clientName: 'Cliente Demo',
    clientPhone: '',
    notes: 'Nota de demostración',
    polishColor: 'Hailey Glazed Pearl',
    nailShape: 'Almendra Suave',
    selectedAddOns: ['Exfoliación de Cuarzo Rosa & Rosas Silvestres'],
    totalPrice: 120000,
    status: 'confirmada',
    bookingCode: 'DEMO-7829',
    createdAt: '2026-09-27'
  }
];

export const DEMO_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-demo-1',
    title: 'Notificación Demo',
    message: 'Mensaje de prueba interno',
    timeAgo: 'Hace 1 hora',
    isUnread: false,
    type: 'promo'
  }
];

export const DEMO_SAVED_DESIGNS: SavedDesign[] = [
  {
    id: 'des-demo-1',
    title: 'Micro Frenchie Pastel',
    artist: 'Camila M.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAhRtLtp4rWeqdO7ZBkei_aCDjMH2P4JGAIaYlW6TGLLnHGFtTjr-4bsNEd0IKVYSmtAZD2e_aZo3xdt_CiGFV5N5DQ18o-PhNpXysomNUMEWu16_XvFw6ivDhFgZ9WcM_sQz7K9CER4wbGbdWRbpS-_rygFkPZtyXOqSD2LPpvYGdwvLSXqS5hjMujha078zUQOR1jNq7s4F1hEZH2jUohPtGESe_1qOirG0weegA9NsI-YAiWkxrRZg',
    tag: 'Minimalista'
  }
];
