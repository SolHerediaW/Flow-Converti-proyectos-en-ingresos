# Gestor de Proyectos y Finanzas para Freelancers (TP2 - Desarrollo Frontend II)

Aplicación web interactiva desarrollada con **React + Vite** y conectada a **Firebase Cloud Firestore**[cite: 65] como base de datos serverless[cite: 65], diseñada específicamente para organizar proyectos, controlar estados de trabajo y llevar un registro financiero mensual (ingresos, costos y proyecciones) en pesos argentinos (ARS) y dólares (USD).

## 💡 Idea y Propósito
Los diseñadores y profesionales independientes suelen gestionar múltiples clientes, plazos de entrega y esquemas de pagos fragmentados (señas, pagos totales en distintas monedas). Esta herramienta resuelve esa necesidad central centralizando en una interfaz moderna:
- La creación y seguimiento de proyectos con estados de trabajo (Pendiente, En proceso, Terminado).
- El control de pagos y cobros (Impago, Con seña, Pagado) con cálculo automático de saldos pendientes.
- Un módulo de registro financiero mensual que contrasta ingresos confirmados frente a costos operativos fijos y recurrentes.

## 🚀 Funcionalidades Principales
1. **Gestión CRUD de Proyectos:** Alta, edición, filtrado por estado de trabajo/pago y eliminación de proyectos sincronizados en tiempo real con Firestore[cite: 65].
2. **Dinámica de Pagos Inteligente:** Ocultación automática de campos de seña cuando el proyecto está marcado como "Pagado".
3. **Panel Financiero Multidivisa:** Contadores separados y ordenados estrictamente (ARS arriba y USD abajo) para ingresos y proyecciones.
4. **Registro Financiero Mensual (Etapas Avanzadas):** Navegación por meses, listado de ingresos del período, gestión de costos operativos (con opción de marcarlos como recurrentes o darlos de baja) y control de pendientes de cobro.

## 🛠️ Tecnologías y Librerías Utilizadas
- **React + Vite** (Entorno de desarrollo y componentes modulares)[cite: 27, 46, 65]
- **Firebase Cloud Firestore & Authentication (Anónima)** (Persistencia de datos en la nube y seguridad por sesión)[cite: 65, 67]
- **JavaScript Moderno (ES6+)** (Funciones puras, métodos de array `map`/`filter`, desestructuración)[cite: 7, 45, 59]

---

## 📋 Instrucciones de Ejecución Local

Para clonar y poner en marcha el proyecto en tu computadora:

1. **Clonar el repositorio:**
   ```bash
   git clone <url-del-repositorio>
   cd <nombre-de-la-carpeta>