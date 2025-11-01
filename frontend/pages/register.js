import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { contestAPI, participantAPI } from '../lib/api';

export default function Register() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [contest, setContest] = useState(null);

  useEffect(() => {
    loadContest();
  }, []);

  const loadContest = async () => {
    try {
      const response = await contestAPI.getActiveContest();
      setContest(response.data);
    } catch (error) {
      setError('No hay concurso activo en este momento');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Por favor ingresa tu nombre');
      return;
    }

    if (!contest) {
      setError('No hay concurso activo');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await participantAPI.register(name, contest.id);
      const participant = response.data;
      
      // Guardar código en localStorage
      localStorage.setItem('participantCode', participant.participant_code);
      localStorage.setItem('participantId', participant.id);
      localStorage.setItem('participantName', participant.name);

      // Redirigir a sala de espera
      router.push('/participant');
    } catch (error) {
      setError('Error al registrarse. Intenta de nuevo.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Registro - Karaoke Night</title>
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
            <h1 className="text-4xl font-bold mb-2">Registro</h1>
            <p className="text-gray-400">
              {contest ? `Concurso: ${contest.name}` : 'Cargando...'}
            </p>
          </div>

          <div className="card">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  ¿Cómo quieres que te llamen?
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Juan El Rockero"
                  className="input"
                  maxLength={50}
                  disabled={loading || !contest}
                />
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              {contest && contest.status !== 'registration' && (
                <div className="bg-yellow-500/20 border border-yellow-500 text-yellow-200 px-4 py-3 rounded-lg">
                  El concurso ya comenzó. No se pueden registrar más participantes.
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !contest || contest.status !== 'registration'}
                className="w-full btn-primary"
              >
                {loading ? 'Registrando...' : 'Registrarme'}
              </button>
            </form>
          </div>

          <div className="mt-6 text-center text-gray-400 text-sm">
            <p>Una vez registrado, espera a que el administrador inicie el concurso</p>
          </div>
        </div>
      </div>
    </>
  );
}
