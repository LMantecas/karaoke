# 🎤 Plataforma de Concurso de Karaoke

Sistema completo de concurso de karaoke con brackets, votación en tiempo real y panel de administración.

## 🚀 Características

- **Registro mediante QR**: Los participantes escanean un código QR y se registran con su nombre
- **Sistema de Brackets Automático**: Genera automáticamente el número de rondas según los participantes
- **Votación en Tiempo Real**: Todos los participantes pueden votar por otros (excepto en su propio match)
- **Panel de Administración**: Control completo del concurso, ajustes de puntajes, y visualización del bracket
- **Gestión de Canciones**: Los participantes pueden ingresar la canción que van a interpretar
- **Actualizaciones en Tiempo Real**: Usando Socket.IO para sincronización instantánea

## 🛠️ Stack Tecnológico

- **Backend**: Node.js + Express + Socket.IO + PostgreSQL
- **Frontend**: Next.js + React + Tailwind CSS + Socket.IO Client

## 📋 Instalación y Uso

Ver instrucciones detalladas en el README.md

## 🎯 Flujo del Concurso

1. Participantes se registran vía QR
2. Admin inicia concurso y se crea bracket
3. Rondas individuales con votación
4. Ganadores avanzan hasta determinar campeón

¡Diviértete organizando tu concurso de karaoke! 🎤🎵
