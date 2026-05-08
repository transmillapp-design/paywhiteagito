import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import axios from 'axios';
import {
  Video,
  DollarSign,
  Award,
  TrendingUp,
  Eye,
  Heart,
  MessageCircle,
  Settings,
  BarChart3,
  Save,
  RefreshCw,
  Clock,
  Users,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { toast } from 'sonner';

const SocialManagement = () => {
  const { token, API } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('analytics'); // analytics, settings, videos
  
  // Analytics
  const [analytics, setAnalytics] = useState({
    total_videos: 0,
    free_videos: 0,
    paid_videos: 0,
    total_likes: 0,
    total_comments: 0,
    total_views: 0,
    paid_videos_revenue: 0,
    total_points_distributed: 0
  });
  
  // Settings
  const [settings, setSettings] = useState({
    free_video_min_duration: 7,
    free_video_max_duration: 30,
    paid_video_min_duration: 30,
    paid_video_max_duration: 60,
    paid_video_price: 5.0,
    points_per_post: 50,
    points_per_like: 5,
    points_per_comment: 10,
    points_per_view: 2,
    points_per_full_view: 5,
    points_to_brl_rate: 0.01,
    social_enabled: true
  });
  
  // Videos list
  const [videos, setVideos] = useState([]);
  const [videosLoading, setVideosLoading] = useState(false);

  useEffect(() => {
    loadAnalytics();
    loadSettings();
  }, []);

  useEffect(() => {
    if (activeSection === 'videos') {
      loadVideos();
    }
  }, [activeSection]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/master/social/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnalytics(response.data.analytics);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Erro ao carregar analytics');
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const response = await axios.get(`${API}/master/social/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSettings(response.data.settings);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Erro ao carregar configurações');
    }
  };

  const loadVideos = async () => {
    try {
      setVideosLoading(true);
      const response = await axios.get(`${API}/social/videos?limit=50`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVideos(response.data.videos || []);
    } catch (error) {
      console.error('Error loading videos:', error);
      toast.error('Erro ao carregar vídeos');
    } finally {
      setVideosLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      await axios.post(
        `${API}/master/social/settings`,
        settings,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('✅ Configurações salvas com sucesso!');
      await loadAnalytics(); // Reload analytics after settings change
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Video className="text-purple-600" size={32} />
          <div>
            <h2 className="text-2xl font-bold">Transmill Social</h2>
            <p className="text-sm text-gray-600">Gerenciamento da Rede Social</p>
          </div>
        </div>
        
        <Button onClick={loadAnalytics} variant="outline" size="sm">
          <RefreshCw size={16} className="mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveSection('analytics')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeSection === 'analytics'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <BarChart3 size={16} className="inline mr-2" />
          Analytics
        </button>
        <button
          onClick={() => setActiveSection('settings')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeSection === 'settings'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Settings size={16} className="inline mr-2" />
          Configurações
        </button>
        <button
          onClick={() => setActiveSection('videos')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeSection === 'videos'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Video size={16} className="inline mr-2" />
          Vídeos
        </button>
      </div>

      {/* Analytics Section */}
      {activeSection === 'analytics' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total de Vídeos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{analytics.total_videos}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {analytics.free_videos} grátis | {analytics.paid_videos} pagos
                    </p>
                  </div>
                  <Video className="text-purple-600" size={32} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Receita de Vídeos Pagos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">R$ {analytics.paid_videos_revenue.toFixed(2)}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {analytics.paid_videos} vídeos × R$ 5,00
                    </p>
                  </div>
                  <DollarSign className="text-green-600" size={32} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Engajamento Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">
                      {analytics.total_views + analytics.total_likes + analytics.total_comments}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {analytics.total_views} views | {analytics.total_likes} likes | {analytics.total_comments} comments
                    </p>
                  </div>
                  <TrendingUp className="text-blue-600" size={32} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Pontos Distribuídos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{analytics.total_points_distributed}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      ≈ R$ {(analytics.total_points_distributed * 0.01).toFixed(2)} em cashback potencial
                    </p>
                  </div>
                  <Award className="text-yellow-600" size={32} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Estatísticas de Interação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="text-blue-600" size={20} />
                    <span className="text-sm">Visualizações</span>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">{analytics.total_views}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Heart className="text-red-600" size={20} />
                    <span className="text-sm">Curtidas</span>
                  </div>
                  <Badge className="bg-red-100 text-red-800">{analytics.total_likes}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="text-green-600" size={20} />
                    <span className="text-sm">Comentários</span>
                  </div>
                  <Badge className="bg-green-100 text-green-800">{analytics.total_comments}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resumo Financeiro</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Vídeos Grátis</span>
                  <Badge className="bg-green-100 text-green-800">{analytics.free_videos}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Vídeos Pagos</span>
                  <Badge className="bg-purple-100 text-purple-800">{analytics.paid_videos}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Receita Total</span>
                  <Badge className="bg-green-600 text-white">R$ {analytics.paid_videos_revenue.toFixed(2)}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Settings Section */}
      {activeSection === 'settings' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock size={20} />
                Configurações de Duração de Vídeos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Vídeo Grátis - Duração Mínima (segundos)</Label>
                  <Input
                    type="number"
                    value={settings.free_video_min_duration}
                    onChange={(e) => updateSetting('free_video_min_duration', parseInt(e.target.value))}
                    min="5"
                    max="30"
                  />
                  <p className="text-xs text-gray-500 mt-1">Mínimo: 5s</p>
                </div>
                <div>
                  <Label>Vídeo Grátis - Duração Máxima (segundos)</Label>
                  <Input
                    type="number"
                    value={settings.free_video_max_duration}
                    onChange={(e) => updateSetting('free_video_max_duration', parseInt(e.target.value))}
                    min="10"
                    max="60"
                  />
                  <p className="text-xs text-gray-500 mt-1">Recomendado: 30s</p>
                </div>
                <div>
                  <Label>Vídeo Pago - Duração Mínima (segundos)</Label>
                  <Input
                    type="number"
                    value={settings.paid_video_min_duration}
                    onChange={(e) => updateSetting('paid_video_min_duration', parseInt(e.target.value))}
                    min="30"
                    max="60"
                  />
                  <p className="text-xs text-gray-500 mt-1">Deve ser maior que duração máxima grátis</p>
                </div>
                <div>
                  <Label>Vídeo Pago - Duração Máxima (segundos)</Label>
                  <Input
                    type="number"
                    value={settings.paid_video_max_duration}
                    onChange={(e) => updateSetting('paid_video_max_duration', parseInt(e.target.value))}
                    min="30"
                    max="120"
                  />
                  <p className="text-xs text-gray-500 mt-1">Máximo: 120s (2 minutos)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign size={20} />
                Configurações de Monetização
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Preço do Vídeo Pago (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={settings.paid_video_price}
                  onChange={(e) => updateSetting('paid_video_price', parseFloat(e.target.value))}
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Valor cobrado de lojistas e prestadores por vídeos de {settings.paid_video_min_duration}-{settings.paid_video_max_duration}s
                </p>
              </div>
              <div>
                <Label>Taxa de Conversão de Pontos</Label>
                <Input
                  type="number"
                  step="0.001"
                  value={settings.points_to_brl_rate}
                  onChange={(e) => updateSetting('points_to_brl_rate', parseFloat(e.target.value))}
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Atualmente: {Math.round(1 / settings.points_to_brl_rate)} pontos = R$ 1,00
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award size={20} />
                Sistema de Pontos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Pontos por Postagem</Label>
                  <Input
                    type="number"
                    value={settings.points_per_post}
                    onChange={(e) => updateSetting('points_per_post', parseInt(e.target.value))}
                    min="0"
                  />
                </div>
                <div>
                  <Label>Pontos por Curtida</Label>
                  <Input
                    type="number"
                    value={settings.points_per_like}
                    onChange={(e) => updateSetting('points_per_like', parseInt(e.target.value))}
                    min="0"
                  />
                </div>
                <div>
                  <Label>Pontos por Comentário</Label>
                  <Input
                    type="number"
                    value={settings.points_per_comment}
                    onChange={(e) => updateSetting('points_per_comment', parseInt(e.target.value))}
                    min="0"
                  />
                </div>
                <div>
                  <Label>Pontos por Visualização</Label>
                  <Input
                    type="number"
                    value={settings.points_per_view}
                    onChange={(e) => updateSetting('points_per_view', parseInt(e.target.value))}
                    min="0"
                  />
                </div>
                <div>
                  <Label>Pontos Bônus (vídeo completo)</Label>
                  <Input
                    type="number"
                    value={settings.points_per_full_view}
                    onChange={(e) => updateSetting('points_per_full_view', parseInt(e.target.value))}
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">Bônus ao assistir até o fim</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings size={20} />
                Configurações Gerais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Rede Social Ativa</Label>
                  <p className="text-xs text-gray-500">Desativar temporariamente a rede social</p>
                </div>
                <Switch
                  checked={settings.social_enabled}
                  onCheckedChange={(checked) => updateSetting('social_enabled', checked)}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSaveSettings} disabled={saving} className="bg-purple-600 hover:bg-purple-700">
              {saving ? (
                <>
                  <RefreshCw size={16} className="mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save size={16} className="mr-2" />
                  Salvar Configurações
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Videos Section */}
      {activeSection === 'videos' && (
        <div className="space-y-4">
          {videosLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : videos.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Video className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">Nenhum vídeo publicado ainda</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {videos.map((video) => (
                <Card key={video.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                          <span className="text-xs font-bold text-purple-600">
                            {video.user_name?.[0] || 'U'}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{video.user_name}</p>
                          <p className="text-xs text-gray-500">{video.duration}s</p>
                        </div>
                      </div>
                      <Badge className={video.video_type === 'paid' ? 'bg-purple-600' : 'bg-green-600'}>
                        {video.video_type === 'paid' ? 'Pago' : 'Grátis'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {video.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">{video.description}</p>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Eye size={14} />
                        {video.views_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart size={14} />
                        {video.likes_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle size={14} />
                        {video.comments_count}
                      </span>
                    </div>
                    {video.hashtags && video.hashtags.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {video.hashtags.map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SocialManagement;
