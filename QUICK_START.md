# 🚀 Guía de Inicio Rápido

## Pasos para Ejecutar el Proyecto

### 1. Instalar PostgreSQL
Si no tienes PostgreSQL instalado:
- **Windows**: Descarga desde https://www.postgresql.org/download/windows/
- **Mac**: `brew install postgresql`
- **Linux**: `sudo apt-get install postgresql`

### 2. Crear Base de Datos

```bash
# Conectar a PostgreSQL
psql -U postgres

# Crear base de datos
CREATE DATABASE karaoke_contest;

# Salir
\q

# Importar el schema
psql -U postgres karaoke_contest < backend/schema.sql
```

### 3. Configurar Backend

```bash
cd backend
npm install

# Crear archivo .env
cat > .env << EOF
PORT=3001
DATABASE_URL=postgresql://postgres:tu_password@localhost:5432/karaoke_contest
ADMIN_PASSWORD=admin123
NODE_ENV=development
EOF
```

### 4. Configurar Frontend

```bash
cd ../frontend
npm install

# Crear archivo .env.local
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_ADMIN_PASSWORD=admin123
EOF
```

### 5. Ejecutar Aplicación

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

### 6. Acceder a la Aplicación

- **Página Principal**: http://localhost:3000
- **Admin**: http://localhost:3000/admin (password: admin123)
- **Registro**: http://localhost:3000/register

## 🎯 Flujo de Uso Rápido

1. Ve a `/admin` e inicia sesión con `admin123`
2. Crea un nuevo concurso
3. Muestra el QR a los participantes o comparte el link `/register`
4. Una vez registrados, haz click en "Iniciar Concurso"
5. En la pestaña "Control de Match", inicia la votación
6. Los participantes votan desde sus dispositivos
7. Finaliza el match y los ganadores avanzan automáticamente

## 🔑 Contraseña por Defecto

- **Admin Password**: `admin123`
- ⚠️ **IMPORTANTE**: Cambia esta contraseña en producción

## 📱 Para Participantes

1. Escanea el QR o ve a `/register`
2. Ingresa tu nombre
3. Espera a que inicie el concurso
4. Cuando sea tu turno, ingresa tu canción
5. Vota por otros participantes cuando NO sea tu turno

## ⚡ Comandos Rápidos

```bash
# Instalar todo
cd backend && npm install && cd ../frontend && npm install

# Desarrollo (en terminales separadas)
cd backend && npm run dev
cd frontend && npm run dev

# Ver logs de base de datos
psql karaoke_contest -c "SELECT * FROM contests;"
psql karaoke_contest -c "SELECT * FROM participants;"
```

## 🐛 Problemas Comunes

**Error: "Cannot connect to database"**
- Verifica que PostgreSQL esté corriendo: `sudo service postgresql status`
- Revisa las credenciales en el archivo `.env`

**Error: "Port 3000 already in use"**
- Mata el proceso: `kill $(lsof -t -i:3000)`
- O cambia el puerto en Next.js

**No aparecen actualizaciones en tiempo real**
- Verifica que el backend esté corriendo
- Revisa la consola del navegador para errores de Socket.IO

## 🎉 ¡Listo!

Tu plataforma de karaoke está lista. ¡A cantar! 🎤
