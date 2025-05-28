import React from 'react';
import { ExternalLink, Globe, Loader2, AlertCircle, Play, Image as ImageIcon } from 'lucide-react';
import type { LinkPreview as LinkPreviewType } from '../../hooks/useLinkPreview';

interface LinkPreviewProps {
  preview: LinkPreviewType;
}

export const LinkPreview: React.FC<LinkPreviewProps> = ({ preview }) => {
  if (preview.loading) {
    return (
      <div className="mt-2 p-3 border border-gray-200 rounded-lg bg-gray-50 animate-pulse">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-violet-500" />
          <span className="text-sm text-gray-600">Carregando preview...</span>
        </div>
      </div>
    );
  }

  if (preview.error) {
    return (
      <div className="mt-2 p-3 border border-red-200 rounded-lg bg-red-50">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <span className="text-sm text-red-600">Erro ao carregar preview</span>
        </div>
        <a 
          href={preview.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-violet-600 hover:text-violet-700 underline text-sm mt-1 block"
        >
          {preview.url}
        </a>
      </div>
    );
  }

  const handleClick = () => {
    window.open(preview.url, '_blank', 'noopener,noreferrer');
  };

  const isVideo = preview.description?.includes('vídeo') || preview.siteName === 'YouTube';
  const isImage = preview.description?.includes('Imagem') || preview.image === preview.url;

      return (
      <div 
        className="mt-2 border border-gray-200 rounded-lg overflow-hidden hover:border-violet-300 transition-colors cursor-pointer group max-w-full"
        onClick={handleClick}
      >
                {preview.image ? (
          <div className="aspect-video w-full overflow-hidden bg-gray-100 relative min-h-0">
            <img 
              src={preview.image} 
              alt={preview.title || 'Preview'} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 max-w-full"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          
          {isVideo && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 group-hover:bg-opacity-40 transition-colors">
              <div className="w-12 h-12 bg-white bg-opacity-90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Play className="h-6 w-6 text-gray-800 ml-1" fill="currentColor" />
              </div>
            </div>
          )}
          
          {isImage && (
            <div className="absolute top-2 left-2 bg-black bg-opacity-50 rounded-md px-2 py-1">
              <div className="flex items-center gap-1 text-white text-xs">
                <ImageIcon className="h-3 w-3" />
                <span>Imagem</span>
              </div>
            </div>
          )}
        </div>
      ) : !isImage && (
        <div className="h-16 md:h-20 bg-gradient-to-r from-violet-100 to-purple-100 flex items-center justify-center">
          <div className="flex items-center gap-2 text-violet-600">
            <Globe className="h-5 w-5 md:h-6 md:w-6" />
            <span className="font-medium text-xs md:text-sm truncate max-w-40">{preview.siteName || 'Link'}</span>
          </div>
        </div>
      )}
      
      <div className="p-2 md:p-3 bg-white group-hover:bg-gray-50 transition-colors">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0 overflow-hidden">
            {preview.title && (
              <h4 className="font-semibold text-gray-900 text-xs md:text-sm mb-1 line-clamp-2 group-hover:text-violet-700 transition-colors break-words">
                {preview.title}
              </h4>
            )}
            
            {preview.description && (
              <p className="text-gray-600 text-xs mb-2 line-clamp-2 break-words">
                {preview.description}
              </p>
            )}
            
            <div className="flex items-center gap-1 text-gray-500 overflow-hidden">
              <Globe className="h-3 w-3 flex-shrink-0" />
              <span className="text-xs truncate">
                {preview.siteName || new URL(preview.url).hostname}
              </span>
            </div>
          </div>
          
          <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-violet-500 transition-colors flex-shrink-0" />
        </div>
      </div>
    </div>
  );
}; 