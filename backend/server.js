const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? 'https://tu-dominio.com' 
      : 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// Estado en memoria para el concurso activo
let activeContest = null;

// ============ FUNCIONES AUXILIARES ============

function calculateRounds(participantCount) {
  if (participantCount < 2) return 0;
  return Math.ceil(Math.log2(participantCount));
}

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

async function createBracket(contestId, participants, roundType = 'individual') {
  try {
    const shuffledParticipants = shuffleArray(participants);
    
    // Crear la ronda
    const roundResult = await db.query(
      'INSERT INTO rounds (contest_id, round_number, round_type, status) VALUES ($1, 1, $2, $3) RETURNING *',
      [contestId, roundType, 'in_progress']
    );
    const round = roundResult.rows[0];

    // Crear matches
    const matchCount = Math.ceil(shuffledParticipants.length / 2);
    
    for (let i = 0; i < matchCount; i++) {
      const matchResult = await db.query(
        'INSERT INTO matches (round_id, match_number, status) VALUES ($1, $2, $3) RETURNING *',
        [round.id, i + 1, 'pending']
      );
      const match = matchResult.rows[0];

      // Asignar participantes al match
      const participant1 = shuffledParticipants[i * 2];
      const participant2 = shuffledParticipants[i * 2 + 1];

      await db.query(
        'INSERT INTO match_participants (match_id, participant_id, performance_order) VALUES ($1, $2, $3)',
        [match.id, participant1.id, 1]
      );

      if (participant2) {
        await db.query(
          'INSERT INTO match_participants (match_id, participant_id, performance_order) VALUES ($1, $2, $3)',
          [match.id, participant2.id, 2]
        );
      }
    }

    return round;
  } catch (error) {
    console.error('Error creando bracket:', error);
    throw error;
  }
}

// ============ RUTAS API ============

// Crear nuevo concurso
app.post('/api/contest', async (req, res) => {
  try {
    const { name, adminPassword } = req.body;
    
    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return res.status(403).json({ error: 'Contraseña de administrador incorrecta' });
    }

    const result = await db.query(
      'INSERT INTO contests (name, status) VALUES ($1, $2) RETURNING *',
      [name, 'registration']
    );

    activeContest = result.rows[0];
    res.json(activeContest);
  } catch (error) {
    console.error('Error creando concurso:', error);
    res.status(500).json({ error: 'Error creando concurso' });
  }
});

// Obtener concurso activo
app.get('/api/contest/active', async (req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM contests WHERE status != 'finished' ORDER BY created_at DESC LIMIT 1"
    );
    
    if (result.rows.length > 0) {
      activeContest = result.rows[0];
      res.json(activeContest);
    } else {
      res.status(404).json({ error: 'No hay concurso activo' });
    }
  } catch (error) {
    console.error('Error obteniendo concurso:', error);
    res.status(500).json({ error: 'Error obteniendo concurso' });
  }
});

// Registrar participante
app.post('/api/participants', async (req, res) => {
  try {
    const { name, contestId } = req.body;
    
    if (!name || !contestId) {
      return res.status(400).json({ error: 'Nombre y contestId son requeridos' });
    }

    const participantCode = uuidv4().split('-')[0];

    const result = await db.query(
      'INSERT INTO participants (contest_id, name, participant_code) VALUES ($1, $2, $3) RETURNING *',
      [contestId, name, participantCode]
    );

    const participant = result.rows[0];
    
    // Notificar a todos via Socket.IO
    io.emit('participantRegistered', participant);
    
    res.json(participant);
  } catch (error) {
    console.error('Error registrando participante:', error);
    res.status(500).json({ error: 'Error registrando participante' });
  }
});

// Obtener participantes de un concurso
app.get('/api/contests/:contestId/participants', async (req, res) => {
  try {
    const { contestId } = req.params;
    const result = await db.query(
      'SELECT * FROM participants WHERE contest_id = $1 AND is_active = true ORDER BY created_at',
      [contestId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error obteniendo participantes:', error);
    res.status(500).json({ error: 'Error obteniendo participantes' });
  }
});

// Iniciar concurso y crear bracket
app.post('/api/contest/:contestId/start', async (req, res) => {
  try {
    const { contestId } = req.params;
    const { adminPassword, customRounds } = req.body;

    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return res.status(403).json({ error: 'Contraseña de administrador incorrecta' });
    }

    // Obtener participantes
    const participantsResult = await db.query(
      'SELECT * FROM participants WHERE contest_id = $1 AND is_active = true',
      [contestId]
    );
    const participants = participantsResult.rows;

    if (participants.length < 2) {
      return res.status(400).json({ error: 'Se necesitan al menos 2 participantes' });
    }

    const totalRounds = customRounds || calculateRounds(participants.length);

    // Actualizar concurso
    await db.query(
      'UPDATE contests SET status = $1, total_rounds = $2, current_round = 1 WHERE id = $3',
      ['in_progress', totalRounds, contestId]
    );

    // Crear bracket inicial (siempre individual)
    await createBracket(contestId, participants, 'individual');

    // Obtener estado completo
    const contestResult = await db.query('SELECT * FROM contests WHERE id = $1', [contestId]);
    activeContest = contestResult.rows[0];

    io.emit('contestStarted', { contest: activeContest });

    res.json({ success: true, contest: activeContest });
  } catch (error) {
    console.error('Error iniciando concurso:', error);
    res.status(500).json({ error: 'Error iniciando concurso' });
  }
});

// Obtener bracket completo (solo admin)
app.get('/api/contest/:contestId/bracket', async (req, res) => {
  try {
    const { contestId } = req.params;
    const { adminPassword } = req.query;

    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return res.status(403).json({ error: 'Solo admin puede ver el bracket completo' });
    }

    const rounds = await db.query(
      'SELECT * FROM rounds WHERE contest_id = $1 ORDER BY round_number',
      [contestId]
    );

    const bracket = [];
    for (const round of rounds.rows) {
      const matches = await db.query(
        'SELECT * FROM matches WHERE round_id = $1 ORDER BY match_number',
        [round.id]
      );

      const matchesWithParticipants = [];
      for (const match of matches.rows) {
        const matchParticipants = await db.query(
          `SELECT mp.*, p.name, p.participant_code 
           FROM match_participants mp
           JOIN participants p ON mp.participant_id = p.id
           WHERE mp.match_id = $1
           ORDER BY mp.performance_order`,
          [match.id]
        );

        matchesWithParticipants.push({
          ...match,
          participants: matchParticipants.rows
        });
      }

      bracket.push({
        ...round,
        matches: matchesWithParticipants
      });
    }

    res.json(bracket);
  } catch (error) {
    console.error('Error obteniendo bracket:', error);
    res.status(500).json({ error: 'Error obteniendo bracket' });
  }
});

// Obtener match actual para votación
app.get('/api/contest/:contestId/current-match', async (req, res) => {
  try {
    const { contestId } = req.params;

    const match = await db.query(
      `SELECT m.*, r.round_number 
       FROM matches m
       JOIN rounds r ON m.round_id = r.id
       WHERE r.contest_id = $1 AND m.status IN ('pending', 'voting')
       ORDER BY r.round_number, m.match_number
       LIMIT 1`,
      [contestId]
    );

    if (match.rows.length === 0) {
      return res.json({ match: null });
    }

    const currentMatch = match.rows[0];

    const participants = await db.query(
      `SELECT mp.*, p.name, p.participant_code 
       FROM match_participants mp
       JOIN participants p ON mp.participant_id = p.id
       WHERE mp.match_id = $1
       ORDER BY mp.performance_order`,
      [currentMatch.id]
    );

    res.json({
      match: {
        ...currentMatch,
        participants: participants.rows
      }
    });
  } catch (error) {
    console.error('Error obteniendo match actual:', error);
    res.status(500).json({ error: 'Error obteniendo match actual' });
  }
});

// Iniciar votación para un match
app.post('/api/match/:matchId/start-voting', async (req, res) => {
  try {
    const { matchId } = req.params;
    const { adminPassword } = req.body;

    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return res.status(403).json({ error: 'Solo admin puede iniciar votación' });
    }

    await db.query(
      'UPDATE matches SET status = $1 WHERE id = $2',
      ['voting', matchId]
    );

    io.emit('votingStarted', { matchId });
    res.json({ success: true });
  } catch (error) {
    console.error('Error iniciando votación:', error);
    res.status(500).json({ error: 'Error iniciando votación' });
  }
});

// Votar por un participante
app.post('/api/vote', async (req, res) => {
  try {
    const { matchId, voterCode, votedForId, score } = req.body;

    // Verificar que el votante existe
    const voter = await db.query(
      'SELECT * FROM participants WHERE participant_code = $1',
      [voterCode]
    );

    if (voter.rows.length === 0) {
      return res.status(404).json({ error: 'Votante no encontrado' });
    }

    const voterId = voter.rows[0].id;

    // Verificar que el votante no está en este match
    const voterInMatch = await db.query(
      'SELECT * FROM match_participants WHERE match_id = $1 AND participant_id = $2',
      [matchId, voterId]
    );

    if (voterInMatch.rows.length > 0) {
      return res.status(403).json({ error: 'No puedes votar en tu propio match' });
    }

    // Registrar voto (o actualizar si ya existe)
    await db.query(
      `INSERT INTO votes (match_id, voter_id, voted_for_id, score)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (match_id, voter_id, voted_for_id) 
       DO UPDATE SET score = $4`,
      [matchId, voterId, votedForId, score]
    );

    // Actualizar puntaje total del participante
    const totalScore = await db.query(
      'SELECT SUM(score) as total FROM votes WHERE voted_for_id = $1',
      [votedForId]
    );

    await db.query(
      'UPDATE match_participants SET total_score = $1 WHERE id = $2',
      [totalScore.rows[0].total || 0, votedForId]
    );

    io.emit('voteRegistered', { matchId, votedForId });

    res.json({ success: true });
  } catch (error) {
    console.error('Error registrando voto:', error);
    res.status(500).json({ error: 'Error registrando voto' });
  }
});

// Actualizar canción de participante
app.put('/api/match-participant/:id/song', async (req, res) => {
  try {
    const { id } = req.params;
    const { songName, participantCode } = req.body;

    // Verificar que el participante es quien dice ser
    const matchParticipant = await db.query(
      `SELECT mp.*, p.participant_code 
       FROM match_participants mp
       JOIN participants p ON mp.participant_id = p.id
       WHERE mp.id = $1`,
      [id]
    );

    if (matchParticipant.rows.length === 0) {
      return res.status(404).json({ error: 'Participante en match no encontrado' });
    }

    if (matchParticipant.rows[0].participant_code !== participantCode) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    await db.query(
      'UPDATE match_participants SET song_name = $1 WHERE id = $2',
      [songName, id]
    );

    io.emit('songUpdated', { matchParticipantId: id, songName });

    res.json({ success: true });
  } catch (error) {
    console.error('Error actualizando canción:', error);
    res.status(500).json({ error: 'Error actualizando canción' });
  }
});

// Ajustar puntaje (solo admin)
app.post('/api/match-participant/:id/adjust-score', async (req, res) => {
  try {
    const { id } = req.params;
    const { adjustment, reason, adminPassword } = req.body;

    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return res.status(403).json({ error: 'Solo admin puede ajustar puntajes' });
    }

    await db.query(
      'UPDATE match_participants SET adjusted_score = adjusted_score + $1 WHERE id = $2',
      [adjustment, id]
    );

    await db.query(
      'INSERT INTO admin_adjustments (match_participant_id, adjustment_amount, reason) VALUES ($1, $2, $3)',
      [id, adjustment, reason]
    );

    io.emit('scoreAdjusted', { matchParticipantId: id, adjustment });

    res.json({ success: true });
  } catch (error) {
    console.error('Error ajustando puntaje:', error);
    res.status(500).json({ error: 'Error ajustando puntaje' });
  }
});

// Finalizar match y determinar ganador
app.post('/api/match/:matchId/finish', async (req, res) => {
  try {
    const { matchId } = req.params;
    const { adminPassword } = req.body;

    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return res.status(403).json({ error: 'Solo admin puede finalizar match' });
    }

    // Obtener participantes del match con puntajes
    const participants = await db.query(
      `SELECT * FROM match_participants 
       WHERE match_id = $1 
       ORDER BY (total_score + adjusted_score) DESC`,
      [matchId]
    );

    if (participants.rows.length > 0) {
      const winnerId = participants.rows[0].id;
      await db.query(
        'UPDATE match_participants SET is_winner = true WHERE id = $1',
        [winnerId]
      );
    }

    await db.query(
      'UPDATE matches SET status = $1 WHERE id = $2',
      ['completed', matchId]
    );

    // Verificar si todos los matches de la ronda están completos
    const matchInfo = await db.query(
      'SELECT round_id FROM matches WHERE id = $1',
      [matchId]
    );
    const roundId = matchInfo.rows[0].round_id;

    const pendingMatches = await db.query(
      'SELECT COUNT(*) as count FROM matches WHERE round_id = $1 AND status != $2',
      [roundId, 'completed']
    );

    // Si todos los matches están completos, crear siguiente ronda
    if (parseInt(pendingMatches.rows[0].count) === 0) {
      await createNextRound(roundId);
    }

    io.emit('matchFinished', { matchId });

    res.json({ success: true });
  } catch (error) {
    console.error('Error finalizando match:', error);
    res.status(500).json({ error: 'Error finalizando match' });
  }
});

// Función para crear la siguiente ronda
async function createNextRound(currentRoundId) {
  try {
    // Obtener información de la ronda actual
    const currentRound = await db.query(
      'SELECT * FROM rounds WHERE id = $1',
      [currentRoundId]
    );
    
    if (currentRound.rows.length === 0) return;

    const round = currentRound.rows[0];
    const contestId = round.contest_id;
    
    // Verificar si ya llegamos al número total de rondas
    const contest = await db.query(
      'SELECT * FROM contests WHERE id = $1',
      [contestId]
    );
    
    if (contest.rows.length === 0) return;
    
    const currentRoundNumber = round.round_number;
    const totalRounds = contest.rows[0].total_rounds;
    
    // Si ya completamos todas las rondas, terminar el concurso
    if (currentRoundNumber >= totalRounds) {
      await db.query(
        'UPDATE contests SET status = $1 WHERE id = $2',
        ['finished', contestId]
      );
      io.emit('contestFinished', { contestId });
      return;
    }

    // Obtener ganadores de la ronda actual
    const winners = await db.query(
      `SELECT DISTINCT p.* 
       FROM participants p
       JOIN match_participants mp ON mp.participant_id = p.id
       JOIN matches m ON m.id = mp.match_id
       WHERE m.round_id = $1 AND mp.is_winner = true`,
      [currentRoundId]
    );

    if (winners.rows.length < 2) {
      // Si solo hay un ganador, es el campeón
      await db.query(
        'UPDATE contests SET status = $1 WHERE id = $2',
        ['finished', contestId]
      );
      io.emit('contestFinished', { contestId });
      return;
    }

    // Crear nueva ronda
    const nextRoundNumber = currentRoundNumber + 1;
    const newRound = await db.query(
      'INSERT INTO rounds (contest_id, round_number, round_type, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [contestId, nextRoundNumber, 'individual', 'pending']
    );

    // Actualizar ronda actual del concurso
    await db.query(
      'UPDATE contests SET current_round = $1 WHERE id = $2',
      [nextRoundNumber, contestId]
    );

    // Crear matches para la nueva ronda
    const shuffledWinners = shuffleArray(winners.rows);
    const matchCount = Math.ceil(shuffledWinners.length / 2);
    
    for (let i = 0; i < matchCount; i++) {
      const matchResult = await db.query(
        'INSERT INTO matches (round_id, match_number, status) VALUES ($1, $2, $3) RETURNING *',
        [newRound.rows[0].id, i + 1, 'pending']
      );
      const match = matchResult.rows[0];

      const participant1 = shuffledWinners[i * 2];
      const participant2 = shuffledWinners[i * 2 + 1];

      await db.query(
        'INSERT INTO match_participants (match_id, participant_id, performance_order) VALUES ($1, $2, $3)',
        [match.id, participant1.id, 1]
      );

      if (participant2) {
        await db.query(
          'INSERT INTO match_participants (match_id, participant_id, performance_order) VALUES ($1, $2, $3)',
          [match.id, participant2.id, 2]
        );
      }
    }

    io.emit('nextRoundCreated', { contestId, roundNumber: nextRoundNumber });
    console.log(`✅ Ronda ${nextRoundNumber} creada con ${matchCount} matches`);
  } catch (error) {
    console.error('Error creando siguiente ronda:', error);
  }
}

// ============ SOCKET.IO ============

io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });

  socket.on('joinContest', (contestId) => {
    socket.join(`contest_${contestId}`);
  });
});

// ============ INICIAR SERVIDOR ============

server.listen(PORT, () => {
  console.log(`🎤 Servidor de karaoke corriendo en puerto ${PORT}`);
});