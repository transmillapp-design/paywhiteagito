import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { 
  Plus, Edit, Trash2, Save, X, Package, Grid, List, 
  Image as ImageIcon, DollarSign, Tag, Star, Eye, EyeOff 
} from 'lucide-react';
import axios from 'axios';

const MerchantCatalog = ({ API, token }) => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  // Form states
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    display_order: 0
  });
  
  const [productForm, setProductForm] = useState({
    category_id: '',
    name: '',
    description: '',
    price: '',
    images: [],
    has_stock_control: false,
    stock_quantity: '',
    variations: [],
    complements: [],
    has_promotion: false,
    promotion_price: '',
    promotion_description: ''
  });

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/merchant/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setCategories(response.data.categories);
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      toast.error('Erro ao carregar categorias');
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/merchant/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setProducts(response.data.products);
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      toast.error('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    
    try {
      if (editingCategory) {
        await axios.put(
          `${API}/merchant/categories/${editingCategory}`,
          categoryForm,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Categoria atualizada!');
      } else {
        await axios.post(
          `${API}/merchant/categories`,
          categoryForm,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Categoria criada!');
      }
      
      resetCategoryForm();
      fetchCategories();
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
      toast.error(error.response?.data?.detail || 'Erro ao salvar categoria');
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    
    try {
      const payload = {
        ...productForm,
        price: parseFloat(productForm.price),
        stock_quantity: productForm.has_stock_control ? parseInt(productForm.stock_quantity) : null,
        promotion_price: productForm.has_promotion ? parseFloat(productForm.promotion_price) : null
      };
      
      if (editingProduct) {
        await axios.put(
          `${API}/merchant/products/${editingProduct}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Produto atualizado!');
      } else {
        await axios.post(
          `${API}/merchant/products`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Produto criado!');
      }
      
      resetProductForm();
      fetchProducts();
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      toast.error(error.response?.data?.detail || 'Erro ao salvar produto');
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Tem certeza que deseja deletar esta categoria?')) return;
    
    try {
      await axios.delete(`${API}/merchant/categories/${categoryId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Categoria deletada!');
      fetchCategories();
    } catch (error) {
      console.error('Erro ao deletar categoria:', error);
      toast.error(error.response?.data?.detail || 'Erro ao deletar categoria');
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Tem certeza que deseja deletar este produto?')) return;
    
    try {
      await axios.delete(`${API}/merchant/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Produto deletado!');
      fetchProducts();
    } catch (error) {
      console.error('Erro ao deletar produto:', error);
      toast.error('Erro ao deletar produto');
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category.category_id);
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      display_order: category.display_order
    });
    setShowCategoryForm(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product.product_id);
    setProductForm({
      category_id: product.category_id || '',
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      images: product.images || [],
      has_stock_control: product.has_stock_control,
      stock_quantity: product.stock_quantity?.toString() || '',
      variations: product.variations || [],
      complements: product.complements || [],
      has_promotion: product.has_promotion,
      promotion_price: product.promotion_price?.toString() || '',
      promotion_description: product.promotion_description || ''
    });
    setShowProductForm(true);
  };

  const resetCategoryForm = () => {
    setCategoryForm({ name: '', description: '', display_order: 0 });
    setEditingCategory(null);
    setShowCategoryForm(false);
  };

  const resetProductForm = () => {
    setProductForm({
      category_id: '',
      name: '',
      description: '',
      price: '',
      images: [],
      has_stock_control: false,
      stock_quantity: '',
      variations: [],
      complements: [],
      has_promotion: false,
      promotion_price: '',
      promotion_description: ''
    });
    setEditingProduct(null);
    setShowProductForm(false);
  };

  const filteredProducts = selectedCategory
    ? products.filter(p => p.category_id === selectedCategory)
    : products;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center text-purple-900">
            <Package className="mr-3 text-purple-600" size={28} />
            <span>Meu Catálogo / Cardápio</span>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button 
          onClick={() => setShowCategoryForm(true)}
          className="btn-primary"
        >
          <Plus size={18} />
          Nova Categoria
        </Button>
        
        <Button 
          onClick={() => setShowProductForm(true)}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus size={18} />
          Novo Produto
        </Button>
      </div>

      {/* Category Form Modal */}
      {showCategoryForm && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{editingCategory ? 'Editar Categoria' : 'Nova Categoria'}</span>
              <Button variant="ghost" size="sm" onClick={resetCategoryForm}>
                <X size={20} />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <Label>Nome da Categoria *</Label>
                <Input
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="Ex: Bebidas, Pizzas, Sobremesas"
                  required
                />
              </div>
              
              <div>
                <Label>Descrição</Label>
                <Input
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  placeholder="Opcional"
                />
              </div>
              
              <div className="flex gap-3">
                <Button type="submit" className="flex-1 btn-primary">
                  <Save size={18} />
                  {editingCategory ? 'Atualizar' : 'Criar'}
                </Button>
                <Button type="button" variant="outline" onClick={resetCategoryForm}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Product Form Modal */}
      {showProductForm && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{editingProduct ? 'Editar Produto' : 'Novo Produto'}</span>
              <Button variant="ghost" size="sm" onClick={resetProductForm}>
                <X size={20} />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <Label>Categoria</Label>
                <select
                  value={productForm.category_id}
                  onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">Sem categoria</option>
                  {categories.map(cat => (
                    <option key={cat.category_id} value={cat.category_id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label>Nome do Produto *</Label>
                <Input
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="Ex: Pizza Margherita"
                  required
                />
              </div>
              
              <div>
                <Label>Descrição</Label>
                <textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Descreva o produto..."
                  className="w-full px-3 py-2 border rounded-md min-h-[80px]"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Preço (R$) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
                
                <div>
                  <Label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={productForm.has_stock_control}
                      onChange={(e) => setProductForm({ ...productForm, has_stock_control: e.target.checked })}
                    />
                    Controlar Estoque
                  </Label>
                  {productForm.has_stock_control && (
                    <Input
                      type="number"
                      value={productForm.stock_quantity}
                      onChange={(e) => setProductForm({ ...productForm, stock_quantity: e.target.value })}
                      placeholder="Quantidade"
                      className="mt-2"
                    />
                  )}
                </div>
              </div>
              
              <div>
                <Label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={productForm.has_promotion}
                    onChange={(e) => setProductForm({ ...productForm, has_promotion: e.target.checked })}
                  />
                  Produto em Promoção
                </Label>
                {productForm.has_promotion && (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={productForm.promotion_price}
                      onChange={(e) => setProductForm({ ...productForm, promotion_price: e.target.value })}
                      placeholder="Preço promocional"
                    />
                    <Input
                      value={productForm.promotion_description}
                      onChange={(e) => setProductForm({ ...productForm, promotion_description: e.target.value })}
                      placeholder="Descrição da promoção"
                    />
                  </div>
                )}
              </div>
              
              <div className="flex gap-3">
                <Button type="submit" className="flex-1 btn-primary">
                  <Save size={18} />
                  {editingProduct ? 'Atualizar' : 'Criar'}
                </Button>
                <Button type="button" variant="outline" onClick={resetProductForm}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Categories List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Grid className="mr-2" size={20} />
            Categorias ({categories.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package size={48} className="mx-auto mb-3 text-gray-400" />
              <p>Nenhuma categoria criada ainda</p>
              <p className="text-sm">Crie categorias para organizar seus produtos</p>
            </div>
          ) : (
            <div className="space-y-2">
              {categories.map((category) => (
                <div
                  key={category.category_id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold">{category.name}</h3>
                    {category.description && (
                      <p className="text-sm text-gray-600">{category.description}</p>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Badge variant="outline">
                      {products.filter(p => p.category_id === category.category_id).length} produtos
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditCategory(category)}
                      className="text-blue-600"
                    >
                      <Edit size={14} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteCategory(category.category_id)}
                      className="text-red-600"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Products List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Package className="mr-2" size={20} />
              Produtos ({filteredProducts.length})
            </span>
            
            {categories.length > 0 && (
              <select
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
                className="px-3 py-1 border rounded-md text-sm"
              >
                <option value="">Todas as categorias</option>
                {categories.map(cat => (
                  <option key={cat.category_id} value={cat.category_id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8">Carregando...</p>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package size={48} className="mx-auto mb-3 text-gray-400" />
              <p>Nenhum produto cadastrado ainda</p>
              <p className="text-sm">Adicione produtos ao seu catálogo</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((product) => (
                <Card key={product.product_id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    {/* Imagem do Produto - Padrão iFood (Quadrada 1:1) */}
                    <div className="relative w-full pb-[100%] mb-3 rounded-lg overflow-hidden bg-gray-100">
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <ImageIcon size={40} className="text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    <h3 className="font-bold text-lg mb-1">{product.name}</h3>
                    {product.description && (
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {product.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        {product.has_promotion ? (
                          <>
                            <span className="text-gray-500 line-through text-sm">
                              R$ {product.price.toFixed(2)}
                            </span>
                            <span className="text-green-600 font-bold text-lg ml-2">
                              R$ {product.promotion_price.toFixed(2)}
                            </span>
                          </>
                        ) : (
                          <span className="font-bold text-lg">
                            R$ {product.price.toFixed(2)}
                          </span>
                        )}
                      </div>
                      
                      <Badge className={
                        product.status === 'available' 
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }>
                        {product.status === 'available' ? 'Disponível' : 'Indisponível'}
                      </Badge>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditProduct(product)}
                        className="flex-1 text-blue-600"
                      >
                        <Edit size={14} />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteProduct(product.product_id)}
                        className="text-red-600"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MerchantCatalog;
