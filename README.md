# 💅 Aura Nails & Spa — Santuario de Belleza & Gestión Integral

Aplicación web progresiva (PWA / SPA) de alta fidelidad diseñada para **Aura Nails & Spa**. Integra catálogo de servicios, reserva en intervalos de 1 hora, arqueo de caja y liquidación en pesos colombianos (**COP**), libro de citas, gestión de usuarios autorizados y pasarela de WhatsApp segura.

---

## 🔒 Arquitectura de Seguridad (Senior SecDev)

1. **Protección de API Keys y Tokens**:
   - Las credenciales sensibles (UltraMsg WhatsApp API, tokens y claves secretas) están aisladas en el servidor backend (`server.ts`) y variables de entorno.
   - Ninguna clave privada o token sin cifrar viaja al código fuente del frontend ni a repositorios públicos como GitHub.
   - Las solicitudes a pasarelas se procesan a través de proxies seguros (`/api/whatsapp/send`).

2. **Bóveda de Credenciales (Security Vault)**:
   - Contraseñas almacenadas exclusivamente como hashes **SHA-256**.
   - Protección contra fuerza bruta con **Rate Limiting** dinámico por IP (máximo de intentos controlados en ventanas de tiempo).
   - Acceso granular basado en roles (**RBAC**): Perfil maestro exclusivo para **David Orjuela (SuperAdmin)**.

3. **Cabeceras de Seguridad HTTP**:
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: SAMEORIGIN`
   - `X-XSS-Protection: 1; mode=block`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - Sanitización de entradas contra XSS e inyecciones de código.

---

## 🚀 Guía de Despliegue en GitHub y GitHub Pages

Esta aplicación está optimizada al 100% para compilarse y desplegarse como sitio web estático en **GitHub Pages** o como aplicación Full-Stack en Node.js.

### 1. Inicializar y subir a tu repositorio en GitHub

Abre tu terminal en la carpeta del proyecto y ejecuta:

```bash
# 1. Inicializar Git (si no está inicializado)
git init

# 2. Agregar todos los archivos
git add .

# 3. Crear el commit inicial
git commit -m "feat: Aura Nails & Spa - Versión Segura y Optimizada para GitHub Pages"

# 4. Vincular con tu repositorio de GitHub (reemplaza con tu usuario y repo)
git remote add origin https://github.com/TU-USUARIO/aura-nails-spa.git

# 5. Subir a la rama principal
git branch -M main
git push -u origin main
```

### 2. Activar el despliegue automático en GitHub Pages

El proyecto ya incluye el archivo de flujo de trabajo `.github/workflows/deploy.yml` (GitHub Actions). Para activarlo:

1. Ve a tu repositorio en **GitHub**.
2. Haz clic en la pestaña **Settings** (Configuración).
3. En el menú lateral izquierdo, haz clic en **Pages**.
4. En la sección **Build and deployment** > **Source**, selecciona:
   - **GitHub Actions**
5. ¡Listo! Cada vez que hagas un `git push`, GitHub Actions compilará automáticamente el proyecto y lo publicará en tu enlace `https://tu-usuario.github.io/aura-nails-spa/`.

---

## 💻 Ejecución en Entorno Local

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo con Vault y API Gateway
npm run dev

# Compilar para producción
npm run build
```
