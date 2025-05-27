import React from "react";
import { Button } from "@/components/ui/button";
import { Paperclip, X } from "lucide-react";

interface MessageInputProps {
  input: string;
  setInput: (input: string) => void;
  selectedFiles: File[];
  removeSelectedFile: (index: number) => void;
  clearAllFiles: () => void;
  sendMessage: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  userRemovedFromRoom: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  input,
  setInput,
  selectedFiles,
  removeSelectedFile,
  clearAllFiles,
  sendMessage,
  fileInputRef,
  handleFileSelect,
  userRemovedFromRoom,
}) => {
  if (userRemovedFromRoom) {
    return null;
  }

  return (
    <div className="mt-2 md:mt-4 flex flex-col gap-2">
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs md:text-sm text-violet-700 font-medium">
              {selectedFiles.length} arquivo{selectedFiles.length > 1 ? 's' : ''} selecionado{selectedFiles.length > 1 ? 's' : ''}
            </span>
            <button
              onClick={clearAllFiles}
              className="text-xs text-red-600 hover:text-red-700"
            >
              Limpar todos
            </button>
          </div>
          {selectedFiles.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-violet-50 rounded-md">
              <span className="text-xs md:text-sm text-violet-700 truncate">{file.name}</span>
              <button
                onClick={() => removeSelectedFile(index)}
                className="text-violet-600 hover:text-violet-700"
              >
                <X className="h-4 w-4 md:h-5 md:w-5" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-1 md:gap-2">
        <input
          type="text"
          placeholder="Digite sua mensagem..."
          className="flex-1 p-2 md:p-3 border rounded-md text-sm md:text-base"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessage();
          }}
        />
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
          multiple
          accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt"
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="outline"
          size="sm"
          className="border-violet-200 hover:bg-violet-50 px-2 md:px-3"
        >
          <Paperclip className="h-4 w-4 md:h-5 md:w-5 text-violet-600" />
        </Button>
        <Button
          onClick={sendMessage}
          variant="default"
          size="sm"
          className="bg-violet-600 hover:bg-violet-700 px-3 md:px-4"
        >
          <span className="text-white text-sm md:text-base">Enviar</span>
        </Button>
      </div>
    </div>
  );
}; 