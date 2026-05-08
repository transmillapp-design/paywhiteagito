import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../App';
import { useTheme } from '../contexts/ThemeContext';
import axios from 'axios';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  MoreVertical,
  ShoppingCart,
  Calendar
} from 'lucide-react';

const VideoPlayer = ({ video, onView, onShowProduct, onShowBooking }) => {
  const videoRef = useRef(null);
  const { isDark } = useTheme();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [watchDuration, setWatchDuration] = useState(0);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleTimeUpdate = () => {
      const current = videoElement.currentTime;
      const duration = videoElement.duration;
      setCurrentTime(current);
      setProgress((current / duration) * 100);
      setWatchDuration(Math.floor(current));
    };

    const handleEnded = () => {
      setIsPlaying(false);
      // Report view when video ends
      if (onView && hasStarted) {
        onView(watchDuration, true);
      }
    };

    const handlePlay = () => {
      setIsPlaying(true);
      if (!hasStarted) {
        setHasStarted(true);
      }
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('ended', handleEnded);
    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);

    return () => {
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      videoElement.removeEventListener('ended', handleEnded);
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
      
      // Report view on unmount if watched
      if (hasStarted && watchDuration > 0 && onView) {
        onView(watchDuration, false);
      }
    };
  }, [hasStarted, watchDuration, onView]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleProgressClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    
    if (videoRef.current) {
      videoRef.current.currentTime = percentage * videoRef.current.duration;
    }
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      } else if (videoRef.current.webkitRequestFullscreen) {
        videoRef.current.webkitRequestFullscreen();
      } else if (videoRef.current.mozRequestFullScreen) {
        videoRef.current.mozRequestFullScreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      }
      setIsFullscreen(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`relative aspect-video ${isDark ? 'bg-black' : 'bg-gray-900'} rounded-lg overflow-hidden group`}>
      {/* Video Element */}
      <video
        ref={videoRef}
        src={video.video_data}
        className="w-full h-full object-contain"
        playsInline
        onClick={togglePlay}
      />

      {/* Play/Pause Overlay */}
      {!isPlaying && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 cursor-pointer"
          onClick={togglePlay}
        >
          <div className="bg-white bg-opacity-90 rounded-full p-4 hover:bg-opacity-100 transition-all">
            <Play className="text-black" size={48} fill="black" />
          </div>
        </div>
      )}

      {/* Controls Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4">
        {/* Progress Bar */}
        <div 
          className="w-full h-1 bg-gray-600 rounded-full cursor-pointer mb-3"
          onClick={handleProgressClick}
        >
          <div 
            className="h-full bg-white rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <button onClick={togglePlay} className="hover:scale-110 transition-transform">
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>
            
            <button onClick={toggleMute} className="hover:scale-110 transition-transform">
              {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
            </button>

            <span className="text-sm">
              {formatTime(currentTime)} / {formatTime(video.duration)}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={toggleFullscreen} className="hover:scale-110 transition-transform">
              {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Duration Badge */}
      <div className="absolute top-2 right-2 bg-black bg-opacity-70 px-2 py-1 rounded text-white text-xs">
        {video.duration}s
      </div>
      
      {/* Action Buttons Overlay - Estilo TikTok */}
      {video.user_type === 'lojista' && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onShowProduct && onShowProduct();
          }}
          className="absolute bottom-20 right-4 bg-white hover:bg-gray-100 text-black p-3 rounded-full shadow-lg transition-all hover:scale-110 z-20"
          title="Ver Produto"
        >
          <ShoppingCart size={24} />
        </button>
      )}
      
      {video.user_type === 'service_provider' && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onShowBooking && onShowBooking();
          }}
          className="absolute bottom-20 right-4 bg-white hover:bg-gray-100 text-black p-3 rounded-full shadow-lg transition-all hover:scale-110 z-20"
          title="Agendar Serviço"
        >
          <Calendar size={24} />
        </button>
      )}
    </div>
  );
};

export default VideoPlayer;
