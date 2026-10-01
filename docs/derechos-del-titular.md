# Protocolo Técnico para el Ejercicio de Derechos del Titular (Habeas Data)
> **Referencia Normativa:** Ley 1581 de 2012 (Artículos 8, 14 y 15) y Decreto 1377 de 2013.  
> **Responsable:** La Pelu SPA (`PENDIENTE_RAZON_SOCIAL`, NIT `PENDIENTE_NIT`).  
> **Estado:** `PENDIENTE REVISIÓN LEGAL`.

Este documento describe el procedimiento técnico para atender solicitudes de **Acceso/Exportación** y **Supresión/Anonimización** de datos personales sin vulnerar las obligaciones fiscales y contables colombianas.

---

## 1. Identificación y Verificación de Identidad
Antes de ejecutar cualquier exportación o supresión de datos:
1. El titular debe enviar la solicitud desde el correo o teléfono registrado, o adjuntar copia de su documento de identidad a `PENDIENTE_CORREO_PRIVACIDAD`.
2. Se verifica que el solicitante sea efectivamente el titular de los datos o su apoderado debidamente acreditado.

---

## 2. Solicitud de Exportación / Consulta de Datos (Art. 14 Ley 1581)
Cuando un cliente solicita una copia de toda la información que el establecimiento conserva sobre él:
- **Colecciones involucradas:**
  - `appointments` (filtrando por `clientPhone` y `clientEmail`).
  - `salon_cuts` (filtrando por `clienteTelefono` y `clienteNombre`).
  - `slot_locks` (registros de horarios vinculados a sus citas).
- **Formato de entrega:**
  - Archivo estructurado `.json` o reporte en `.pdf` descargable que contiene: historial de reservas, servicios contratados, fechas, especialista que lo atendió y prueba de las autorizaciones otorgadas (`autorizacionDatos: true`, `autorizacionFecha`, `autorizacionVersion`).
- **Término legal de entrega:** Máximo diez (10) días hábiles prorrogables por cinco (5) días hábiles (`PENDIENTE REVISIÓN LEGAL`).

---

## 3. Solicitud de Supresión / Cancelación de Datos (Art. 15 Ley 1581)
De conformidad con el Artículo 9 del Decreto 1377 de 2013, la solicitud de supresión no procederá cuando el titular tenga un deber legal o contractual de permanecer en la base de datos (por ejemplo, registros contables que deben conservarse por cinco (5) o diez (10) años según el Código de Comercio y el Estatuto Tributario).

### Estrategia de Supresión y Anonimización Defensiva:
1. **Colección `appointments` (Citas):**
   - Se eliminan o anonimizan los datos de contacto directo:
     - `clientName` -> `"Titular Anonimizado (Ley 1581)"`
     - `clientPhone` -> `"+57 000 000 0000"`
     - `clientEmail` -> `null`
     - `notes` -> `null`
   - Se mantiene el registro técnico para estadísticas de ocupación: `id`, `date`, `time`, `serviceName`, `specialistName`, `totalPrice`, `status: 'completada'`.
2. **Colección `salon_cuts` (Libro Contable de Caja):**
   - Debido al deber legal de conservación contable (Estatuto Tributario):
     - Se disocian los datos identificativos: `clienteNombre: "Cliente Anonimizado"`, `clienteTelefono: ""`.
     - Se conservan inalterados los valores fiscales: `fecha`, `montoEfectivo`, `montoDigital`, `comisionEspecialista`, `recaudoSalon`, `metodoPago`, `sucursalId`.
3. **Colección `slot_locks` (Bloqueos de horarios):**
   - Se suprimen los bloqueos asociados si la cita está en el futuro o fue cancelada.

---

## 4. Registro y Auditoría del Trámite
Toda solicitud de Habeas Data debe quedar asentada en una bitácora interna de cumplimiento que registre:
- Fecha y canal de recepción.
- Nombre y documento del titular solicitante.
- Tipo de derecho ejercido (Consulta / Actualización / Supresión / Revocatoria).
- Acción técnica realizada y fecha de notificación formal de respuesta.
