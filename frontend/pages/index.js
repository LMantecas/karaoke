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
          </div>

          <div className="card space-y-4">
            <button
              onClick={() => router.push('/admin')}
              className="w-full btn-primary text-lg"
            >
              Soy Administrador
            </button>

            <button
              onClick={() => router.push('/register')}
              className="w-full btn-secondary text-lg"
            >
              Quiero Participar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
