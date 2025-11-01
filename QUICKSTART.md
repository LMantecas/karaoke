# 🚀 INICIO RÁPIDO - Concurso de Karaoke

## Opción 1: Setup Automático (Linux/Mac) ⚡

```bash
./setup.sh
```

Este script:
- ✅ Inicia PostgreSQL con Docker
- ✅ Configura archivos .env
- ✅ Instala dependencias
- ✅ Ejecuta migraciones
- ✅ Te deja listo para empezar

Luego abre dos terminales:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Accede a:** http://localhost:3000

---

## Opción 2: Setup Manual (Windows/Todos) 🔧

### Paso 1: Base de Datos

**Opción A - Con Docker:**
```bash
docker-compose up -d
```

**Opción B - PostgreSQL Local:**
```bash
# Crear base de datos
createdb karaoke_contest
```

### Paso 2: Backend

```bash
cd backend

# Copiar configuración
cp .env.example .env

# Editar .env con tus credenciales de PostgreSQL
# DATABASE_URL="postgresql://usuario:password@localhost:5432/karaoke_contest"

# Instalar dependencias
npm install

# Generar cliente Prisma
npm run prisma:generate

# Ejecutar migraciones
npm run prisma:migrate

# Iniciar servidor
npm run dev
```

✅ Backend corriendo en: http://localhost:3001

### Paso 3: Frontend

```bash
cd frontend

# Copiar configuración
cp .env.example .env.local

# Instalar dependencias
npm install

# Iniciar servidor
npm run dev
```

✅ Frontend corriendo en: http://localhost:3000

---

## 🎮 Cómo Usar la Plataforma

### 1️⃣ Crear Concurso (Administrador)
1. Ve a http://localhost:3000
2. Click en "Crear Concurso"
3. Ingresa el nombre
4. **¡GUARDA EL CÓDIGO DE ADMIN!** (lo necesitarás)

### 2️⃣ Registrar Participantes
1. Los participantes escanean el QR mostrado
2. O acceden directamente con el link
3. Ingresan su nombre artístico
4. ¡Listo para competir!

### 3️⃣ Iniciar el Concurso
1. Cuando tengas al menos 2 participantes
2. Click en "Iniciar Concurso"
3. Se crea automáticamente la primera ronda
4. Los brackets se forman aleatoriamente

### 4️⃣ Votación y Rondas
- Los participantes votan del 1 al 10
- No pueden votarse a sí mismos
- El admin ve todos los puntajes
- El admin puede ajustar puntajes manualmente
- Click en "Finalizar Match" para pasar a siguiente ronda

### 5️⃣ Agregar Canciones
- Los participantes pueden agregar sus canciones
- Se muestran en el panel del admin
- Organizadas por ronda

---

## 📂 Estructura del Proyecto

```
karaoke-contest/
├── backend/              # Node.js + Express + Socket.IO
│   ├── prisma/          # Esquema de base de datos
│   ├── server.js        # Servidor principal
│   └── package.json
├── frontend/            # Next.js 14 + React + Tailwind
│   ├── app/            # Páginas (App Router)
│   ├── components/     # Componentes reutilizables
│   └── package.json
├── README.md           # Documentación completa
├── API.md              # Documentación de la API
├── DEPLOYMENT.md       # Guía de despliegue
└── docker-compose.yml  # PostgreSQL con Docker
```

---

## 🛠️ Comandos Útiles

### Backend
```bash
npm run dev              # Desarrollo
npm start                # Producción
npm run prisma:generate  # Generar cliente Prisma
npm run prisma:migrate   # Ejecutar migraciones
```

### Frontend
```bash
npm run dev    # Desarrollo
npm run build  # Build para producción
npm start      # Servidor de producción
```

### Docker
```bash
docker-compose up -d      # Iniciar PostgreSQL
docker-compose down       # Detener
docker-compose logs       # Ver logs
```

---

## 🐛 Problemas Comunes

### "Cannot connect to database"
- Verifica que PostgreSQL esté corriendo
- Revisa el `DATABASE_URL` en `.env`
- Si usas Docker: `docker-compose ps`

### "Port already in use"
- Backend usa puerto 3001
- Frontend usa puerto 3000
- Cierra otros procesos o cambia los puertos

### "Module not found"
- Borra `node_modules/` y ejecuta `npm install`
- Verifica que estés en el directorio correcto

### Socket.IO no conecta
- Verifica que ambos servidores estén corriendo
- Revisa las URLs en `.env.local`
- Abre la consola del navegador para ver errores

---

## 📚 Más Información

- **README.md** - Documentación completa
- **API.md** - Documentación de endpoints
- **DEPLOYMENT.md** - Guía de producción

---

## 🎤 ¡Listo para Cantar!

Tu plataforma está configurada. Ahora solo falta:

1. 🎯 Reunir a los participantes
2. 🎵 Preparar las canciones
3. 🏆 ¡Que gane el mejor!

**URLs importantes:**
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- API Docs: Ver API.md

¿Dudas? Revisa el README.md completo.

---

💜 Hecho con amor para los amantes del karaoke 🎤✨
