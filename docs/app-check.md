# Guía de Firebase App Check con reCAPTCHA Enterprise / Fraud Defense
**Proyecto:** La Pelu SPA (Nails-studio)  
**Fecha:** Octubre 2026  
**Objetivo:** Garantizar que únicamente las peticiones provenientes del sitio web oficial (`https://sinceof2016.github.io/nails-studio/`) o del entorno de desarrollo autorizado puedan interactuar con Firestore y Authentication. Bloquear bots y scripts externos no autorizados sin token legítimo.

---

## 1. Estado de Configuración en Consolas

### 1.1. Google Cloud Console (Fraud Defense) - *Realizado*
1. **Ruta:** Google Cloud Console > Seguridad > Fraud Defense (proyecto `Nails-studio`).
2. **Tipo de clave:** Clave de tipo **Web**, sin desafío visual (invisible para las clientas).
3. **Dominios autorizados:**
   - `sinceof2016.github.io` (Producción en GitHub Pages).
   - `localhost` (Desarrollo y pruebas locales).
4. **Resultado:** Se obtuvo el **ID de Clave pública de Fraud Defense / reCAPTCHA Enterprise** (Site Key).

### 1.2. Firebase Console (App Check) - *Realizado*
1. **Ruta:** Firebase Console > Proyecto `Nails-studio` > App Check > pestaña **Apps**.
2. **Aplicación Web:** `La Pelu SPA` (identificador `appId`: `1:550802415820:web:bfb8da886866766beb2269`).
3. **Proveedor:** Registrada con el proveedor **reCAPTCHA Enterprise / Fraud Defense** vinculando el ID de clave obtenido en Google Cloud.
4. **Estado de las APIs (Modo Monitoreo):**
   - Cloud Firestore: **Sin exigir** (Unenforced - solo métricas).
   - Firebase Authentication: **Sin exigir** (Unenforced - solo métricas).

---

## 2. Paso Pendiente para el Dueño en GitHub

Para que la clave pública se inyecte automáticamente al compilar y desplegar en GitHub Pages:

1. Ve a tu repositorio en GitHub: `https://github.com/<usuario>/nails-studio`.
2. Haz clic en **Settings** (Configuración) > **Secrets and variables** > **Actions**.
3. Selecciona la pestaña **Variables** (ojo: *Variables*, NO Secrets, pues el ID de clave es público por diseño).
4. Haz clic en **New repository variable**:
   - **Name:** `VITE_RECAPTCHA_SITE_KEY`
   - **Value:** Pega el ID de la clave de Fraud Defense / reCAPTCHA Enterprise generado en Google Cloud.
5. Haz clic en **Add variable**.

Una vez agregada, el flujo `.github/workflows/deploy.yml` inyectará esta variable durante el paso `npm run build`.

---

## 3. Comportamiento del Código en la Aplicación

- **Inicialización Defensiva (`src/firebase.ts`):**  
  App Check se inicializa después de crear la app de Firebase y antes de cualquier llamada a Firestore o Auth. Se ejecuta una sola vez.
- **Tolerancia a Fallos:**  
  Si la variable `VITE_RECAPTCHA_SITE_KEY` no está configurada (por ejemplo en entornos locales o previews sin variable), la aplicación no se rompe: emite un aviso en consola (`console.warn`) y continúa funcionando con normalidad.
- **Desarrollo Local (`import.meta.env.DEV`):**  
  En modo de desarrollo, se activa automáticamente `FIREBASE_APPCHECK_DEBUG_TOKEN = true`. La consola de herramientas de desarrollo del navegador imprimirá un token de depuración que puedes registrar en:  
  *Firebase Console > App Check > pestaña Apps > menú de tres puntos (...) > Administrar tokens de depuración*.  
  Esto te permite probar localmente sin consumir cuotas de evaluación real.
- **Cumplimiento Legal y Términos de Servicio:**  
  Se incluye la mención obligatoria de Google reCAPTCHA al pie del formulario de reserva, en la Política de Cookies técnica y en el Centro de Preferencias, permitiendo ocultar la insignia flotante por CSS (`.grecaptcha-badge { visibility: hidden; }`) de acuerdo con las directrices oficiales de Google.

---

## 4. Plan de Activación y Monitoreo (Paso a Paso)

### Fase 1: Despliegue y Monitoreo Inicial (Días 1 a 3)
1. Despliega la versión con la variable `VITE_RECAPTCHA_SITE_KEY` configurada en GitHub.
2. Mantén las APIs de Firestore y Authentication en estado **"Sin exigir"** (solo monitoreo).
3. Ingresa a la web desde una ventana en incógnito:
   - Haz una reserva pública de prueba.
   - Inicia sesión en el panel de administración.
   - En DevTools > Red (Network), filtra por `firestore.googleapis.com` y verifica que las peticiones lleven la cabecera `X-Firebase-AppCheck`.
4. Revisa diariamente en *Firebase Console > App Check > Cloud Firestore*:
   - El gráfico de solicitudes verificadas vs. no verificadas.
   - El porcentaje de solicitudes verificadas debe acercarse progresivamente al **100%**.
5. Monitorea en *Google Cloud Console > Fraud Defense* el consumo de evaluaciones frente al límite gratuito mensual y configura una alerta de presupuesto de seguridad.

### Fase 2: Aplicación Obligatoria ("Exigir")
Cuando el tráfico legítimo verificado esté consolidado:

1. **Horario:** Realiza el cambio en un horario de baja afluencia de clientas (ej. noche o madrugada).  
   *Motivo:* Los visitantes con versiones previas cacheadas en sus navegadores necesitarán recargar para obtener el script de App Check.
2. **Paso A:** En *Firebase Console > App Check > Cloud Firestore*, haz clic en **Exigir** (Enforce).
3. **Paso B:** Prueba de inmediato una reserva pública y una consulta de catálogo en ventana de incógnito. Si todo funciona correctamente, continúa.
4. **Paso C:** En *Firebase Console > App Check > Firebase Authentication*, haz clic en **Exigir** (Enforce).
5. **Paso D (Plan de Contingencia):** Si por alguna razón notas bloqueos a clientas legítimas, puedes hacer clic de nuevo en **"Sin exigir"** en la consola de Firebase. El cambio tiene efecto inmediato sin necesidad de volver a compilar ni desplegar código.

### Alcance y Límites de Protección
- **Qué bloquea App Check:** Bloquea herramientas automatizadas externas, scripts de cURL, bots de scraping o atacantes que intenten interactuar directamente con tu base de datos o Auth usando tus credenciales de API fuera del navegador oficial.
- **Qué NO bloquea App Check por sí solo:** No bloquea a un usuario malintencionado que interactúe manualmente en la página web real o a bots headless que ejecuten el navegador completo. Por esa razón, se complementa con:
  1. Rate limiting local en el cliente (5 intentos/minuto).
  2. Reglas de seguridad v4/v5 en Firestore (validación de campos obligatorios, tipado y topes de tamaño).
  3. Validación de texto plano defensivo contra inyecciones y XSS.
