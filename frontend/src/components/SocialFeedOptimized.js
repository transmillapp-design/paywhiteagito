import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../App';
import axios from 'axios';
import { toast } from 'sonner';
import { Heart, MessageCircle, Share2, Eye, Loader2 } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';

const SocialFeedOptimized = () => {
  const { API } = useAuth();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const observer = useRef();
  const limit = 10; // Carregar 10 vídeos por vez

  const token = localStorage.getItem('token');

  // Infinite scroll - último elemento
  const lastVideoElementRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  useEffect(() => {
    loadVideos();
  }, [page]);

  const loadVideos = async () => {
    if (loading) return;
    
    try {
      setLoading(true);
      const skip = page * limit;
      
      const response = await axios.get(
        `${API}/social/videos?skip=${skip}&limit=${limit}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        const newVideos = response.data.videos || [];
        
        if (newVideos.length < limit) {
          setHasMore(false);
        }
        
        setVideos(prev => page === 0 ? newVideos : [...prev, ...newVideos]);
      }
    } catch (error) {
      console.error('Erro ao carregar vídeos:', error);
      toast.error('Erro ao carregar feed');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (videoId) => {
    try {
      await axios.post(
        `${API}/social/videos/like`,
        { video_id: videoId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Atualizar UI otimisticamente
      setVideos(prev => prev.map(v => {
        if (v.id === videoId) {
          return {
            ...v,
            is_liked: !v.is_liked,
            likes_count: v.is_liked ? v.likes_count - 1 : v.likes_count + 1
          };
        }
        return v;
      }));
    } catch (error) {
      console.error('Erro ao curtir:', error);
      toast.error('Erro ao curtir vídeo');
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {videos.map((video, index) => {
        const isLastElement = videos.length === index + 1;
        
        return (
          <Card
            key={video.id}
            ref={isLastElement ? lastVideoElementRef : null}
            className="overflow-hidden"
          >
            <CardContent className="p-0">
              {/* Vídeo Player */}
              <div className="relative aspect-video bg-black">
                <video
                  src={video.video_data}
                  className="w-full h-full object-contain"
                  controls
                  playsInline
                  preload="metadata"
                />
              </div>

              {/* Info e Ações */}
              <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                    {video.user_name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold">{video.user_name}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(video.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>

                {video.description && (
                  <p className="text-sm mb-3">{video.description}</p>
                )}

                {/* Ações */}
                <div className="flex items-center gap-6">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLike(video.id)}
                    className={video.is_liked ? 'text-red-500' : ''}
                  >
                    <Heart
                      size={20}
                      fill={video.is_liked ? 'currentColor' : 'none'}
                    />
                    <span className="ml-1">{video.likes_count || 0}</span>
                  </Button>

                  <Button variant="ghost" size="sm">
                    <MessageCircle size={20} />
                    <span className="ml-1">{video.comments_count || 0}</span>
                  </Button>

                  <Button variant="ghost" size="sm">
                    <Eye size={20} />
                    <span className="ml-1">{video.views_count || 0}</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}}

      {loading && (
        <div className="flex justify-center py-4">
          <Loader2 className="animate-spin" size={32} />
        </div>
      )}

      {!hasMore && videos.length > 0 && (
        <p className="text-center text-gray-500 py-4">
          Você chegou ao fim do feed!
        </p>
      )}

      {!loading && videos.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">Nenhum vídeo disponível ainda</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SocialFeedOptimized;
