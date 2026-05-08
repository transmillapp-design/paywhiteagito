import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../App';
import { useTheme } from '../contexts/ThemeContext';
import axios from 'axios';
import {
  X,
  Send,
  MessageCircle,
  Loader2
} from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';

const CommentsModal = ({ video, isOpen, onClose }) => {
  const { user, token, API } = useAuth();
  const { isDark } = useTheme();
  
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [posting, setPosting] = useState(false);
  const commentsEndRef = useRef(null);

  useEffect(() => {
    if (isOpen && video) {
      loadComments();
    }
  }, [isOpen, video]);

  useEffect(() => {
    scrollToBottom();
  }, [comments]);

  const scrollToBottom = () => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadComments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API}/social/videos/${video.id}/comments`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setComments(response.data.comments || []);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostComment = async () => {
    if (!commentText.trim()) {
      toast.error('Digite um comentário');
      return;
    }

    try {
      setPosting(true);
      const response = await axios.post(
        `${API}/social/videos/comment`,
        {
          video_id: video.id,
          comment_text: commentText
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`+${response.data.points_awarded} pontos!`, {
        description: 'Comentário publicado'
      });

      // Add comment to list
      const newComment = {
        id: response.data.comment_id,
        user_id: user.id,
        user_name: user.full_name,
        user_avatar: user.profile_image,
        comment_text: commentText,
        created_at: new Date().toISOString()
      };
      
      setComments([...comments, newComment]);
      setCommentText('');
      
      // Notify parent to update comment count
      if (video.onCommentAdded) {
        video.onCommentAdded();
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('Erro ao publicar comentário');
    } finally {
      setPosting(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `${diffMins}min`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div 
        className={`relative w-full sm:max-w-lg sm:mx-4 ${
          isDark ? 'bg-[#2A3618]' : 'bg-white'
        } rounded-t-2xl sm:rounded-2xl max-h-[80vh] sm:max-h-[600px] flex flex-col`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${
          isDark ? 'border-[#556B2F]' : 'border-gray-200'
        }`}>
          <div className="flex items-center gap-2">
            <MessageCircle className={isDark ? 'text-[#005B9C]' : 'text-[#005B9C]'} size={24} />
            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-[#333333]'}`}>
              Comentários
            </h3>
            <span className={`text-sm ${isDark ? 'text-[#E5C34A]' : 'text-[#005B9C]'}`}>
              ({comments.length})
            </span>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-full ${
              isDark ? 'hover:bg-[#556B2F]' : 'hover:bg-gray-100'
            }`}
          >
            <X className={isDark ? 'text-[#E5C34A]' : 'text-[#005B9C]'} size={24} />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className={`animate-spin ${isDark ? 'text-[#005B9C]' : 'text-[#005B9C]'}`} size={32} />
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32">
              <MessageCircle className={`mb-2 ${isDark ? 'text-[#556B2F]' : 'text-gray-300'}`} size={48} />
              <p className={`text-sm ${isDark ? 'text-[#E5C34A]' : 'text-[#005B9C]'}`}>
                Seja o primeiro a comentar!
              </p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full ${
                  isDark ? 'bg-[#556B2F]' : 'bg-[#E5D5C3]'
                } flex items-center justify-center flex-shrink-0`}>
                  {comment.user_avatar ? (
                    <img 
                      src={comment.user_avatar} 
                      alt={comment.user_name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className={`text-xs font-bold ${
                      isDark ? 'text-[#005B9C]' : 'text-[#005B9C]'
                    }`}>
                      {comment.user_name?.[0] || 'U'}
                    </span>
                  )}
                </div>

                {/* Comment Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-sm font-semibold ${
                      isDark ? 'text-white' : 'text-[#333333]'
                    }`}>
                      {comment.user_name}
                    </span>
                    <span className={`text-xs ${
                      isDark ? 'text-[#E5C34A]' : 'text-[#005B9C]'
                    }`}>
                      {formatDate(comment.created_at)}
                    </span>
                  </div>
                  <p className={`text-sm ${
                    isDark ? 'text-[#E5C34A]' : 'text-[#005B9C]'
                  }`}>
                    {comment.comment_text}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={commentsEndRef} />
        </div>

        {/* Comment Input */}
        <div className={`p-4 border-t ${
          isDark ? 'border-[#556B2F]' : 'border-gray-200'
        }`}>
          <div className="flex gap-2">
            <Textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Escreva um comentário..."
              rows={2}
              className={`flex-1 resize-none ${
                isDark ? 'bg-[#3F5123] border-[#556B2F] text-white' : ''
              }`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handlePostComment();
                }
              }}
              maxLength={500}
            />
            <Button
              onClick={handlePostComment}
              disabled={posting || !commentText.trim()}
              className={`self-end ${
                isDark
                  ? 'bg-[#005B9C] text-[#2A3618] hover:bg-[#E5C34A]'
                  : 'bg-[#005B9C] text-white hover:bg-[#005B9C]'
              }`}
            >
              {posting ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Send size={20} />
              )}
            </Button>
          </div>
          <p className={`text-xs mt-1 ${
            isDark ? 'text-[#E5C34A]' : 'text-[#005B9C]'
          }`}>
            {commentText.length}/500 • Pressione Enter para enviar
          </p>
        </div>
      </div>
    </div>
  );
};

export default CommentsModal;
