import React, { useEffect, useState } from "react";
import { useUser } from "../store/auth-store";
import type { APIRoom } from "@/types/api";
import roomsService from "@/services/rooms-service";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import ChatPage from "./chat/ChatPage";

const Home: React.FC = () => {
  const [rooms, setRooms] = useState<APIRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState<number>();
  const [selectedRoomName, setSelectedRoomName] = useState<string>();
  const { user } = useUser();
  const [open, setOpen] = useState(false);

  const handleRooms = async () => {
    setLoading(true);

    try {
      const response = await roomsService.list();

      setRooms(response);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async () => {
    if (!roomName) {
      toast.error("Nome da sala é obrigatório");
      return;
    }

    setIsCreatingRoom(true);

    try {
      const response = await roomsService.create({ name: roomName });
      setRooms([...rooms, response]);
      setOpen(false);
      setRoomName("");
    } finally {
      setIsCreatingRoom(false);
    }
  };

  useEffect(() => {
    handleRooms();
  }, []);

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Lista de salas (30%) */}
      <div className="w-[30%] p-4 bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Salas</h2>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-sm text-primary border-primary"
              >
                Nova sala
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[475px]">
              <DialogHeader>
                <DialogTitle>Nova sala</DialogTitle>
                <DialogDescription>
                  Crie uma nova sala para começar a conversar.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Input
                  placeholder="Nome da sala"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                />
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DialogClose>
                <Button
                  variant="default"
                  className="text-white"
                  onClick={handleCreateRoom}
                  disabled={isCreatingRoom}
                >
                  {isCreatingRoom ? (
                    <span>
                      <Loader2 className="animate-spin" />
                    </span>
                  ) : (
                    <span>Criar Sala</span>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Pesquisar sala..."
            className="w-full px-4 py-2 rounded-full border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
          />
        </div>

        <div className="space-y-3">
          {rooms.map((room, index) => (
            <div
              key={index}
              className="flex items-center gap-4 p-3 bg-violet-50 hover:bg-violet-100 transition rounded-lg cursor-pointer shadow-sm"
              onClick={() => {
                setSelectedRoomId(room.id);
                setSelectedRoomName(room.name);
              }}
            >
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-violet-400 text-white flex items-center justify-center rounded-full text-sm font-bold uppercase">
                  {room.name.charAt(0)}
                </div>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-800">{room.name}</p>
                <p className="text-xs text-gray-500 truncate">
                  Clique para entrar na sala
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Área do chat (50%) */}
      <ChatPage roomId={selectedRoomId} roomName={selectedRoomName} />

      {/* Área lateral direita (20%) */}
      <div className="w-[20%] bg-white rounded-lg shadow-sm p-4">
        <h2 className="text-xl font-semibold mb-4">Detalhes</h2>
        <div className="text-sm text-gray-600">
          Usuário: {user?.user?.username}
        </div>
      </div>
    </div>
  );
};

export default Home;
