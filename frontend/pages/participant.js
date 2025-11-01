import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { contestAPI, votingAPI, participantAPI } from '../lib/api';
import { getSocket } from '../lib/socket';

export default function Participant() {
  const router = useRouter();
  const [participantCode, setParticipantCode] = useState('');
  const [participantName, setParticipantName] = useState('');
  const [contest, setContest] = useState(null);
  const [currentMatch, setCurrentMatch] = useState(null);
  const [votes, setVotes] = useState({});
  const [songName, setSongName] = useState('');
  const [isInCurrentMatch, setIsInCurrentMatch] = useState(false);
  const [notification, setNotification] = useState('');

  useEffect(() => {
    const code = localStorage.getItem('participantCode');
    const name = localStorage.getItem('participantName');
    
    if (!code || !name) {
      router.push('/register');
      return;
    }

    setParticipantCode(code);
    setParticipantName(name);
    
    loadContest();
    
    const socket = getSocket();
    
    socket.on('votingStarted', () => {
      loadCurrentMatch();
    });
    
    socket.on('matchFinished', () => {
      loadCurrentMatch();
    });
    
    socket.on('contestStarted', () => {
      loadContest();
      loadCurrentMatch();
    });

    socket.on('nextRoundCreated', () => {
      loadContest();
      loadCurrentMatch();
      setNotification('¡Nueva ronda comenzó! Revisa si pasaste.');
      setTimeout(() => setNotification(''), 5000);
    });

    socket.on('contestFinished', () => {
      loadContest();
      setNotification('¡El concurso ha terminado! 🏆');
    });

    return () => {
      socket.off('votingStarted');
      socket.off('matchFinished');
      socket.off('contestStarted');
      socket.off('nextRoundCreated');
      socket.off('contestFinished');
    };
  }, []);

  const loadContest = async () => {
    try {
      const response = await contestAPI.getActiveContest();
      setContest(response.data);
      loadCurrentMatch();
    } catch (error) {
      console.error('Error cargando concurso:', error);
    }
  };

  const loadCurrentMatch = async () => {
    try {
      const contestRes = await contestAPI.getActiveContest();
      const matchRes = await contestAPI.getCurrentMatch(contestRes.data.id);
      
      if (matchRes.data.match) {
        setCurrentMatch(matchRes.data.match);
        
        // Verificar si estoy en este match
        const participantId = localStorage.getItem('participantId');
        const inMatch = matchRes.data.match.participants.some(
          p => p.participant_id === parseInt(participantId)
        );
        setIsInCurrentMatch(inMatch);

        // Si estoy en este match, cargar mi canción
        if (inMatch) {
          const myParticipation = matchRes.data.match.participants.find(
            p => p.participant_id === parseInt(participantId)
          );
          if (myParticipation?.song_name) {
            setSongName(myParticipation.song_name);
          }
        }
      } else {
        setCurrentMatch(null);
      }
    } catch (error) {
      console.error('Error cargando match actual:', error);
    }
  };

  const handleVote = async (matchParticipantId, score) => {
    try {
      await votingAPI.vote(currentMatch.id, participantCode, matchParticipantId, score);
      setVotes({ ...votes, [matchParticipantId]: score });
    } catch (error) {
      alert('Error al votar: ' + (error.response?.data?.error || 'Error desconocido'));
    }
  };

  const handleUpdateSong = async (matchParticipantId) => {
    if (!songName.trim()) {
      alert('Por favor ingresa el nombre de tu canción');
      return;
    }

    try {
      await participantAPI.updateSong(matchParticipantId, songName, participantCode);
      alert('¡Canción actualizada!');
    } catch (error) {
      alert('Error al actualizar canción');
    }
  };

  if (!contest) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Panel de Participante - Karaoke Contest</title>
      </Head>

      <div className="min-h-screen p-4">
        <div className="max-w-4xl mx-auto">
          {notification && (
            <div className="fixed top-4 right-4 bg-primary text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-pulse">
              {notification}
            </div>
          )}
          
          <div className="mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold">¡Hola, {participantName}! 🎤</h1>
                <p className="text-gray-400">Concurso: {contest.name}</p>
              </div>
              <button
                onClick={() => {
                  localStorage.clear();
                  router.push('/');
                }}
                className="text-red-400 hover:text-red-300"
              >
                Salir
              </button>
            </div>
          </div>

          {contest.status === 'registration' && (
            <div className="card text-center">
              <div className="text-6xl mb-4">⏳</div>
              <h2 className="text-2xl font-bold mb-2">Esperando inicio...</h2>
              <p className="text-gray-400">
                El administrador iniciará el concurso pronto
              </p>
            </div>
          )}

          {contest.status === 'in_progress' && !currentMatch && (
            <div className="card text-center">
              <div className="text-6xl mb-4">🎵</div>
              <h2 className="text-2xl font-bold mb-2">Preparando siguiente match...</h2>
              <p className="text-gray-400">El administrador está configurando la siguiente ronda</p>
            </div>
          )}

          {contest.status === 'in_progress' && currentMatch && (
            <div className="space-y-6">
              <div className="card">
                <h2 className="text-xl font-bold mb-4">
                  Match {currentMatch.match_number} - Ronda {currentMatch.round_number}
                </h2>
                
                {isInCurrentMatch && (
                  <div className="bg-yellow-500/20 border border-yellow-500 text-yellow-200 px-4 py-3 rounded-lg mb-4">
                    <p className="font-bold">¡Es tu turno! 🎤</p>
                    <p className="text-sm">Ingresa la canción que vas a cantar</p>
                  </div>
                )}

                {currentMatch.status === 'pending' && (
                  <div className="text-center py-8">
                    <p className="text-gray-400">El match aún no ha comenzado</p>
                  </div>
                )}

                {currentMatch.status === 'voting' && !isInCurrentMatch && (
                  <div>
                    <p className="text-gray-400 mb-4">Vota por los participantes (1-10 puntos)</p>
                    <div className="space-y-4">
                      {currentMatch.participants.map((participant) => (
                        <div key={participant.id} className="bg-gray-700/50 p-4 rounded-lg">
                          <div className="flex justify-between items-center mb-3">
                            <div>
                              <h3 className="font-bold text-lg">{participant.name}</h3>
                              {participant.song_name && (
                                <p className="text-sm text-gray-400">
                                  🎵 {participant.song_name}
                                </p>
                              )}
                            </div>
                            {votes[participant.id] && (
                              <span className="text-primary font-bold">
                                ✓ {votes[participant.id]} pts
                              </span>
                            )}
                          </div>
                          
                          <div className="flex gap-2 flex-wrap">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                              <button
                                key={score}
                                onClick={() => handleVote(participant.id, score)}
                                className={`px-3 py-2 rounded ${
                                  votes[participant.id] === score
                                    ? 'bg-primary text-white'
                                    : 'bg-gray-600 hover:bg-gray-500'
                                }`}
                              >
                                {score}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {isInCurrentMatch && currentMatch.status === 'voting' && (
                  <div className="text-center py-8 bg-purple-500/20 rounded-lg">
                    <p className="text-xl font-bold mb-2">🎤 ¡Es tu turno!</p>
                    <p className="text-gray-300">No puedes votar en tu propio match</p>
                  </div>
                )}
              </div>

              {isInCurrentMatch && (
                <div className="card">
                  <h3 className="text-lg font-bold mb-4">Tu canción para este match</h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={songName}
                      onChange={(e) => setSongName(e.target.value)}
                      placeholder="Ej: Bohemian Rhapsody - Queen"
                      className="input flex-1"
                    />
                    <button
                      onClick={() => {
                        const myParticipation = currentMatch.participants.find(
                          p => p.participant_id === parseInt(localStorage.getItem('participantId'))
                        );
                        if (myParticipation) {
                          handleUpdateSong(myParticipation.id);
                        }
                      }}
                      className="btn-primary"
                    >
                      Actualizar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {contest.status === 'finished' && (
            <div className="card text-center">
              <div className="text-6xl mb-4">🏆</div>
              <h2 className="text-2xl font-bold mb-2">¡Concurso Finalizado!</h2>
              <p className="text-gray-400">Gracias por participar</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}