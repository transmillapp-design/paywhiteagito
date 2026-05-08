import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../App';
import { useTheme } from '../contexts/ThemeContext';
import axios from 'axios';
import {
  ArrowLeft,
  Video,
  Heart,
  MessageCircle,
  Share2,
  Eye,
  Plus,
  TrendingUp,
  Award,
  DollarSign,
  Tag,
  User,
  Grid3x3,
  Play
} from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import VideoPlayer from './VideoPlayer';
import CommentsModal from './CommentsModal';
import ShareModal from './ShareModal';
import ProductModal from './ProductModal';
import BookingModal from './BookingModal';

const SocialFeed = () => {
  const navigate = useNavigate();
  const { user, token, API } = useAuth();
  const { isDark } = useTheme();
  const location = useLocation();

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userPoints, setUserPoints] = useState(0);
  const [filter, setFilter] = useState('all'); // all, my_videos, lojista, service_provider
  const [hashtagFilter, setHashtagFilter] = useState(null);
  const [selectedVideoForComments, setSelectedVideoForComments] = useState(null);
  const [selectedVideoForShare, setSelectedVideoForShare] = useState(null);
  const [selectedProductModal, setSelectedProductModal] = useState(null);
  const [selectedBookingModal, setSelectedBookingModal] = useState(null);

  useEffect(() => {
    fetchVideos();
    fetchUserData();
  }, [filter, hashtagFilter]);
  
  // Reload when coming back from upload
  useEffect(() => {
    if (location.state?.reload) {
      fetchVideos();
      fetchUserData(); // Update points after video upload
      // Clear the state
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      
      // Build params based on filter
      let params = {};
      if (filter === 'my_videos') {
        params.my_videos = true;
      } else if (filter !== 'all') {
        params.user_type = filter;
      }
      
      const response = await axios.get(`${API}/social/videos`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
        timeout: 10000 // 10 segundos de timeout
      });
      
      let videosList = response.data.videos || [];
      
      // Filter by hashtag if selected
      if (hashtagFilter) {
        videosList = videosList.filter(v => 
          v.hashtags && v.hashtags.includes(hashtagFilter)
        );
      }
      
      setVideos(videosList);
    } catch (error) {
      console.error('Error fetching videos:', error);
      // Se der erro, define vídeos como array vazio para mostrar mensagem de "nenhum vídeo"
      setVideos([]);
      if (error.code === 'ECONNABORTED') {
        toast.error('Tempo limite excedido ao carregar vídeos. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchUserData = async () => {
    try {
      const response = await axios.get(`${API}/user/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserPoints(response.data.social_points || 0);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handleLike = async (videoId) => {
    try {
      const response = await axios.post(
        `${API}/social/videos/like`,
        { video_id: videoId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update video in list
      setVideos(videos.map(v => 
        v.id === videoId 
          ? { ...v, is_liked: response.data.action === 'liked', likes_count: v.likes_count + (response.data.action === 'liked' ? 1 : -1) }
          : v
      ));

      // Update user points if awarded
      if (response.data.points_awarded > 0) {
        setUserPoints(prev => prev + response.data.points_awarded);
      }
    } catch (error) {
      console.error('Error liking video:', error);
    }
  };

  const handleView = async (videoId, duration, completed) => {
    try {
      const response = await axios.post(
        `${API}/social/videos/view`,
        { video_id: videoId, watch_duration: duration, completed },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.points_awarded > 0) {
        setUserPoints(prev => prev + response.data.points_awarded);
      }
      
      // Update video views in list
      setVideos(videos.map(v => 
        v.id === videoId 
          ? { ...v, views_count: v.views_count + 1 }
          : v
      ));
    } catch (error) {
      console.error('Error recording view:', error);
    }
  };
  
  const handleHashtagClick = (hashtag) => {
    setHashtagFilter(hashtag);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const clearHashtagFilter = () => {
    setHashtagFilter(null);
  };
  
  const handleCommentAdded = (videoId) => {
    // Update comment count in list
    setVideos(videos.map(v => 
      v.id === videoId 
        ? { ...v, comments_count: v.comments_count + 1 }
        : v
    ));
  };

  return (
    <div className={`min-h-screen pb-20 ${isDark ? 'bg-[#2A3618]' : 'bg-[#EEEEEE]'}`}>
      {/* Header */}
      <div className={`sticky top-0 z-40 ${isDark ? 'bg-[#3F5123]' : 'bg-[#FFFFFF]'} shadow-md`}>
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className={`p-2 rounded-full ${
                isDark ? 'hover:bg-[#556B2F]' : 'hover:bg-[#E5D5C3]'
              }`}
            >
              <ArrowLeft className={isDark ? 'text-[#E5C34A]' : 'text-[#005B9C]'} size={24} />
            </button>

            <div className="flex items-center gap-2">
              <Video className={isDark ? 'text-[#005B9C]' : 'text-[#005B9C]'} size={24} />
              <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-[#333333]'}`}>
                Transmill Social
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/social/feed')}
                className={`p-2 rounded-full ${
                  isDark ? 'hover:bg-[#556B2F]' : 'hover:bg-[#E5D5C3]'
                }`}
                title="Visualização TikTok"
              >
                <Play className={isDark ? 'text-[#005B9C]' : 'text-[#005B9C]'} size={20} />
              </button>
              
              <button
                onClick={() => navigate('/social/upload')}
                className={`p-2 rounded-full ${
                  isDark
                    ? 'bg-gradient-to-br from-[#005B9C] to-[#E5C34A]'
                    : 'bg-gradient-to-br from-[#005B9C] to-[#005B9C]'
                }`}
              >
                <Plus className={isDark ? 'text-[#2A3618]' : 'text-white'} size={20} />
              </button>
            </div>
          </div>

          {/* Points Display */}
          <div className="mt-3">
            <Card className={`${isDark ? 'bg-[#556B2F] border-[#005B9C]' : 'bg-white border-[#005B9C]'} p-3`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className={isDark ? 'text-[#005B9C]' : 'text-[#005B9C]'} size={20} />
                  <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-[#333333]'}`}>
                    Seus Pontos
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-500 text-white font-bold">
                    {userPoints} pts
                  </Badge>
                  <Button
                    size="sm"
                    onClick={() => navigate('/social/convert')}
                    className={isDark ? 'bg-[#005B9C] text-[#2A3618] hover:bg-[#E5C34A]' : 'bg-[#005B9C] text-white hover:bg-[#005B9C]'}
                  >
                    <DollarSign size={14} className="mr-1" />
                    Converter
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide">
            {[
              { value: 'all', label: 'Todos', icon: Video },
              { value: 'my_videos', label: 'Meus Vídeos', icon: User },
              { value: 'lojista', label: 'Lojas', icon: TrendingUp },
              { value: 'service_provider', label: 'Prestadores', icon: Award }
            ].map((item) => (
              <button
                key={item.value}
                onClick={() => setFilter(item.value)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all
                  ${filter === item.value
                    ? isDark
                      ? 'bg-[#005B9C] text-[#2A3618]'
                      : 'bg-[#005B9C] text-white'
                    : isDark
                      ? 'bg-[#556B2F] text-[#E5C34A]'
                      : 'bg-white text-[#005B9C]'
                  }
                `}
              >
                <item.icon size={16} />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            ))}
          </div>
          
          {/* Hashtag Filter Indicator */}
          {hashtagFilter && (
            <div className="mt-2 flex items-center gap-2">
              <Badge className="bg-purple-500 text-white flex items-center gap-1">
                <Tag size={14} />
                #{hashtagFilter}
              </Badge>
              <button
                onClick={clearHashtagFilter}
                className={`text-sm underline ${isDark ? 'text-[#E5C34A]' : 'text-[#005B9C]'}`}
              >
                Limpar filtro
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Feed */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#005B9C] mx-auto"></div>
            <p className={`mt-4 ${isDark ? 'text-[#E5C34A]' : 'text-[#005B9C]'}`}>
              Carregando vídeos...
            </p>
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-12">
            <Video className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-[#E5C34A]' : 'text-[#005B9C]'}`} />
            <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-[#333333]'}`}>
              Nenhum vídeo ainda
            </h3>
            <p className={`mb-6 ${isDark ? 'text-[#E5C34A]' : 'text-[#005B9C]'}`}>
              Seja o primeiro a postar na Transmill Social!
            </p>
            <Button
              onClick={() => navigate('/social/upload')}
              className={isDark ? 'bg-[#005B9C] text-[#2A3618] hover:bg-[#E5C34A]' : 'bg-[#005B9C] text-white hover:bg-[#005B9C]'}
            >
              <Plus size={16} className="mr-2" />
              Criar Vídeo
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {videos.map((video) => (
              <Card
                key={video.id}
                className={`overflow-hidden ${
                  isDark ? 'bg-[#3F5123] border-[#005B9C]' : 'bg-white border-[#005B9C]'
                }`}
              >
                {/* User Header */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${isDark ? 'bg-[#556B2F]' : 'bg-[#E5D5C3]'} flex items-center justify-center`}>
                      <span className={`font-bold ${isDark ? 'text-[#005B9C]' : 'text-[#005B9C]'}`}>
                        {video.user_name?.[0] || 'U'}
                      </span>
                    </div>
                    <div>
                      <p className={`font-semibold ${isDark ? 'text-white' : 'text-[#333333]'}`}>
                        {video.user_name}
                      </p>
                      <p className={`text-xs ${isDark ? 'text-[#E5C34A]' : 'text-[#005B9C]'}`}>
                        {video.duration}s • {video.video_type === 'paid' ? '💰 Pago' : '🆓 Grátis'}
                      </p>
                    </div>
                  </div>
                  {video.user_type !== 'cliente' && (
                    <Badge className="bg-purple-500 text-white">
                      {video.user_type === 'lojista' ? '🏪' : '🔧'}
                    </Badge>
                  )}
                </div>

                {/* Video Player */}
                <VideoPlayer 
                  video={video}
                  onView={(duration, completed) => handleView(video.id, duration, completed)}
                  onShowProduct={() => setSelectedProductModal({
                    productId: video.product_id,
                    storeOwnerId: video.user_id
                  })}
                  onShowBooking={() => setSelectedBookingModal({
                    serviceId: video.service_id,
                    serviceProviderId: video.user_id
                  })}
                />

                {/* Description */}
                {video.description && (
                  <div className="px-4 py-2">
                    <p className={`text-sm ${isDark ? 'text-[#E5C34A]' : 'text-[#005B9C]'}`}>
                      {video.description}
                    </p>
                  </div>
                )}
                
                {/* Hashtags */}
                {video.hashtags && video.hashtags.length > 0 && (
                  <div className="px-4 pb-2 flex gap-2 flex-wrap">
                    {video.hashtags.map((tag, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleHashtagClick(tag)}
                        className={`text-xs font-medium px-2 py-1 rounded-full transition-colors ${
                          isDark
                            ? 'bg-[#556B2F] text-[#E5C34A] hover:bg-[#6B8239]'
                            : 'bg-[#E5D5C3] text-[#005B9C] hover:bg-[#D4C5B3]'
                        }`}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                )}

                {/* Interactions */}
                <div className={`px-4 py-3 flex items-center justify-between border-t ${isDark ? 'border-[#556B2F]' : 'border-[#E5D5C3]'}`}>
                  <button
                    onClick={() => handleLike(video.id)}
                    className="flex items-center gap-2 group"
                  >
                    <Heart
                      size={20}
                      className={`${
                        video.is_liked
                          ? 'fill-red-500 text-red-500'
                          : isDark
                            ? 'text-[#E5C34A] group-hover:text-red-500'
                            : 'text-[#005B9C] group-hover:text-red-500'
                      } transition-colors`}
                    />
                    <span className={`text-sm ${isDark ? 'text-[#E5C34A]' : 'text-[#005B9C]'}`}>
                      {video.likes_count}
                    </span>
                  </button>

                  <button 
                    onClick={() => setSelectedVideoForComments({...video, onCommentAdded: () => handleCommentAdded(video.id)})}
                    className="flex items-center gap-2 group"
                  >
                    <MessageCircle size={20} className={`${isDark ? 'text-[#E5C34A] group-hover:text-blue-500' : 'text-[#005B9C] group-hover:text-blue-500'} transition-colors`} />
                    <span className={`text-sm ${isDark ? 'text-[#E5C34A]' : 'text-[#005B9C]'}`}>
                      {video.comments_count}
                    </span>
                  </button>

                  <button className="flex items-center gap-2">
                    <Eye size={20} className={isDark ? 'text-[#E5C34A]' : 'text-[#005B9C]'} />
                    <span className={`text-sm ${isDark ? 'text-[#E5C34A]' : 'text-[#005B9C]'}`}>
                      {video.views_count}
                    </span>
                  </button>

                  <button 
                    onClick={() => setSelectedVideoForShare(video)}
                    className="flex items-center gap-2 group"
                  >
                    <Share2 size={20} className={`${isDark ? 'text-[#E5C34A] group-hover:text-green-500' : 'text-[#005B9C] group-hover:text-green-500'} transition-colors`} />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      {/* Modals */}
      <CommentsModal 
        video={selectedVideoForComments}
        isOpen={!!selectedVideoForComments}
        onClose={() => setSelectedVideoForComments(null)}
      />
      
      <ShareModal 
        video={selectedVideoForShare}
        isOpen={!!selectedVideoForShare}
        onClose={() => setSelectedVideoForShare(null)}
      />
      
      <ProductModal 
        productId={selectedProductModal?.productId}
        storeOwnerId={selectedProductModal?.storeOwnerId}
        isOpen={!!selectedProductModal}
        onClose={() => setSelectedProductModal(null)}
      />
      
      <BookingModal 
        serviceId={selectedBookingModal?.serviceId}
        serviceProviderId={selectedBookingModal?.serviceProviderId}
        isOpen={!!selectedBookingModal}
        onClose={() => setSelectedBookingModal(null)}
      />
    </div>
  );
};

export default SocialFeed;
