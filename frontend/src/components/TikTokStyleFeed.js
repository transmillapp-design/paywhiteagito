import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { useTheme } from '../contexts/ThemeContext';
import axios from 'axios';
import {
  Heart,
  MessageCircle,
  Share2,
  Music,
  MoreVertical,
  Volume2,
  VolumeX
} from 'lucide-react';
import { toast } from 'sonner';

const TikTokStyleFeed = () => {
  const navigate = useNavigate();
  const { user, token, API } = useAuth();
  const { isDark } = useTheme();
  
  const [videos, setVideos] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [muted, setMuted] = useState(false);
  
  const containerRef = useRef(null);
  const videoRefs = useRef([]);

  useEffect(() => {
    fetchVideos();
  }, []);

  useEffect(() => {
    // Auto-play current video
    if (videoRefs.current[currentIndex]) {
      videoRefs.current[currentIndex].play();
    }
    
    // Pause other videos
    videoRefs.current.forEach((video, index) => {
      if (index !== currentIndex && video) {
        video.pause();
      }
    });
  }, [currentIndex]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/social/videos`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000
      });
      setVideos(response.data.videos || []);
    } catch (error) {
      console.error('Error fetching videos:', error);
      toast.error('Erro ao carregar vídeos');
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = () => {
    if (!containerRef.current) return;
    
    const scrollTop = containerRef.current.scrollTop;
    const windowHeight = window.innerHeight;
    const newIndex = Math.round(scrollTop / windowHeight);
    
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < videos.length) {
      setCurrentIndex(newIndex);
    }
  };

  const handleLike = async (videoId) => {
    try {
      await axios.post(
        `${API}/social/like`,
        { video_id: videoId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local state
      setVideos(videos.map(v => 
        v.id === videoId 
          ? { ...v, is_liked: !v.is_liked, likes_count: v.is_liked ? v.likes_count - 1 : v.likes_count + 1 }
          : v
      ));
    } catch (error) {
      console.error('Error liking video:', error);
      toast.error('Erro ao curtir vídeo');
    }
  };

  const handleComment = (video) => {
    // Open comments modal (you can implement this)
    console.log('Open comments for:', video.id);
  };

  const handleShare = (video) => {
    // Open share modal (you can implement this)
    console.log('Share video:', video.id);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-black text-white">
        <h3 className="text-xl font-semibold mb-4">Nenhum vídeo disponível</h3>
        <button
          onClick={() => navigate('/social/upload')}
          className="px-6 py-3 bg-[#005B9C] text-black rounded-full font-semibold"
        >
          Criar Vídeo
        </button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="h-screen overflow-y-scroll snap-y snap-mandatory bg-black"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      <style jsx>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {videos.map((video, index) => (
        <div
          key={video.id}
          className="h-screen w-screen snap-start snap-always relative flex items-center justify-center"
        >
          {/* Video */}
          <video
            ref={el => videoRefs.current[index] = el}
            src={video.video_url}
            loop
            muted={muted}
            playsInline
            className="w-full h-full object-contain bg-black"
            onClick={() => {
              const vid = videoRefs.current[index];
              if (vid.paused) {
                vid.play();
              } else {
                vid.pause();
              }
            }}
          />

          {/* Overlay - Info do Usuário (Bottom Left) */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-[#005B9C] flex items-center justify-center">
                <span className="font-bold text-black">
                  {video.user_name?.[0] || 'U'}
                </span>
              </div>
              <div>
                <p className="font-semibold text-white text-sm">
                  @{video.user_name}
                </p>
              </div>
              <button className="ml-2 px-4 py-1 border border-white rounded-full text-white text-xs font-semibold">
                Seguir
              </button>
            </div>

            {/* Description */}
            {video.description && (
              <p className="text-white text-sm mb-2 line-clamp-2">
                {video.description}
              </p>
            )}

            {/* Hashtags */}
            {video.hashtags && video.hashtags.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {video.hashtags.map((tag, idx) => (
                  <span key={idx} className="text-white text-xs font-semibold">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Music */}
            <div className="flex items-center gap-2 mt-2">
              <Music size={14} className="text-white" />
              <p className="text-white text-xs">Som original</p>
            </div>
          </div>

          {/* Side Actions (Right) */}
          <div className="absolute right-4 bottom-24 flex flex-col gap-6">
            {/* Like */}
            <button
              onClick={() => handleLike(video.id)}
              className="flex flex-col items-center gap-1"
            >
              <div className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
                <Heart
                  size={28}
                  className={`${
                    video.is_liked
                      ? 'fill-red-500 text-red-500'
                      : 'text-white'
                  }`}
                />
              </div>
              <span className="text-white text-xs font-semibold">
                {video.likes_count || 0}
              </span>
            </button>

            {/* Comments */}
            <button
              onClick={() => handleComment(video)}
              className="flex flex-col items-center gap-1"
            >
              <div className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
                <MessageCircle size={28} className="text-white" />
              </div>
              <span className="text-white text-xs font-semibold">
                {video.comments_count || 0}
              </span>
            </button>

            {/* Share */}
            <button
              onClick={() => handleShare(video)}
              className="flex flex-col items-center gap-1"
            >
              <div className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
                <Share2 size={28} className="text-white" />
              </div>
              <span className="text-white text-xs font-semibold">
                {video.shares_count || 0}
              </span>
            </button>

            {/* Profile Picture (Spinning) */}
            <button className="relative">
              <div className="w-12 h-12 rounded-full bg-[#005B9C] flex items-center justify-center border-2 border-white animate-spin-slow">
                <span className="font-bold text-black text-lg">
                  {video.user_name?.[0] || 'U'}
                </span>
              </div>
            </button>
          </div>

          {/* Top Bar */}
          <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="text-white font-semibold"
            >
              ← Voltar
            </button>
            <button
              onClick={() => setMuted(!muted)}
              className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center"
            >
              {muted ? (
                <VolumeX size={20} className="text-white" />
              ) : (
                <Volume2 size={20} className="text-white" />
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TikTokStyleFeed;
