import React from "react";
import { Button } from "@/components/ui/button";
import { File, Image, Download } from "lucide-react";
import type { RoomDetails } from "@/types/api";

interface SharedFilesProps {
  roomDetails: RoomDetails;
}

export const SharedFiles: React.FC<SharedFilesProps> = ({ roomDetails }) => {
  const handleDownload = (file: any) => {
    const downloadUrl = `${import.meta.env.VITE_API_URL}${file.fileUrl}`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = file.fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h3 className="font-semibold text-gray-800 mb-3 text-base flex items-center gap-2">
        <File size={18} />
        Arquivos Compartilhados ({roomDetails.sharedFiles?.length || 0})
      </h3>
      {roomDetails.sharedFiles && roomDetails.sharedFiles.length > 0 ? (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {roomDetails.sharedFiles.map((file) => (
            <div key={file.id} className="flex items-center gap-2 p-3 bg-white rounded-lg border min-w-0">
              {file.fileType.startsWith('image/') ? (
                <Image size={20} className="text-green-600 flex-shrink-0" />
              ) : (
                <File size={20} className="text-blue-600 flex-shrink-0" />
              )}
              
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate" title={file.fileName}>
                  {file.fileName}
                </p>
                <p className="text-xs text-gray-500 truncate" title={`Enviado por ${file.uploadedBy} em ${new Date(file.uploadedAt).toLocaleDateString('pt-BR')}`}>
                  Enviado por <span className="font-medium">{file.uploadedBy}</span> em {new Date(file.uploadedAt).toLocaleDateString('pt-BR')}
                </p>
              </div>
              
              <div className="flex-shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownload(file)}
                  className="flex items-center gap-1 whitespace-nowrap"
                  title={`Baixar ${file.fileName}`}
                >
                  <Download size={14} />
                  <span className="hidden sm:inline">Baixar</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <File size={32} className="mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-500">Nenhum arquivo compartilhado ainda</p>
        </div>
      )}
    </div>
  );
}; 