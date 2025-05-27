import { useState, useEffect, useRef } from 'react';

export interface LinkPreview {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  loading: boolean;
  error?: string;
}

// Regex para detectar URLs
const URL_REGEX = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi;

// Cache simples para evitar requisições desnecessárias
const previewCache = new Map<string, LinkPreview>();

export const useLinkPreview = (content: string) => {
  const [linkPreviews, setLinkPreviews] = useState<LinkPreview[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const extractUrls = (text: string): string[] => {
    const matches = text.match(URL_REGEX);
    if (!matches) return [];
    
    // Normalizar URLs (adicionar https:// se necessário)
    return matches.map(url => {
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return `https://${url}`;
      }
      return url;
    }).filter((url, index, array) => array.indexOf(url) === index); // Remove duplicatas
  };

  const fetchLinkPreview = async (url: string): Promise<LinkPreview> => {
    try {
      // Detectar tipos específicos de sites e conteúdo
      const hostname = new URL(url).hostname.toLowerCase();
      
      // Primeiro, verificar se é uma imagem direta
      if (await isImageUrl(url)) {
        return await fetchImagePreview(url);
      }
      
      // Verificar se é um vídeo direto
      if (await isVideoUrl(url)) {
        return await fetchVideoPreview(url);
      }
      
      // Preview customizado para YouTube
      if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
        return await fetchYouTubePreview(url);
      }
      
      // Preview customizado para GitHub
      if (hostname.includes('github.com')) {
        return await fetchGitHubPreview(url);
      }
      
      // Preview customizado para Twitter/X
      if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
        return await fetchTwitterPreview(url);
      }
      
      // Preview customizado para Instagram
      if (hostname.includes('instagram.com')) {
        return await fetchInstagramPreview(url);
      }
      
      // Preview customizado para Imgur
      if (hostname.includes('imgur.com')) {
        return await fetchImgurPreview(url);
      }
      
      // Preview customizado para Google Drive
      if (hostname.includes('drive.google.com')) {
        return await fetchGoogleDrivePreview(url);
      }
      
      // Preview customizado para Dropbox
      if (hostname.includes('dropbox.com')) {
        return await fetchDropboxPreview(url);
      }
      
      // Preview genérico usando uma API simples ou fallback
      return await fetchGenericPreview(url);
      
    } catch (error) {
      console.error('Erro ao buscar preview do link:', error);
      return {
        url,
        loading: false,
        error: 'Erro ao carregar preview'
      };
    }
  };

  // Verificar se URL é uma imagem
  const isImageUrl = async (url: string): Promise<boolean> => {
    try {
      // Verificar extensão do arquivo
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
      const urlPath = new URL(url).pathname.toLowerCase();
      
      if (imageExtensions.some(ext => urlPath.endsWith(ext))) {
        return true;
      }

      // Fazer uma requisição HEAD para verificar o Content-Type
      const response = await fetch(url, { method: 'HEAD' });
      const contentType = response.headers.get('content-type');
      return contentType ? contentType.startsWith('image/') : false;
    } catch {
      return false;
    }
  };

  // Verificar se URL é um vídeo
  const isVideoUrl = async (url: string): Promise<boolean> => {
    try {
      const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];
      const urlPath = new URL(url).pathname.toLowerCase();
      
      if (videoExtensions.some(ext => urlPath.endsWith(ext))) {
        return true;
      }

      const response = await fetch(url, { method: 'HEAD' });
      const contentType = response.headers.get('content-type');
      return contentType ? contentType.startsWith('video/') : false;
    } catch {
      return false;
    }
  };

  // Preview para imagens
  const fetchImagePreview = async (url: string): Promise<LinkPreview> => {
    const filename = url.split('/').pop() || 'Imagem';
    return {
      url,
      title: filename,
      description: 'Imagem',
      image: url,
      siteName: new URL(url).hostname,
      loading: false
    };
  };

  // Preview para vídeos
  const fetchVideoPreview = async (url: string): Promise<LinkPreview> => {
    const filename = url.split('/').pop() || 'Vídeo';
    return {
      url,
      title: filename,
      description: 'Arquivo de vídeo',
      siteName: new URL(url).hostname,
      loading: false
    };
  };

  // Preview para Twitter/X
  const fetchTwitterPreview = async (url: string): Promise<LinkPreview> => {
    return {
      url,
      title: 'Post no Twitter/X',
      description: 'Clique para ver o post completo',
      siteName: 'Twitter/X',
      loading: false
    };
  };

  // Preview para Instagram
  const fetchInstagramPreview = async (url: string): Promise<LinkPreview> => {
    return {
      url,
      title: 'Post no Instagram',
      description: 'Clique para ver no Instagram',
      siteName: 'Instagram',
      loading: false
    };
  };

  // Preview para Imgur
  const fetchImgurPreview = async (url: string): Promise<LinkPreview> => {
    try {
      // Converter URL do Imgur para thumbnail se necessário
      let imageUrl = url;
      const imgurId = url.match(/imgur\.com\/(?:a\/)?([a-zA-Z0-9]+)/)?.[1];
      
      if (imgurId && !url.includes('.jpg') && !url.includes('.png')) {
        imageUrl = `https://i.imgur.com/${imgurId}.jpg`;
      }

      return {
        url,
        title: 'Imagem do Imgur',
        description: 'Imagem',
        image: imageUrl,
        siteName: 'Imgur',
        loading: false
      };
    } catch {
      return fetchGenericPreview(url);
    }
  };

  // Preview para Google Drive
  const fetchGoogleDrivePreview = async (url: string): Promise<LinkPreview> => {
    try {
      const fileId = url.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1];
      
      if (fileId) {
        return {
          url,
          title: 'Arquivo do Google Drive',
          description: 'Clique para abrir no Google Drive',
          image: `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`,
          siteName: 'Google Drive',
          loading: false
        };
      }
    } catch {
      // Fallback se não conseguir extrair o ID
    }
    
    return fetchGenericPreview(url);
  };

  // Preview para Dropbox
  const fetchDropboxPreview = async (url: string): Promise<LinkPreview> => {
    return {
      url,
      title: 'Arquivo do Dropbox',
      description: 'Clique para abrir no Dropbox',
      siteName: 'Dropbox',
      loading: false
    };
  };

  const fetchYouTubePreview = async (url: string): Promise<LinkPreview> => {
    try {
      // Extrair ID do vídeo do YouTube
      const videoId = extractYouTubeId(url);
      if (videoId) {
        // Tentar obter título via oEmbed (API pública do YouTube)
        try {
          const oEmbedResponse = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
          if (oEmbedResponse.ok) {
            const data = await oEmbedResponse.json();
            return {
              url,
              title: data.title || 'Vídeo do YouTube',
              description: `Por ${data.author_name || 'YouTube'}`,
              image: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
              siteName: 'YouTube',
              loading: false
            };
          }
        } catch {
          // Se oEmbed falhar, usar informações básicas
        }

        return {
          url,
          title: 'Vídeo do YouTube',
          description: 'Clique para assistir no YouTube',
          image: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          siteName: 'YouTube',
          loading: false
        };
      }
    } catch (error) {
      console.error('Erro ao processar link do YouTube:', error);
    }
    
    return fetchGenericPreview(url);
  };

  const fetchGitHubPreview = async (url: string): Promise<LinkPreview> => {
    try {
      const pathParts = new URL(url).pathname.split('/').filter(Boolean);
      if (pathParts.length >= 2) {
        const [owner, repo] = pathParts;
        return {
          url,
          title: `${owner}/${repo}`,
          description: 'Repositório no GitHub',
          image: `https://opengraph.githubassets.com/1/${owner}/${repo}`,
          siteName: 'GitHub',
          loading: false
        };
      }
    } catch (error) {
      console.error('Erro ao processar link do GitHub:', error);
    }
    
    return fetchGenericPreview(url);
  };

  const fetchGenericPreview = async (url: string): Promise<LinkPreview> => {
    try {
      // Para uma implementação mais simples, retornar informações básicas
      const hostname = new URL(url).hostname;
      
      return {
        url,
        title: `Link para ${hostname}`,
        description: 'Clique para abrir o link',
        siteName: hostname,
        loading: false
      };
    } catch (error) {
      return {
        url,
        loading: false,
        error: 'Erro ao carregar preview'
      };
    }
  };

  const extractYouTubeId = (url: string): string | null => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  useEffect(() => {
    // Cancelar requisições pendentes
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const urls = extractUrls(content);
    
    if (urls.length === 0) {
      setLinkPreviews([]);
      return;
    }

    // Verificar cache primeiro
    const cachedPreviews: LinkPreview[] = [];
    const urlsToFetch: string[] = [];

    urls.forEach(url => {
      const cached = previewCache.get(url);
      if (cached) {
        cachedPreviews.push(cached);
      } else {
        urlsToFetch.push(url);
        cachedPreviews.push({ url, loading: true });
      }
    });

    setLinkPreviews(cachedPreviews);

    if (urlsToFetch.length === 0) return;

    // Criar novo AbortController para esta requisição
    abortControllerRef.current = new AbortController();

    // Buscar metadados para URLs não cacheadas
    const fetchPreviews = async () => {
      try {
        const newPreviews = await Promise.all(
          urlsToFetch.map(url => fetchLinkPreview(url))
        );

        // Atualizar cache
        newPreviews.forEach(preview => {
          previewCache.set(preview.url, preview);
        });

        // Combinar previews cacheados com novos
        const allPreviews = urls.map(url => {
          return previewCache.get(url) || { url, loading: false, error: 'Erro ao carregar' };
        });

        setLinkPreviews(allPreviews);
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return; // Requisição foi cancelada, não fazer nada
        }
        console.error('Erro ao buscar previews:', error);
      }
    };

    fetchPreviews();

    // Cleanup
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [content]);

  return linkPreviews;
}; 