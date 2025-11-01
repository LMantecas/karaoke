import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Home() {
  const router = useRouter();
  const [role, setRole] = useState('');

  return (
    <>
      <Head>
        <title>Concurso de Karaoke</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              🎤 Karaoke Contest
            </h1>
            <p className="text-gray-400 text-lg">
              Plataforma de concurso de karaoke con votación en tiempo real
            </p>
          </div>

          <div className="card space-y-4">
            <button
              onClick={() => router.push('/admin')}
              className="w-full btn-primary text-lg"
            >
              👨‍💼 Soy Administrador
            </button>

            <button
              onClick={() => router.push('/register')}
              className="w-full btn-secondary text-lg"
            >
              🎵 Quiero Participar
            </button>
          </div>

          <div className="mt-8 text-center text-gray-500 text-sm">
            <p>Desarrollado con Next.js, Socket.IO y PostgreSQL</p>
          </div>
        </div>
      </div>
    </>
  );
}
