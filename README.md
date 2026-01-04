# Sistema Animalistas - Control Financiero

Sistema de control financiero para organizaciones sin fines de lucro dedicadas al rescate animal.

## Características

- **Gestión de Roles**: Administrador, Tesorero/a, Encargado/a de Compras
- **Registro de Compras**: Con fotos de facturas y categorías personalizables
- **Flujo de Aprobación**: Los tesoreros revisan y aprueban/rechazan compras
- **Registro de Ingresos**: Donativos, ventas, eventos con comprobantes
- **Dashboard**: Visualización del estado financiero
- **Multi-cuenta**: Gestión de cuentas bancarias, efectivo y billeteras digitales
- **Moneda Configurable**: Adaptable a cualquier moneda
- **Diseño Responsive**: Optimizado para móvil y escritorio

## Tecnologías

- **Frontend**: Nuxt 3, Vue 3, TypeScript
- **Estilos**: Tailwind CSS, PrimeIcons
- **Backend**: Supabase (Auth, Database, Storage)
- **Estado**: Pinia

## Instalación

1. Clona el repositorio:
```bash
git clone <url-del-repo>
cd sistema-animalistas
```

2. Instala las dependencias:
```bash
npm install
```

3. Configura las variables de entorno:
```bash
cp .env.example .env
```

4. Edita `.env` con tus credenciales de Supabase:
```
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu-clave-anon-publica
```

5. Configura la base de datos en Supabase:
   - Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
   - Abre el SQL Editor
   - Copia y ejecuta el contenido de `supabase/schema.sql`

6. Configura los buckets de Storage en Supabase:
   - Crea el bucket `facturas` (para fotos de facturas)
   - Crea el bucket `comprobantes` (para comprobantes de ingresos)
   - Configura las políticas de acceso según necesites

7. Inicia el servidor de desarrollo:
```bash
npm run dev
```

## Crear el primer administrador

1. Registra un usuario directamente en Supabase Auth
2. Inserta manualmente el registro en la tabla `usuarios`:
```sql
INSERT INTO public.usuarios (id, email, nombre, apellido, rol)
VALUES ('uuid-del-usuario', 'admin@email.com', 'Nombre', 'Apellido', 'administrador');
```

## Scripts disponibles

```bash
npm run dev      # Inicia servidor de desarrollo
npm run build    # Construye para producción
npm run preview  # Vista previa de producción
```

## Estructura del proyecto

```
├── assets/css/          # Estilos globales
├── components/          # Componentes Vue
│   ├── ui/             # Componentes de UI reutilizables
│   └── ...
├── composables/         # Composables (hooks) de Vue
├── layouts/             # Layouts de la aplicación
├── pages/               # Páginas y rutas
├── supabase/            # Schema SQL para Supabase
├── types/               # Tipos TypeScript
└── ...
```

## Licencia

Este proyecto es de código abierto para uso de organizaciones sin fines de lucro.
