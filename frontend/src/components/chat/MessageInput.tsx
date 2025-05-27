import React from "react";
import { Button } from "@/components/ui/button";
import { Paperclip, X, File, FileText, FileSpreadsheet, Image } from "lucide-react";

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

// Função para obter o ícone baseado no tipo de arquivo
const getFileIcon = (file: File) => {
  const type = file.type.toLowerCase();
  
  if (type.startsWith('image/')) {
    return <Image className="h-6 w-6 text-green-600" />;
  } else if (type.includes('pdf')) {
    return <FileText className="h-6 w-6 text-red-600" />;
  } else if (type.includes('word') || type.includes('document')) {
    return <FileText className="h-6 w-6 text-blue-600" />;
  } else if (type.includes('excel') || type.includes('spreadsheet')) {
    return <FileSpreadsheet className="h-6 w-6 text-green-600" />;
  } else {
    return <File className="h-6 w-6 text-gray-600" />;
  }
};

// Componente para prévia de arquivo individual
const FilePreview: React.FC<{ file: File; index: number; onRemove: (index: number) => void }> = ({ 
  file, 
  index, 
  onRemove 
}) => {
  const [imageUrl, setImageUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      
      // Cleanup
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  return (
    <div className="relative group">
      <div className="w-20 h-20 bg-violet-50 border-2 border-violet-200 rounded-lg overflow-hidden flex items-center justify-center hover:border-violet-300 transition-colors">
        {file.type.startsWith('image/') && imageUrl ? (
          <img 
            src={imageUrl} 
            alt={file.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-2">
            {getFileIcon(file)}
            <span className="text-xs text-violet-700 mt-1 truncate w-full text-center">
              {file.name.split('.').pop()?.toUpperCase()}
            </span>
          </div>
        )}
      </div>
      
      {/* Botão de remover */}
      <button
        onClick={() => onRemove(index)}
        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shadow-lg"
        title="Remover arquivo"
      >
        <X className="h-3 w-3" />
      </button>
      
      {/* Nome do arquivo */}
      <div className="mt-1 text-xs text-violet-700 truncate w-20 text-center" title={file.name}>
        {file.name}
      </div>
    </div>
  );
};

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
    <div className="mt-2 md:mt-4 flex flex-col gap-3">
      {selectedFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-violet-700 font-medium">
              {selectedFiles.length} arquivo{selectedFiles.length > 1 ? 's' : ''} selecionado{selectedFiles.length > 1 ? 's' : ''}
            </span>
            <button
              onClick={clearAllFiles}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Limpar todos
            </button>
          </div>
          
          {/* Grid de prévias dos arquivos */}
          <div className="flex flex-wrap gap-3">
            {selectedFiles.map((file, index) => (
              <FilePreview
                key={index}
                file={file}
                index={index}
                onRemove={removeSelectedFile}
              />
            ))}
          </div>
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