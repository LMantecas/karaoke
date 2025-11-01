import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { QRCodeSVG } from 'qrcode.react';
import { contestAPI, participantAPI, votingAPI } from '../lib/api';
import { getSocket } from '../lib/socket';

export default function Admin() {
  const router = useRouter();
  const [adminPassword, setAdminPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [contest, setContest] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [bracket, setBracket] = useState([]);
  const [currentMatch, setCurrentMatch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [newContestName, setNewContestName] = useState('');
  const [customRounds, setCustomRounds] = useState('');
  const [activeTab, setActiveTab] = useState('registration'); // registration, bracket, control

  // Restaurar sesión del admin al cargar
  useEffect(() => {
    const savedPassword = localStorage.getItem('adminPassword');
    const savedAuth = localStorage.getItem('isAdminAuthenticated');
    
    if (savedPassword && savedAuth === 'true') {
      setAdminPassword(savedPassword);
      setIsAuthenticated(true);
      loadContest();
    }
  }, []);

  useEffect(() => {
    const socket = getSocket();
    
    socket.on('participantRegistered', (participant) => {
      setParticipants(prev => [...prev, participant]);
    });

    socket.on('voteRegistered', () => {
      if (contest && adminPassword) {
        loadBracket();
        loadCurrentMatch(contest.id);
      }
    });

    socket.on('votingStarted', () => {
      if (contest) {
        loadCurrentMatch(contest.id);
      }
    });

    socket.on('matchFinished', () => {
      if (contest && adminPassword) {
        loadBracket();
        loadCurrentMatch(contest.id);
        loadContest();
      }
    });

    socket.on('nextRoundCreated', () => {
      if (contest && adminPassword) {
        loadBracket();
        loadCurrentMatch(contest.id);
        loadContest();
        alert('¡Nueva ronda creada! Los ganadores avanzaron.');
      }
    });

    socket.on('contestFinished', () => {
      if (contest) {
        loadContest();
        alert('¡Concurso finalizado! Ya tenemos un campeón 🏆');
      }
    });

    socket.on('scoreAdjusted', () => {
      if (contest && adminPassword) {
        loadBracket();
        loadCurrentMatch(contest.id);
      }
    });

    return () => {
      socket.off('participantRegistered');
      socket.off('voteRegistered');
      socket.off('votingStarted');
      socket.off('matchFinished');
      socket.off('nextRoundCreated');
      socket.off('contestFinished');
      socket.off('scoreAdjusted');
    };
  }, [contest, adminPassword]);

  const handleLogin = () => {
    if (adminPassword === process.env.NEXT_PUBLIC_ADMIN_PASSWORD || adminPassword === 'admin123') {
      setIsAuthenticated(true);
      // Guardar sesión en localStorage
      localStorage.setItem('adminPassword', adminPassword);
      localStorage.setItem('isAdminAuthenticated', 'true');
      loadContest();
    } else {
      alert('Contraseña incorrecta');
    }
  };

  const loadContest = async () => {
    try {
      const response = await contestAPI.getActiveContest();
      setContest(response.data);
      loadParticipants(response.data.id);
      
      if (response.data.status === 'in_progress') {
        loadBracket();
        loadCurrentMatch(response.data.id);
      }
    } catch (error) {
      console.log('No hay concurso activo');
    }
  };

  const loadParticipants = async (contestId) => {
    try {
      const response = await participantAPI.getParticipants(contestId);
      setParticipants(response.data);
    } catch (error) {
      console.error('Error cargando participantes:', error);
    }
  };

  const loadBracket = async () => {
    try {
      const response = await contestAPI.getBracket(contest.id, adminPassword);
      setBracket(response.data);
    } catch (error) {
      console.error('Error cargando bracket:', error);
    }
  };

  const loadCurrentMatch = async (contestId) => {
    try {
      const response = await contestAPI.getCurrentMatch(contestId);
      setCurrentMatch(response.data.match);
    } catch (error) {
      console.error('Error cargando match actual:', error);
    }
  };

  const handleCreateContest = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await contestAPI.createContest(newContestName, adminPassword);
      setContest(response.data);
      setNewContestName('');
      alert('¡Concurso creado!');
    } catch (error) {
      alert('Error creando concurso');
    } finally {
      setLoading(false);
    }
  };

  const handleStartContest = async () => {
    if (participants.length < 2) {
      alert('Se necesitan al menos 2 participantes');
      return;
    }

    if (!confirm('¿Iniciar el concurso? No se podrán registrar más participantes.')) {
      return;
    }

    setLoading(true);
    
    try {
      await contestAPI.startContest(
        contest.id, 
        adminPassword, 
        customRounds ? parseInt(customRounds) : null
      );
      loadContest();
      setActiveTab('control');
      alert('¡Concurso iniciado!');
    } catch (error) {
      alert('Error iniciando concurso');
    } finally {
      setLoading(false);
    }
  };

  const handleStartVoting = async (matchId) => {
    try {
      await votingAPI.startVoting(matchId, adminPassword);
      loadCurrentMatch(contest.id);
      alert('¡Votación iniciada!');
    } catch (error) {
      alert('Error iniciando votación');
    }
  };

  const handleFinishMatch = async (matchId) => {
    if (!confirm('¿Finalizar este match? Se determinará el ganador.')) {
      return;
    }

    try {
      await votingAPI.finishMatch(matchId, adminPassword);
      loadBracket();
      loadCurrentMatch(contest.id);
      alert('Match finalizado');
    } catch (error) {
      alert('Error finalizando match');
    }
  };

  const handleAdjustScore = async (matchParticipantId, currentScore) => {
    const adjustment = prompt('Ingrese el ajuste de puntaje (positivo o negativo):');
    if (adjustment === null) return;

    const adjustmentNum = parseFloat(adjustment);
    if (isNaN(adjustmentNum)) {
      alert('Debe ingresar un número válido');
      return;
    }

    const reason = prompt('Razón del ajuste:');
    if (!reason) return;

    try {
      await votingAPI.adjustScore(matchParticipantId, adjustmentNum, reason, adminPassword);
      loadBracket();
      alert('Puntaje ajustado');
    } catch (error) {
      alert('Error ajustando puntaje');
    }
  };

  if (!isAuthenticated) {
    return (
      <>
        <Head>
          <title>Admin Login - Karaoke Night</title>
        </Head>
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="max-w-md w-full">
            <button
              onClick={() => router.push('/')}
              className="mb-4 text-gray-400 hover:text-white flex items-center"
            >
              ← Volver
            </button>
            
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-2">Admin</h1>
              <p className="text-gray-400">Acceso solo para administradores</p>
            </div>

            <div className="card">
              <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Contraseña de Administrador
                  </label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input"
                  />
                </div>
                <button type="submit" className="w-full btn-primary">
                  Ingresar
                </button>
              </form>
            </div>
          </div>
        </div>
      </>
    );
  }

  const registrationUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/register` 
    : '';

  return (
    <>
      <Head>
        <title>Panel Admin - Karaoke Night</title>
      </Head>

      <div className="min-h-screen p-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex justify-between items-center">
            <h1 className="text-3xl font-bold">Panel de Administración 👨‍💼</h1>
            <button
              onClick={() => {
                setIsAuthenticated(false);
                setAdminPassword('');
                localStorage.removeItem('adminPassword');
                localStorage.removeItem('isAdminAuthenticated');
              }}
              className="text-red-400 hover:text-red-300"
            >
              Cerrar Sesión
            </button>
          </div>

          {!contest && (
            <div className="card max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-4">Crear Nuevo Concurso</h2>
              <form onSubmit={handleCreateContest} className="space-y-4">
                <input
                  type="text"
                  value={newContestName}
                  onChange={(e) => setNewContestName(e.target.value)}
                  placeholder="Nombre del concurso"
                  className="input"
                  required
                />
                <button type="submit" className="btn-primary w-full" disabled={loading}>
                  {loading ? 'Creando...' : 'Crear Concurso'}
                </button>
              </form>
            </div>
          )}

          {contest && (
            <>
              <div className="mb-6 flex gap-2">
                <button
                  onClick={() => setActiveTab('registration')}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    activeTab === 'registration'
                      ? 'bg-primary text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Registro
                </button>
                {contest.status !== 'registration' && (
                  <>
                    <button
                      onClick={() => setActiveTab('control')}
                      className={`px-4 py-2 rounded-lg font-medium ${
                        activeTab === 'control'
                          ? 'bg-primary text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      Control de Match
                    </button>
                    <button
                      onClick={() => { setActiveTab('bracket'); loadBracket(); }}
                      className={`px-4 py-2 rounded-lg font-medium ${
                        activeTab === 'bracket'
                          ? 'bg-primary text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      Bracket Completo
                    </button>
                  </>
                )}
              </div>

              {activeTab === 'registration' && (
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="card">
                    <h2 className="text-2xl font-bold mb-4">{contest.name}</h2>
                    <div className="space-y-2 text-sm mb-6">
                      <p>Estado: <span className="font-bold text-primary">{contest.status}</span></p>
                      <p>Participantes: <span className="font-bold">{participants.length}</span></p>
                      {contest.status === 'in_progress' && (
                        <>
                          <p>Ronda actual: {contest.current_round} de {contest.total_rounds}</p>
                        </>
                      )}
                    </div>

                    {contest.status === 'registration' && (
                      <>
                        <div className="bg-gray-700 p-4 rounded-lg mb-4">
                          <p className="text-center mb-2 font-medium">
                            Código QR para registro:
                          </p>
                          <div className="flex justify-center bg-white p-4 rounded">
                            <QRCodeSVG value={registrationUrl} size={200} />
                          </div>
                          <p className="text-center mt-2 text-xs text-gray-400 break-all">
                            {registrationUrl}
                          </p>
                        </div>

                        <div className="space-y-2 mb-4">
                          <label className="text-sm font-medium">
                            Número de rondas (opcional - se calcula automático)
                          </label>
                          <input
                            type="number"
                            value={customRounds}
                            onChange={(e) => setCustomRounds(e.target.value)}
                            placeholder="Auto"
                            className="input"
                            min="1"
                          />
                        </div>

                        <button
                          onClick={handleStartContest}
                          disabled={loading || participants.length < 2}
                          className="w-full btn-secondary"
                        >
                          Iniciar Concurso
                        </button>
                      </>
                    )}
                  </div>

                  <div className="card">
                    <h3 className="text-xl font-bold mb-4">
                      Participantes Registrados ({participants.length})
                    </h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {participants.map((p, index) => (
                        <div
                          key={p.id}
                          className="bg-gray-700/50 p-3 rounded-lg flex justify-between items-center"
                        >
                          <div>
                            <span className="font-bold">{index + 1}. {p.name}</span>
                            <p className="text-xs text-gray-400">
                              Código: {p.participant_code}
                            </p>
                          </div>
                          {p.is_active ? (
                            <span className="text-green-400 text-sm">✓ Activo</span>
                          ) : (
                            <span className="text-red-400 text-sm">✗ Eliminado</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'control' && currentMatch && (
                <div className="card max-w-4xl mx-auto">
                  <h2 className="text-2xl font-bold mb-4">
                    Control de Match {currentMatch.match_number} - Ronda {currentMatch.round_number}
                  </h2>

                  <div className="mb-4 flex gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      currentMatch.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                      currentMatch.status === 'voting' ? 'bg-green-500/20 text-green-300' :
                      'bg-blue-500/20 text-blue-300'
                    }`}>
                      {currentMatch.status === 'pending' ? 'Pendiente' :
                       currentMatch.status === 'voting' ? 'Votación Activa' :
                       'Completado'}
                    </span>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    {currentMatch.participants.map((p) => (
                      <div key={p.id} className="bg-gray-700/50 p-4 rounded-lg">
                        <h3 className="text-xl font-bold mb-2">{p.name}</h3>
                        {p.song_name && (
                          <p className="text-sm text-gray-300 mb-2">🎵 {p.song_name}</p>
                        )}
                        <div className="space-y-2">
                          <p className="text-sm">
                            Puntos totales: <span className="font-bold text-primary text-lg">
                              {(parseFloat(p.total_score) + parseFloat(p.adjusted_score)).toFixed(2)}
                            </span>
                          </p>
                          {parseFloat(p.adjusted_score) !== 0 && (
                            <p className="text-xs text-yellow-300">
                              Ajuste: {p.adjusted_score > 0 ? '+' : ''}{p.adjusted_score}
                            </p>
                          )}
                          {p.is_winner && (
                            <span className="inline-block px-3 py-1 bg-yellow-500 text-gray-900 rounded-full text-sm font-bold">
                              🏆 Ganador
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleAdjustScore(p.id, parseFloat(p.total_score) + parseFloat(p.adjusted_score))}
                          className="mt-3 text-sm bg-gray-600 hover:bg-gray-500 px-3 py-1 rounded"
                        >
                          Ajustar Puntaje
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    {currentMatch.status === 'pending' && (
                      <button
                        onClick={() => handleStartVoting(currentMatch.id)}
                        className="btn-primary flex-1"
                      >
                        Iniciar Votación
                      </button>
                    )}
                    {currentMatch.status === 'voting' && (
                      <button
                        onClick={() => handleFinishMatch(currentMatch.id)}
                        className="btn-secondary flex-1"
                      >
                        Finalizar Match
                      </button>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'bracket' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold">Bracket Completo</h2>
                  {bracket.map((round) => (
                    <div key={round.id} className="card">
                      <h3 className="text-xl font-bold mb-4">
                        Ronda {round.round_number} - {round.round_type}
                        <span className="ml-2 text-sm font-normal text-gray-400">
                          ({round.status})
                        </span>
                      </h3>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {round.matches.map((match) => (
                          <div key={match.id} className="bg-gray-700/50 p-4 rounded-lg">
                            <h4 className="font-bold mb-2">
                              Match {match.match_number}
                              <span className="ml-2 text-sm font-normal text-gray-400">
                                ({match.status})
                              </span>
                            </h4>
                            <div className="space-y-2">
                              {match.participants.map((p) => (
                                <div
                                  key={p.id}
                                  className={`p-2 rounded ${
                                    p.is_winner ? 'bg-yellow-500/20 border border-yellow-500' : 'bg-gray-800'
                                  }`}
                                >
                                  <p className="font-medium">{p.name}</p>
                                  {p.song_name && (
                                    <p className="text-xs text-gray-400">🎵 {p.song_name}</p>
                                  )}
                                  <p className="text-sm text-primary">
                                    {(parseFloat(p.total_score) + parseFloat(p.adjusted_score)).toFixed(2)} pts
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}