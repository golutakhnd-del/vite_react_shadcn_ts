import { useState, useMemo } from 'react';
import { Package, DollarSign, ShoppingCart, AlertTriangle, Plus, Filter } from 'lucide-react';
import Header from '@/components/layout/Header';
import StatsCard from '@/components/dashboard/StatsCard';
import ProductCard, { Product } from '@/components/products/ProductCard';
import ProductForm from '@/components/forms/ProductForm';
import InvoiceGenerator from '@/components/invoice/InvoiceGenerator';
import InvoiceHistory from '@/components/invoice/InvoiceHistory';
import { ContactInfo } from '@/components/support/ContactInfo';
import CustomerManager from '@/components/customers/CustomerManager';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { sampleProducts } from '@/data/sampleData';
import Scene3D from '@/components/3d/Scene3D';

export default function Dashboard() {
  const [products, setProducts] = useLocalStorage<Product[]>('billcraft-products', sampleProducts);
  const [searchQuery, setSearchQuery] = useState('');
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');

  const filteredProducts = useMemo(() => {
    return products.filter(product =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  const stats = useMemo(() => {
    const totalProducts = products.length;
    const totalValue = products.reduce((sum, product) => sum + (product.price * product.stock), 0);
    const lowStockItems = products.filter(product => product.stock <= product.lowStockThreshold).length;
    const totalStock = products.reduce((sum, product) => sum + product.stock, 0);

    return {
      totalProducts,
      totalValue,
      lowStockItems,
      totalStock,
    };
  }, [products]);

  const handleSaveProduct = (productData: Omit<Product, 'id'> & { id?: string }) => {
    if (productData.id) {
      // Update existing product
      setProducts(prev => prev.map(p => p.id === productData.id ? { ...productData, id: productData.id } : p));
    } else {
      // Add new product
      const newProduct = {
        ...productData,
        id: Date.now().toString(),
      };
      setProducts(prev => [...prev, newProduct]);
    }
    setShowProductForm(false);
    setEditingProduct(null);
  };

  const handleDeleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowProductForm(true);
  };

  const handleAddToInvoice = (product: Product) => {
    if (!selectedProducts.find(p => p.id === product.id)) {
      setSelectedProducts(prev => [...prev, product]);
    }
    setActiveTab('invoice');
  };

  const handleClearInvoice = () => {
    setSelectedProducts([]);
  };

  const handleUpdateStock = (productId: string, quantity: number) => {
    setProducts(prev => prev.map(product => 
      product.id === productId 
        ? { ...product, stock: Math.max(0, product.stock - quantity) }
        : product
    ));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="relative">
        {/* Background 3D Scene */}
        <div className="fixed inset-0 opacity-20 pointer-events-none">
          <Scene3D enableControls={true} />
        </div>
        
        <div className="relative z-10 container mx-auto px-4 py-6">
          <Header onSearch={setSearchQuery} />

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="glass-card border-white/10">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="customers">Customers</TabsTrigger>
              <TabsTrigger value="invoice">Invoice</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="support">Support</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                  title="Total Products"
                  value={stats.totalProducts}
                  icon={Package}
                  color="#06b6d4"
                />
                <StatsCard
                  title="Inventory Value"
                  value={`₹${stats.totalValue.toLocaleString()}`}
                  icon={DollarSign}
                  color="#10b981"
                />
                <StatsCard
                  title="Total Stock"
                  value={stats.totalStock}
                  icon={ShoppingCart}
                  color="#3b82f6"
                />
                <StatsCard
                  title="Low Stock Alerts"
                  value={stats.lowStockItems}
                  icon={AlertTriangle}
                  color="#f59e0b"
                />
              </div>

              {/* Recent Products */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold gradient-text">Recent Products</h2>
                  <Button 
                    onClick={() => setActiveTab('products')}
                    className="bg-gradient-primary"
                  >
                    View All Products
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.slice(0, 6).map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onEdit={handleEditProduct}
                      onDelete={handleDeleteProduct}
                      onAddToInvoice={handleAddToInvoice}
                    />
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="products" className="space-y-6">
              {showProductForm ? (
                <ProductForm
                  product={editingProduct || undefined}
                  onSave={handleSaveProduct}
                  onCancel={() => {
                    setShowProductForm(false);
                    setEditingProduct(null);
                  }}
                />
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold gradient-text">Product Management</h2>
                    <Button 
                      onClick={() => setShowProductForm(true)}
                      className="bg-gradient-primary"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Product
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onEdit={handleEditProduct}
                        onDelete={handleDeleteProduct}
                        onAddToInvoice={handleAddToInvoice}
                      />
                    ))}
                  </div>

                  {filteredProducts.length === 0 && (
                    <div className="text-center py-12">
                      <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-2">No products found</h3>
                      <p className="text-muted-foreground">
                        {searchQuery ? 'Try adjusting your search query' : 'Add your first product to get started'}
                      </p>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="customers" className="space-y-6">
              <CustomerManager />
            </TabsContent>

            <TabsContent value="invoice" className="space-y-6">
              {selectedProducts.length > 0 ? (
                <div className="relative">
                  {/* 3D Invoice Container */}
                  <div className="glass-card border-white/10 shadow-elegant transform perspective-1000 hover:scale-105 transition-all duration-500">
                    <div className="absolute inset-0 bg-gradient-primary opacity-5 rounded-lg"></div>
                    <div className="relative z-10">
                      <InvoiceGenerator
                        selectedProducts={selectedProducts}
                        onClear={handleClearInvoice}
                        onUpdateStock={handleUpdateStock}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No products selected</h3>
                  <p className="text-muted-foreground mb-4">
                    Add products to your invoice to get started
                  </p>
                  <Button 
                    onClick={() => setActiveTab('products')}
                    className="bg-gradient-primary"
                  >
                    Browse Products
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              <InvoiceHistory />
            </TabsContent>

            <TabsContent value="support" className="space-y-6">
              <div className="max-w-md mx-auto">
                <ContactInfo />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}