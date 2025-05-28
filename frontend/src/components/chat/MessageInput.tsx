import React from "react";
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
  handleTyping: () => void;
  stopTyping: () => void;
}

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
      

      
      <button
        onClick={() => onRemove(index)}
        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shadow-lg"
        title="Remover arquivo"
      >
        <X className="h-3 w-3" />
      </button>
      
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
  handleTyping,
  stopTyping,
}) => {
  const [isDragOver, setIsDragOver] = React.useState(false);

  if (userRemovedFromRoom) {
    return null;
  }

  const processFiles = (files: FileList) => {
    const event = {
      target: {
        files: files
      }
    } as React.ChangeEvent<HTMLInputElement>;
    handleFileSelect(event);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragOver(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  React.useEffect(() => {
    const handleGlobalDragEnd = () => {
      setTimeout(() => {
        setIsDragOver(false);
      }, 100);
    };

    const handleGlobalDrop = (e: DragEvent) => {
      if (!e.target || !(e.target as Element).closest('[data-drop-zone]')) {
        setIsDragOver(false);
      }
    };

    document.addEventListener('dragend', handleGlobalDragEnd);
    document.addEventListener('drop', handleGlobalDrop);

    return () => {
      document.removeEventListener('dragend', handleGlobalDragEnd);
      document.removeEventListener('drop', handleGlobalDrop);
    };
  }, []);

  return (
    <div 
      data-drop-zone
      className={`mt-2 md:mt-4 flex flex-col gap-3 relative transition-all duration-200 ${
        isDragOver ? 'transform scale-[1.02]' : ''
      }`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {isDragOver && (
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50 to-violet-100 border-2 border-dashed border-violet-300 rounded-xl flex items-center justify-center z-10 backdrop-blur-sm">
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-violet-200 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Paperclip className="h-8 w-8 text-violet-600" />
            </div>
            <p className="text-violet-800 font-semibold text-lg mb-1">Solte os arquivos aqui</p>
            <p className="text-violet-600 text-sm opacity-80">Imagens, PDFs, documentos...</p>
          </div>
        </div>
      )}

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
      
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Digite sua mensagem..."
          className={`flex-1 h-10 md:h-12 px-3 md:px-4 border rounded-lg text-sm md:text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400 ${
            isDragOver ? 'border-violet-400 bg-violet-50 shadow-lg ring-2 ring-violet-200' : 'border-gray-300 hover:border-violet-300'
          }`}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            if (e.target.value.trim()) {
              handleTyping();
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              stopTyping();
              sendMessage();
            }
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
        <button
          onClick={() => fileInputRef.current?.click()}
          className="h-10 md:h-12 w-10 md:w-12 flex items-center justify-center border border-violet-200 hover:bg-violet-50 hover:border-violet-300 rounded-lg transition-all duration-200 ease-in-out hover:scale-105 active:scale-95"
          title="Anexar arquivo"
        >
          <Paperclip className="h-4 w-4 md:h-5 md:w-5 text-violet-600" />
        </button>
        <button
          onClick={() => {
            stopTyping();
            sendMessage();
          }}
          className="h-10 md:h-12 px-4 md:px-6 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium text-sm md:text-base transition-all duration-200 ease-in-out hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}; 