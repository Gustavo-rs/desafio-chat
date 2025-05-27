import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CreateRoomDialog } from "./CreateRoomDialog";

interface RoomHeaderProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  roomName: string;
  setRoomName: (name: string) => void;
  isCreatingRoom: boolean;
  handleCreateRoom: () => void;
}

export const RoomHeader: React.FC<RoomHeaderProps> = ({
  open,
  setOpen,
  roomName,
  setRoomName,
  isCreatingRoom,
  handleCreateRoom,
}) => {
  return (
    <div className="flex items-center justify-between mb-3 md:mb-4">
      <h2 className="text-lg md:text-xl font-semibold text-gray-800">Salas</h2>

      <CreateRoomDialog
        open={open}
        setOpen={setOpen}
        roomName={roomName}
        setRoomName={setRoomName}
        isCreatingRoom={isCreatingRoom}
        handleCreateRoom={handleCreateRoom}
        trigger={
          <Button
            variant="outline"
            size="sm"
            className="text-xs md:text-sm text-primary border-primary px-2 md:px-3"
          >
            <span className="hidden sm:inline">Nova sala</span>
            <Plus className="sm:hidden" />
          </Button>
        }
      />
    </div>
  );
}; 