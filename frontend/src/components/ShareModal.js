import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import {
  X,
  Copy,
  Check,
  Share2,
  Facebook,
  Twitter,
  Linkedin,
  Mail,
  MessageCircle as WhatsApp
} from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';

const ShareModal = ({ video, isOpen, onClose }) => {
  const { isDark } = useTheme();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareUrl = `${window.location.origin}/social?video=${video.id}`;
  const shareText = video.description 
    ? `Confira este vídeo: ${video.description.substring(0, 100)}...`
    : 'Confira este vídeo na Transmill Social!';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Erro ao copiar link');
    }
  };

  const handleShare = (platform) => {
    let url = '';
    
    switch (platform) {
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'email':
        url = `mailto:?subject=${encodeURIComponent('Vídeo da Transmill Social')}&body=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`;
        break;
      default:
        return;
    }

    window.open(url, '_blank', 'width=600,height=400');
    toast.success('Compartilhado!');
  };

  const shareOptions = [
    { id: 'whatsapp', name: 'WhatsApp', icon: WhatsApp, color: 'bg-green-500', textColor: 'text-white' },
    { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'bg-blue-600', textColor: 'text-white' },
    { id: 'twitter', name: 'Twitter', icon: Twitter, color: 'bg-sky-500', textColor: 'text-white' },
    { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'bg-blue-700', textColor: 'text-white' },
    { id: 'email', name: 'E-mail', icon: Mail, color: 'bg-gray-600', textColor: 'text-white' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div 
        className={`relative w-full sm:max-w-md sm:mx-4 ${
          isDark ? 'bg-[#2A3618]' : 'bg-white'
        } rounded-t-2xl sm:rounded-2xl p-6`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Share2 className={isDark ? 'text-[#005B9C]' : 'text-[#005B9C]'} size={24} />
            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-[#333333]'}`}>
              Compartilhar Vídeo
            </h3>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-full ${
              isDark ? 'hover:bg-[#556B2F]' : 'hover:bg-gray-100'
            }`}
          >
            <X className={isDark ? 'text-[#E5C34A]' : 'text-[#005B9C]'} size={20} />
          </button>
        </div>

        {/* Share Options */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {shareOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => handleShare(option.id)}
              className="flex flex-col items-center gap-2 group"
            >
              <div className={`${option.color} p-4 rounded-full group-hover:scale-110 transition-transform`}>
                <option.icon className={option.textColor} size={24} />
              </div>
              <span className={`text-xs ${isDark ? 'text-[#E5C34A]' : 'text-[#005B9C]'}`}>
                {option.name}
              </span>
            </button>
          ))}
        </div>

        {/* Copy Link */}
        <div className={`p-4 rounded-lg ${
          isDark ? 'bg-[#3F5123] border border-[#556B2F]' : 'bg-gray-50 border border-gray-200'
        }`}>
          <label className={`text-sm font-semibold mb-2 block ${
            isDark ? 'text-white' : 'text-[#333333]'
          }`}>
            Link do Vídeo
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className={`flex-1 px-3 py-2 rounded text-sm ${
                isDark 
                  ? 'bg-[#2A3618] border-[#556B2F] text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              } border focus:outline-none`}
            />
            <Button
              onClick={handleCopyLink}
              className={`${
                isDark
                  ? 'bg-[#005B9C] text-[#2A3618] hover:bg-[#E5C34A]'
                  : 'bg-[#005B9C] text-white hover:bg-[#005B9C]'
              }`}
            >
              {copied ? (
                <>
                  <Check size={16} className="mr-1" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy size={16} className="mr-1" />
                  Copiar
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
