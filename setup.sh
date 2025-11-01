#!/bin/bash

echo "🎤 Iniciando Plataforma de Karaoke..."

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar si Docker está instalado
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker no está instalado. Por favor instala Docker primero.${NC}"
    exit 1
fi

# Iniciar PostgreSQL
echo -e "${BLUE}🐘 Iniciando PostgreSQL...${NC}"
docker-compose up -d

# Esperar a que PostgreSQL esté listo
echo -e "${BLUE}⏳ Esperando a que PostgreSQL esté listo...${NC}"
sleep 5

# Configurar Backend
echo -e "${BLUE}⚙️  Configurando Backend...${NC}"
cd backend

if [ ! -f .env ]; then
    echo -e "${BLUE}📝 Creando archivo .env...${NC}"
    cp .env.example .env
    sed -i 's/usuario:password@localhost/karaoke:karaoke123@localhost/g' .env
fi

if [ ! -d node_modules ]; then
    echo -e "${BLUE}📦 Instalando dependencias del backend...${NC}"
    npm install
fi

echo -e "${BLUE}🔧 Generando cliente de Prisma...${NC}"
npm run prisma:generate

echo -e "${BLUE}🗄️  Ejecutando migraciones...${NC}"
npm run prisma:migrate || true

# Configurar Frontend
echo -e "${BLUE}⚙️  Configurando Frontend...${NC}"
cd ../frontend

if [ ! -f .env.local ]; then
    echo -e "${BLUE}📝 Creando archivo .env.local...${NC}"
    cp .env.example .env.local
fi

if [ ! -d node_modules ]; then
    echo -e "${BLUE}📦 Instalando dependencias del frontend...${NC}"
    npm install
fi

cd ..

echo -e "${GREEN}✅ ¡Configuración completada!${NC}"
echo ""
echo -e "${GREEN}Para iniciar el proyecto:${NC}"
echo -e "${BLUE}1. Terminal 1:${NC} cd backend && npm run dev"
echo -e "${BLUE}2. Terminal 2:${NC} cd frontend && npm run dev"
echo ""
echo -e "${GREEN}🌐 URLs:${NC}"
echo -e "${BLUE}   Frontend: http://localhost:3000${NC}"
echo -e "${BLUE}   Backend:  http://localhost:3001${NC}"
echo ""
echo -e "${GREEN}🎤 ¡Que comience el concurso!${NC}"
