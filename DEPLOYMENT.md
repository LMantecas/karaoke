# 🚀 Guía de Despliegue a Producción

## Opciones de Despliegue

### 1. Vercel (Frontend) + Railway (Backend + DB) - Recomendado

#### Frontend en Vercel

1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno:
   ```
   NEXT_PUBLIC_API_URL=https://tu-backend.railway.app
   NEXT_PUBLIC_FRONTEND_URL=https://tu-app.vercel.app
   ```
3. Deploy automático con cada push

#### Backend en Railway

1. Crea un nuevo proyecto en Railway
2. Agrega PostgreSQL desde el marketplace
3. Configura las variables de entorno:
   ```
   DATABASE_URL=postgresql://... (auto-generada)
   PORT=3001
   ADMIN_SECRET=tu-secreto-seguro
   FRONTEND_URL=https://tu-app.vercel.app
   ```
4. Conecta tu repositorio
5. Railway detectará automáticamente Node.js

### 2. DigitalOcean App Platform

1. Crea una nueva App
2. Conecta tu repositorio
3. Configura dos componentes:
   - Web Service (Frontend - Next.js)
   - Web Service (Backend - Node.js)
4. Agrega PostgreSQL Managed Database
5. Configura variables de entorno

### 3. AWS (EC2 + RDS)

#### Base de Datos (RDS)
```bash
# Crear instancia PostgreSQL en RDS
# Configurar security groups para permitir conexión desde EC2
```

#### Backend (EC2)
```bash
# Conectar a EC2
ssh -i key.pem ubuntu@your-ec2-ip

# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PM2
sudo npm install -g pm2

# Clonar repositorio
git clone your-repo
cd karaoke-contest/backend

# Instalar dependencias
npm install

# Configurar .env
nano .env
# DATABASE_URL=tu-rds-url
# PORT=3001

# Ejecutar migraciones
npm run prisma:migrate

# Iniciar con PM2
pm2 start server.js --name karaoke-backend
pm2 save
pm2 startup
```

#### Frontend (Vercel o EC2)

**Opción A: Vercel** (recomendado)
- Mismo proceso que arriba

**Opción B: EC2**
```bash
# En la misma o diferente EC2
cd karaoke-contest/frontend

# Instalar dependencias
npm install

# Configurar variables
nano .env.production
# NEXT_PUBLIC_API_URL=http://tu-backend-ip:3001

# Build
npm run build

# Iniciar con PM2
pm2 start npm --name karaoke-frontend -- start
pm2 save
```

### 4. Docker + Docker Compose

```bash
# Crear Dockerfile para backend
# backend/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
EXPOSE 3001
CMD ["npm", "start"]

# Crear Dockerfile para frontend
# frontend/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]

# docker-compose.production.yml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: karaoke_contest
      POSTGRES_USER: karaoke
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: always

  backend:
    build: ./backend
    depends_on:
      - postgres
    environment:
      DATABASE_URL: postgresql://karaoke:${DB_PASSWORD}@postgres:5432/karaoke_contest
      PORT: 3001
    ports:
      - "3001:3001"
    restart: always

  frontend:
    build: ./frontend
    depends_on:
      - backend
    environment:
      NEXT_PUBLIC_API_URL: http://backend:3001
    ports:
      - "3000:3000"
    restart: always

volumes:
  postgres_data:
```

## 🔐 Configuración de Seguridad

### Variables de Entorno Seguras

**Backend (.env):**
```bash
DATABASE_URL="postgresql://user:STRONG_PASSWORD@host:5432/db"
PORT=3001
ADMIN_SECRET="use-a-strong-random-secret-here"
NODE_ENV=production
FRONTEND_URL="https://your-domain.com"
```

**Frontend (.env.production):**
```bash
NEXT_PUBLIC_API_URL="https://api.your-domain.com"
NEXT_PUBLIC_FRONTEND_URL="https://your-domain.com"
```

### CORS

Actualiza `backend/server.js`:
```javascript
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
```

### HTTPS

**Opción 1: Let's Encrypt (recomendado)**
```bash
# Instalar Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtener certificado
sudo certbot --nginx -d your-domain.com -d api.your-domain.com
```

**Opción 2: Cloudflare**
- Agrega tu dominio a Cloudflare
- Configura SSL/TLS en modo "Full"
- Usa proxy de Cloudflare

### Rate Limiting

Agregar a `backend/server.js`:
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // límite de requests
});

app.use('/api/', limiter);
```

## 📊 Monitoreo

### PM2 Monitoring
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7

pm2 monit
```

### Logging
```javascript
// Agregar Winston para logging
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

## 🔄 CI/CD

### GitHub Actions

`.github/workflows/deploy.yml`:
```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Railway
        run: |
          # Comandos de deploy

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        run: |
          npm i -g vercel
          vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

## 🗄️ Backup de Base de Datos

```bash
# Backup automático diario
#!/bin/bash
BACKUP_DIR="/backups/postgres"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

pg_dump -h localhost -U karaoke karaoke_contest > $BACKUP_DIR/backup_$TIMESTAMP.sql

# Mantener solo últimos 7 días
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
```

Agregar a crontab:
```bash
0 2 * * * /path/to/backup-script.sh
```

## 📈 Escalamiento

### Horizontal (Múltiples Instancias)

1. **Load Balancer**: Nginx o AWS ALB
2. **Sesiones Compartidas**: Redis para Socket.IO
3. **Base de Datos**: PostgreSQL con replicas de lectura

```javascript
// Socket.IO con Redis
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');

const pubClient = createClient({ url: 'redis://localhost:6379' });
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));
```

### Vertical (Más Recursos)

- Aumentar RAM y CPU en el servidor
- Optimizar queries de base de datos
- Implementar caching con Redis

## ✅ Checklist Pre-Producción

- [ ] Variables de entorno configuradas
- [ ] HTTPS habilitado
- [ ] CORS configurado correctamente
- [ ] Rate limiting implementado
- [ ] Logs configurados
- [ ] Backup automático de DB
- [ ] Monitoreo configurado
- [ ] Documentación actualizada
- [ ] Testing en staging
- [ ] Plan de rollback preparado

## 🆘 Troubleshooting

### Backend no conecta a DB
```bash
# Verificar conexión
psql -h hostname -U username -d database

# Ver logs
pm2 logs karaoke-backend
```

### Socket.IO no funciona
- Verificar CORS
- Comprobar firewalls
- Revisar WebSocket support en proxy/load balancer

### Frontend muestra errores
```bash
# Limpiar cache y rebuild
rm -rf .next
npm run build
pm2 restart karaoke-frontend
```

## 📞 Soporte

Para problemas en producción:
1. Revisar logs: `pm2 logs`
2. Verificar estado: `pm2 status`
3. Revisar métricas: `pm2 monit`
4. Consultar documentación de tu proveedor cloud

---

¡Buena suerte con el despliegue! 🚀
