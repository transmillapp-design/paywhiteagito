import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import axios from 'axios';
import { Plus, Edit2, Trash2, Package } from 'lucide-react';

const CategoryModal = ({ open, onClose, categories, onSave, API }) => {
  const [categoryName, setCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    
    if (!categoryName.trim()) {
      toast.error('Nome da categoria é obrigatório');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (editingCategory) {
        // Atualizar categoria
        await axios.put(
          `${API}/merchant/categories/${editingCategory.category_id}`,
          { name: categoryName },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Categoria atualizada com sucesso!');
      } else {
        // Criar nova categoria
        await axios.post(
          `${API}/merchant/categories`,
          { name: categoryName },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Categoria criada com sucesso!');
      }

      setCategoryName('');
      setEditingCategory(null);
      onSave();
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
      toast.error(error.response?.data?.detail || 'Erro ao salvar categoria');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria? Os produtos não serão deletados, apenas ficarão sem categoria.')) {
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      await axios.delete(`${API}/merchant/categories/${categoryId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Categoria excluída com sucesso!');
      onSave();
    } catch (error) {
      console.error('Erro ao excluir categoria:', error);
      toast.error(error.response?.data?.detail || 'Erro ao excluir categoria');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
  };

  const cancelEdit = () => {
    setEditingCategory(null);
    setCategoryName('');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Gerenciar Categorias
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Formulário de Criar/Editar */}
          <form onSubmit={handleCreateCategory} className="space-y-4">
            <div>
              <Label>
                {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
              </Label>
              <div className="flex gap-2">
                <Input
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="Ex: Pizzas, Bebidas, Sobremesas..."
                  className="flex-1"
                />
                {editingCategory && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={cancelEdit}
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={loading || !categoryName.trim()}
                  className="bg-gradient-to-r from-[#005B9C] to-[#005B9C] hover:from-[#005B9C] hover:to-[#005B9C]"
                >
                  {loading ? 'Salvando...' : (editingCategory ? 'Atualizar' : 'Criar')}
                </Button>
              </div>
            </div>
          </form>

          {/* Lista de Categorias */}
          <div>
            <h3 className="font-semibold mb-3">Categorias Existentes</h3>
            
            {categories.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package size={48} className="mx-auto mb-4 opacity-50" />
                <p>Nenhuma categoria cadastrada</p>
                <p className="text-sm">Crie sua primeira categoria acima</p>
              </div>
            ) : (
              <div className="space-y-2">
                {categories.map((category) => (
                  <div
                    key={category.category_id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Package className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{category.name}</p>
                        <p className="text-sm text-gray-600">
                          {category.product_count || 0} produto(s)
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEdit(category)}
                        disabled={loading}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => handleDeleteCategory(category.category_id)}
                        disabled={loading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dica */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Dica:</strong> Organize seus produtos em categorias para facilitar a navegação dos clientes no seu catálogo.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryModal;
