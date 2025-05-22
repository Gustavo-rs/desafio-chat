import React, { useState } from 'react';
import Button from '../components/Button/ButtonComponent';

const Home: React.FC = () => {
  const [rooms, setRooms] = useState<string[]>(['Geral', 'Suporte', 'Dev']);

  const createRoom = () => {
    const roomName = prompt('Nome da nova sala:');
    if (roomName) {
      setRooms([...rooms, roomName]);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-100">
      <h1 className="text-3xl font-bold mb-4">Bem-vindo ao Chat</h1>

      <Button onClick={createRoom}>Criar nova sala</Button>

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Salas disponíveis:</h2>
        <ul className="list-disc list-inside">
          {rooms.map((room, index) => (
            <li key={index} className="text-gray-700">{room}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Home;
