# AIRA - Análisis Inteligente de Riesgos y Accidentes

## Resumen Ejecutivo
AIRA es una plataforma basada en Inteligencia Artificial diseñada para analizar eventos, identificar riesgos inmediatos y no tan inmediatos en entornos industriales, ayudando a gestionar, prevenir y tomar mejores decisiones en materia de Seguridad y Salud Ocupacional (SSO). 

El sistema recibe un reporte de inspección junto a evidencia fotográfica y, a través de modelos de lenguaje avanzados (LLMs), evalúa las condiciones bajo la normativa OSHA, generando un análisis detallado del nivel de riesgo y acciones correctivas recomendadas. Este resultado se empaqueta en un informe PDF profesional que es enviado automáticamente a un canal o bot de Telegram.

## Herramientas y Tecnologías Utilizadas
- **Next.js & React:** Framework principal utilizado para el desarrollo tanto del frontend (interfaz de usuario) como de la API interna.
- **TypeScript:** Lenguaje base de todo el proyecto para garantizar un tipado estricto y prevenir errores durante el desarrollo.
- **Inteligencia Artificial (IA):**
  - **Google GenAI SDK:** Utilizado para conectar con el modelo `gemini-2.0-flash`.
  - **Anthropic SDK:** Soporte alternativo (dependiendo del entorno) para conectar con el modelo `claude-sonnet-4-6`.
- **PDFKit:** Librería en Node.js para la generación y renderización del documento PDF del reporte.
- **Telegram Bot API:** Empleado para enviar notificaciones automáticas y el documento PDF generado a los encargados de seguridad.

## Arquitectura del Código

El proyecto está organizado bajo la estructura estándar de App Router de Next.js (`src/app` y `src/lib`):

### 1. Interfaz de Usuario (`src/app/page.tsx` & `globals.css`)
Contiene el formulario principal donde el inspector introduce los datos de la inspección:
- **Campos:** Nombre del inspector, Fecha, Empresa, Área inspeccionada, Observaciones.
- **Subida de Archivos:** Permite adjuntar imágenes de las anomalías.
- **Interacción:** Al enviar, se hace una petición POST a la API interna y se muestra el análisis generado por la IA en pantalla.

### 2. Endpoint de Análisis (`src/app/api/analyze/route.ts`)
Es el motor principal de la aplicación. Recibe los datos del frontend (mediante `FormData`), y ejecuta el siguiente flujo:
1. Extrae los datos de texto y convierte las imágenes a base64.
2. Construye un `systemPrompt` avanzado que le da el rol a la IA de ser un "experto en seguridad industrial" y le ordena analizar los datos basándose en el estándar OSHA.
3. Llama a la función `generateSafetyReport` para obtener la respuesta de la IA.
4. Una vez recibida la respuesta de la IA, de forma asíncrona:
   - Invoca la generación del documento PDF.
   - Envía el PDF resultante mediante Telegram.
5. Retorna la evaluación de la IA al frontend para ser mostrada en pantalla.

### 3. Integración con IA (`src/lib/ai/provider.ts`)
Módulo encargado de interactuar con las APIs de los LLM. Por defecto, utiliza **Gemini 2.0 Flash**, enviándole el prompt estructurado, las notas del inspector y las imágenes adjuntas. Si la variable de entorno `AI_PROVIDER` es `claude`, utiliza Claude Sonnet de Anthropic. Retorna la respuesta de la IA en texto crudo.

### 4. Generación de PDF (`src/lib/pdfGenerator.ts`)
Utilizando `PDFKit`, toma los datos brutos y la respuesta de la IA y dibuja un reporte profesional.
- **Características:**
  - Incluye un logo institucional en la cabecera (cargado dinámicamente desde `public/logo.jpg` o `.png`).
  - Imprime los metadatos de la inspección.
  - Parsea el contenido Markdown generado por la IA (negritas, niveles de alerta y tablas simples) para darle un diseño coloreado (Rojo para Crítico, Naranja para Alto, etc.).
  - Incrusta las imágenes de evidencia fotográfica al final del reporte.
- **Salida:** Retorna un `Buffer` con el contenido del archivo PDF.

### 5. Notificaciones (`src/lib/telegram.ts`)
Se encarga de enviar el `Buffer` del PDF generado usando la API de Telegram (`sendDocument`). Requiere las credenciales `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID` configuradas en las variables de entorno. Envía un mensaje estructurado notificando la nueva inspección.
