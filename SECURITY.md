# Modelo de Seguridad y Privacidad - La Pelu SPA

Este documento describe la arquitectura de seguridad, control de acceso basado en roles (RBAC), reglas de persistencia en Firebase Firestore y lineamientos de protección de datos personales conforme a la legislación colombiana (Ley 1581 de 2012) para **La Pelu SPA**.

---

## 1. Modelo de Acceso y Roles (RBAC)

La aplicación implementa tres niveles de rol para el personal interno, gestionados a través de Firebase Authentication y validados contra los perfiles almacenados en la colección de Firestore `users/{uid}`:

| Rol | Alcance de Permisos | Capacidades Clave |
| :--- | :--- | :--- |
| **SuperAdmin** | Control Total del Sistema | Gestión de usuarios del sistema (`users/{uid}`), configuración global de la marca, edición de cartas de servicios, categorías y especialistas, auditoría general, liquidaciones consolidadas. |
| **Administrador** | Gestión Operativa de Sede | Visualización y gestión de agenda en tiempo real, registro y liquidación de cortes/comisiones, registro de gastos operativos, arqueo y cierre de caja. Sin permisos para crear ni eliminar otros administradores. |
| **Caja** | Operación Diaria Transaccional | Cobro en recepción, cambio de estado de citas a completadas, registro de ingresos en efectivo/digital y propinas de especialistas. |
| **Cliente / Público** | Sin Sesión (Navegación Web) | Consulta de catálogo y especialistas, verificación de disponibilidad en tiempo real, creación de reservas públicas con autorización obligatoria de Habeas Data. Sin acceso a lectura de otras citas ni al libro maestro. |

---

## 2. Protección de Reglas de Firestore

Las reglas de seguridad de Firestore (`firestore.rules`) garantizan:

1. **Reserva Pública Segura (`appointments/{appointmentId}`)**:
   - Creación pública permitida únicamente si incluye `autorizacionDatos == true`, fecha ISO (`autorizacionFecha`) y versión de política (`autorizacionVersion`).
   - Verificación de no colisión: solo se puede crear la cita si el ID de documento no existía previamente.
   - Los clientes anónimos **NO** pueden listar (`list`) citas ajenas ni consultar datos de otras personas.
   - La actualización y cancelación administrativa requiere autenticación activa (`request.auth != null`).

2. **Bloqueo Atómico de Horarios (`slot_locks/{lockId}`)**:
   - Permite reservas concurrentes atómicas para prevenir dobles agendamientos del mismo especialista y horario.
   - Solo modificable o eliminable junto con el ciclo de vida de la cita o por administradores autenticados.

3. **Registros Financieros (`cuts`, `expenses`, `cash_register_closes`)**:
   - Acceso exclusivo para usuarios autenticados con rol administrativo (`request.auth != null`).
   - Ningún usuario anónimo puede leer ni escribir registros contables o de comisiones.

4. **Gestión de Personal (`users/{uid}`)**:
   - Lectura permitida a usuarios autenticados para resolver su propio perfil y rol.
   - Escritura y modificación restringida exclusivamente a usuarios con rol `SuperAdmin`.

---

## 3. Lo que NO Protege el Sistema (Límites y Consideraciones)

1. **Alojamiento Estático (GitHub Pages)**:
   - Al ser una Single Page Application (SPA) cliente en GitHub Pages sin backend propio, no se ejecutan validaciones server-side independientes de las reglas de Firebase.
   - La seguridad de los datos depende estrictamente de las reglas de seguridad de Firestore y de Firebase Authentication.
2. **Envío de WhatsApp (Client-side)**:
   - En el entorno sin servidor proxy dedicado, el botón transaccional de WhatsApp opera mediante enlaces directos `wa.me/` generados en el navegador del cliente. La aplicación no garantiza que el usuario pulse efectivamente el botón de envío tras registrar su reserva.
3. **Restricción de Referer en Preview / Sandbox**:
   - En entornos de vista previa dinámicos (como Cloud Run o sandboxes de desarrollo), las restricciones de dominio de Google Cloud Console para API Keys pueden bloquear servicios como Firebase Installations si no se encuentran en la lista blanca.

---

## 4. Gestión de Secretos y Llaves de API

- **Regla Estricta**: Ningún secreto, clave privada, hash de contraseña o token administrativo vive en el código fuente ni en el repositorio de GitHub.
- **Configuración Web de Firebase (`firebase-applet-config.json`)**: Contiene únicamente identificadores públicos del cliente web (`apiKey`, `appId`, `projectId`, `messagingSenderId`). De acuerdo con la arquitectura oficial de Firebase, estos valores son seguros para distribuirse en el frontend, ya que toda la protección recae en las reglas de Firestore y Firebase Auth.
- **UltraMsg / Pasarelas Externas**: Los tokens opcionales de prueba de pasarelas locales se configuran exclusivamente en memoria o almacenamiento local privado del navegador del administrador, nunca en código estático.

---

## 5. Lista de Verificación Previa a Entrega (Checklist QA)

- [x] Base de datos vacía arranca en cero: sin citas, cobros, gastos ni cierres de prueba.
- [x] Sin menciones fijas a sedes anteriores ni teléfonos ficticios en código de producción.
- [x] Sede unificada leída de configuración: "Santuario Patio Bonito".
- [x] Autorización de datos personales obligatoria para confirmar citas (con bloqueo, alerta, foco y metadatos de auditoría).
- [x] Google Analytics condicionado estrictamente al consentimiento de cookies (`_ga` bloqueado en primer visita).
- [x] Suite de pruebas automatizadas aprobada al 100% (`npm test`).
- [ ] Confirmar datos legales pendientes con el negocio (Razón social, NIT, correo oficial, teléfono oficial, vigencia de promociones).
- [ ] Revisión legal final de los textos borrador de Habeas Data por parte del asesor jurídico del negocio.
