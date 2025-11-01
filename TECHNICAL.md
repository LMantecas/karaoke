# 🎤 Plataforma de Concurso de Karaoke - Resumen Técnico

## 📋 Descripción General

Plataforma web full-stack para gestionar concursos de karaoke con sistema de brackets, votación en tiempo real y panel de administración completo.

## 🎯 Características Principales

### Para el Administrador
- ✅ Creación de concursos con código único
- ✅ Generación automática de código QR
- ✅ Vista completa del bracket
- ✅ Sistema de rondas automático basado en participantes
- ✅ Ajuste manual de puntajes
- ✅ Control de matches y eliminaciones
- ✅ Vista de canciones por participante/ronda
- ✅ Actualizaciones en tiempo real

### Para los Participantes
- ✅ Registro simple mediante QR o link
- ✅ Sistema de votación (1-10 puntos)
- ✅ Agregar canciones por ronda
- ✅ No pueden votarse a sí mismos cuando les toca
- ✅ Actualizaciones en tiempo real
- ✅ Interfaz responsive y moderna

### Técnicas
- ✅ Brackets aleatorios
- ✅ Soporte para rondas individuales y en parejas
- ✅ WebSocket para sincronización en tiempo real
- ✅ Base de datos relacional con PostgreSQL
- ✅ ORM con Prisma para type-safety
- ✅ RESTful API
- ✅ Arquitectura escalable

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────┐
│                   FRONTEND (Next.js)                 │
│  ┌────────────┐  ┌─────────────┐  ┌──────────────┐ │
│  │   Admin    │  │ Participante│  │  Registro    │ │
│  │   Panel    │  │    Panel    │  │  Público     │ │
│  └────────────┘  └─────────────┘  └──────────────┘ │
└───────────────────────┬─────────────────────────────┘
                        │ HTTP/WebSocket
┌───────────────────────┴─────────────────────────────┐
│               BACKEND (Node.js/Express)              │
│  ┌────────────┐  ┌─────────────┐  ┌──────────────┐ │
│  │    API     │  │  Socket.IO  │  │   Prisma     │ │
│  │  REST/ful  │  │  Real-time  │  │     ORM      │ │
│  └────────────┘  └─────────────┘  └──────────────┘ │
└───────────────────────┬─────────────────────────────┘
                        │ SQL
┌───────────────────────┴─────────────────────────────┐
│              DATABASE (PostgreSQL)                   │
│  ┌────────────────────────────────────────────────┐ │
│  │ Contests │ Participants │ Rounds │ Matches    │ │
│  │ Votes │ Songs │ MatchParticipants             │ │
│  └────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

## 🛠️ Stack Tecnológico

### Backend
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Node.js | 18+ | Runtime JavaScript |
| Express | 4.18+ | Framework web |
| Socket.IO | 4.6+ | Comunicación en tiempo real |
| Prisma | 5.7+ | ORM y migraciones |
| PostgreSQL | 14+ | Base de datos |

### Frontend
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Next.js | 14+ | Framework React con SSR |
| React | 18+ | Librería UI |
| Tailwind CSS | 3.3+ | Estilos y diseño |
| Socket.IO Client | 4.6+ | WebSocket cliente |
| QRCode.react | 3.1+ | Generación de QR |
| Axios | 1.6+ | HTTP client |

## 📊 Modelo de Datos

### Relaciones Principales

```
Contest (1) ──── (N) Participant
Contest (1) ──── (N) Round
Round (1) ──── (N) Match
Match (N) ──── (N) Participant [through MatchParticipant]
Match (1) ──── (N) Vote
Participant (1) ──── (N) Vote
Participant (1) ──── (N) Song
```

### Entidades

**Contest**
- Representa un concurso completo
- Contiene código de admin único
- Estados: registration, in-progress, finished

**Participant**
- Usuarios registrados en el concurso
- Puede ser eliminado pero mantiene histórico
- Relacionado con votos y canciones

**Round**
- Rondas del torneo
- Tipos: individual o parejas
- Contiene múltiples matches

**Match**
- Enfrentamientos específicos
- Estados: pending, voting, completed
- Relaciona participantes en competencia

**Vote**
- Votos de participantes a otros
- Rango: 0-10
- Restricción: no votar en propio match

**Song**
- Canciones que cantará cada participante
- Organizada por ronda
- Visible para admin

**MatchParticipant**
- Tabla pivot con score
- Permite ajuste manual (adjustedScore)
- Determina ganadores

## 🔄 Flujos Principales

### Flujo de Registro
```
1. Admin crea concurso → Genera QR
2. Participante escanea QR → Abre web
3. Ingresa nombre → POST /api/contest/:id/register
4. Socket emite 'participantRegistered'
5. Admin ve nuevo participante en tiempo real
```

### Flujo de Inicio
```
1. Admin click "Iniciar" → POST /api/contest/:id/start
2. Backend crea Round 1 (individual)
3. Genera matches aleatorios con bracket
4. Socket emite 'contestStarted'
5. Todos ven la primera ronda
```

### Flujo de Votación
```
1. Match en estado 'voting'
2. Participante (no en match) califica → POST /api/match/:id/vote
3. Backend valida y calcula promedio
4. Socket emite 'voteSubmitted'
5. Admin ve puntajes actualizados
```

### Flujo de Finalización
```
1. Admin click "Finalizar Match" → POST /api/match/:id/complete
2. Backend determina ganador por puntaje
3. Marca perdedores como eliminados
4. Socket emite 'matchCompleted'
5. Se puede crear siguiente ronda
```

## 🔐 Seguridad

### Autenticación
- Código de administrador único por concurso
- Generado aleatoriamente (6 caracteres alfanuméricos)
- Requerido para todas las acciones admin

### Validaciones
- Votantes no pueden estar en el match actual
- Un voto por participante por match
- Puntajes en rango 0-10
- Solo admin puede ajustar scores y finalizar matches

### Protección de Datos
- Los participantes NO ven:
  - Código de admin
  - Puntajes totales
  - Bracket completo
- Solo admin ve toda la información

## ⚡ Optimizaciones

### Performance
- Prisma con connection pooling
- Socket.IO para reducir polling
- Next.js con SSR/ISR
- Tailwind CSS tree-shaking

### Escalabilidad
- Arquitectura desacoplada (Backend/Frontend separados)
- WebSocket con posibilidad de Redis adapter
- Base de datos indexada correctamente
- API RESTful stateless

## 📈 Posibles Mejoras Futuras

### Funcionales
- [ ] Sistema de categorías (pop, rock, etc.)
- [ ] Estadísticas avanzadas por participante
- [ ] Exportar resultados (PDF, Excel)
- [ ] Replay de concursos pasados
- [ ] Sistema de comentarios en tiempo real
- [ ] Integración con Spotify/YouTube
- [ ] Modo espectador (view-only)

### Técnicas
- [ ] Autenticación con JWT
- [ ] Rate limiting
- [ ] Caché con Redis
- [ ] CDN para assets estáticos
- [ ] Testing (Jest, Cypress)
- [ ] CI/CD pipeline
- [ ] Monitoring (Sentry, DataDog)
- [ ] Logs estructurados

### UX
- [ ] Animaciones en transiciones
- [ ] Dark mode
- [ ] PWA (instalable)
- [ ] Notificaciones push
- [ ] Modo offline con service workers
- [ ] Accesibilidad WCAG 2.1
- [ ] Internacionalización (i18n)

## 📦 Estructura de Archivos

```
karaoke-contest/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # Esquema de BD
│   ├── .env.example               # Variables de entorno
│   ├── package.json               # Dependencias
│   └── server.js                  # Servidor principal
│
├── frontend/
│   ├── app/
│   │   ├── admin/[id]/            # Panel admin
│   │   ├── contest/[id]/          # Registro participantes
│   │   ├── participant/[id]/      # Panel participante
│   │   ├── globals.css            # Estilos globales
│   │   ├── layout.js              # Layout principal
│   │   └── page.js                # Página home
│   ├── components/                # Componentes reutilizables
│   ├── lib/                       # Utilidades
│   ├── .env.example               # Variables de entorno
│   ├── next.config.js             # Config Next.js
│   ├── package.json               # Dependencias
│   ├── postcss.config.js          # Config PostCSS
│   └── tailwind.config.js         # Config Tailwind
│
├── .gitignore                     # Archivos a ignorar
├── API.md                         # Documentación API
├── DEPLOYMENT.md                  # Guía de despliegue
├── docker-compose.yml             # Docker para PostgreSQL
├── QUICKSTART.md                  # Inicio rápido
├── README.md                      # Documentación principal
├── setup.sh                       # Script de instalación
└── TECHNICAL.md                   # Este archivo
```

## 🧪 Testing (Recomendado para Producción)

### Backend
```bash
# Instalar dependencias de testing
npm install --save-dev jest supertest

# Ejemplo de test
describe('Contest API', () => {
  it('should create a contest', async () => {
    const response = await request(app)
      .post('/api/contest/create')
      .send({ name: 'Test Contest' })
    expect(response.status).toBe(200)
  })
})
```

### Frontend
```bash
# Instalar Cypress
npm install --save-dev cypress

# E2E tests
describe('Registration Flow', () => {
  it('should register a participant', () => {
    cy.visit('/contest/test-id')
    cy.get('input[name="name"]').type('Test User')
    cy.get('button[type="submit"]').click()
  })
})
```

## 📞 Soporte y Contribuciones

- **Issues**: Reporta bugs o solicita features
- **Pull Requests**: Contribuciones son bienvenidas
- **Documentación**: Mantén actualizado el README

## 📄 Licencia

MIT License - Libre para uso personal y comercial

---

**Desarrollado con 💜 para la comunidad de karaoke**

**Stack**: Node.js + Express + PostgreSQL + Prisma + Next.js + React + Tailwind + Socket.IO

**Última actualización**: 2024
