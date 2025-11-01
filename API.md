# 📡 Documentación de la API

Base URL: `http://localhost:3001/api`

## 🏁 Concursos

### Crear Concurso
```http
POST /contest/create
Content-Type: application/json

{
  "name": "Karaoke Night 2024"
}
```

**Respuesta:**
```json
{
  "contest": {
    "id": "uuid",
    "name": "Karaoke Night 2024",
    "adminCode": "ABC123",
    "status": "registration",
    "currentRound": 0,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Obtener Concurso
```http
GET /contest/:id
```

**Respuesta:**
```json
{
  "contest": {
    "id": "uuid",
    "name": "Karaoke Night 2024",
    "status": "in-progress",
    "currentRound": 1,
    "participants": [...],
    "rounds": [...]
  }
}
```

### Iniciar Concurso
```http
POST /contest/:id/start
Content-Type: application/json

{
  "adminCode": "ABC123"
}
```

### Agregar Ronda
```http
POST /contest/:id/add-round
Content-Type: application/json

{
  "adminCode": "ABC123",
  "type": "individual" // o "parejas"
}
```

## 👥 Participantes

### Registrar Participante
```http
POST /contest/:id/register
Content-Type: application/json

{
  "name": "La Voz Dorada"
}
```

**Respuesta:**
```json
{
  "participant": {
    "id": "uuid",
    "name": "La Voz Dorada",
    "contestId": "uuid",
    "isActive": true,
    "eliminated": false
  }
}
```

### Agregar Canción
```http
POST /participant/:participantId/song
Content-Type: application/json

{
  "roundNumber": 1,
  "title": "Bohemian Rhapsody",
  "artist": "Queen"
}
```

### Obtener Canciones del Participante
```http
GET /participant/:participantId/songs
```

### Obtener Canciones de una Ronda
```http
GET /contest/:contestId/round/:roundNumber/songs
```

## 🎯 Matches y Votación

### Votar
```http
POST /match/:matchId/vote
Content-Type: application/json

{
  "voterId": "uuid-del-votante",
  "participantId": "uuid-del-participante",
  "score": 8.5
}
```

**Validaciones:**
- El votante no puede estar en el match actual
- Score debe ser entre 0 y 10
- Un votante solo puede votar una vez por participante en cada match

### Ajustar Puntaje (Admin)
```http
POST /match/:matchId/adjust-score
Content-Type: application/json

{
  "adminCode": "ABC123",
  "participantId": "uuid",
  "adjustedScore": 9.0
}
```

### Finalizar Match (Admin)
```http
POST /match/:matchId/complete
Content-Type: application/json

{
  "adminCode": "ABC123"
}
```

**Resultado:**
- Determina ganadores basándose en puntajes
- Marca perdedores como eliminados
- Actualiza estado del match

## 🔌 WebSocket Events

### Cliente → Servidor

```javascript
// Unirse a un concurso
socket.emit('joinContest', contestId)
```

### Servidor → Cliente

```javascript
// Nuevo participante registrado
socket.on('participantRegistered', (participant) => {
  console.log('Nuevo participante:', participant)
})

// Concurso iniciado
socket.on('contestStarted', ({ round, matches }) => {
  console.log('Concurso iniciado con ronda:', round)
})

// Nueva ronda creada
socket.on('roundCreated', ({ round, matches }) => {
  console.log('Nueva ronda:', round)
})

// Voto enviado
socket.on('voteSubmitted', ({ match, vote }) => {
  console.log('Nuevo voto en match:', match.id)
})

// Match completado
socket.on('matchCompleted', ({ match }) => {
  console.log('Match finalizado:', match.id)
})

// Canción agregada
socket.on('songAdded', ({ song }) => {
  console.log('Nueva canción:', song.title)
})

// Puntaje ajustado
socket.on('scoreAdjusted', ({ match }) => {
  console.log('Puntaje ajustado en match:', match.id)
})
```

## 📊 Estructura de Datos

### Contest
```typescript
{
  id: string
  name: string
  adminCode: string
  status: 'registration' | 'in-progress' | 'finished'
  currentRound: number
  createdAt: Date
  participants: Participant[]
  rounds: Round[]
}
```

### Participant
```typescript
{
  id: string
  name: string
  contestId: string
  isActive: boolean
  eliminated: boolean
  createdAt: Date
}
```

### Round
```typescript
{
  id: string
  contestId: string
  roundNumber: number
  type: 'individual' | 'parejas'
  status: 'pending' | 'in-progress' | 'completed'
  matches: Match[]
}
```

### Match
```typescript
{
  id: string
  roundId: string
  matchNumber: number
  status: 'pending' | 'voting' | 'completed'
  participants: MatchParticipant[]
  votes: Vote[]
}
```

### Vote
```typescript
{
  id: string
  matchId: string
  voterId: string
  participantId: string
  score: number // 0-10
  createdAt: Date
}
```

### Song
```typescript
{
  id: string
  participantId: string
  roundNumber: number
  title: string
  artist: string | null
  createdAt: Date
}
```

## 🔒 Autenticación

El sistema usa un código de administrador único por concurso:
- Se genera al crear el concurso
- Se requiere para todas las acciones administrativas
- No es visible para los participantes

## ⚡ Códigos de Error

- `400` - Bad Request (validación fallida)
- `403` - Forbidden (código admin inválido)
- `404` - Not Found (recurso no encontrado)
- `500` - Internal Server Error

## 💡 Ejemplos de Uso

### Flujo Completo con cURL

```bash
# 1. Crear concurso
curl -X POST http://localhost:3001/api/contest/create \
  -H "Content-Type: application/json" \
  -d '{"name":"Mi Concurso"}'

# 2. Registrar participante
curl -X POST http://localhost:3001/api/contest/CONTEST_ID/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Participante 1"}'

# 3. Iniciar concurso
curl -X POST http://localhost:3001/api/contest/CONTEST_ID/start \
  -H "Content-Type: application/json" \
  -d '{"adminCode":"ABC123"}'

# 4. Votar
curl -X POST http://localhost:3001/api/match/MATCH_ID/vote \
  -H "Content-Type: application/json" \
  -d '{
    "voterId":"VOTER_ID",
    "participantId":"PARTICIPANT_ID",
    "score":8.5
  }'
```

### Ejemplo con JavaScript/Axios

```javascript
import axios from 'axios'

const API_URL = 'http://localhost:3001/api'

// Crear concurso
const createContest = async () => {
  const response = await axios.post(`${API_URL}/contest/create`, {
    name: 'Karaoke Night'
  })
  return response.data.contest
}

// Registrar participante
const registerParticipant = async (contestId, name) => {
  const response = await axios.post(
    `${API_URL}/contest/${contestId}/register`,
    { name }
  )
  return response.data.participant
}

// Votar
const vote = async (matchId, voterId, participantId, score) => {
  const response = await axios.post(
    `${API_URL}/match/${matchId}/vote`,
    { voterId, participantId, score }
  )
  return response.data
}
```
