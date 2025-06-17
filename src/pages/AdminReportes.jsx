import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, Package, Users, ShoppingCart, AlertTriangle, 
  Calendar, RefreshCw, DollarSign, Eye,
  ArrowUp, ArrowDown, Minus, CheckCircle, Clock, XCircle,
  Settings, Mail, FileText
} from 'lucide-react';

const AdminReportes = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    fechaInicio: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    fechaFin: new Date().toISOString().split('T')[0],
    periodo: 'mes',
    limite: 10
  });

  // Estados para cada tipo de reporte
  const [dashboardData, setDashboardData] = useState(null);
  const [ventasData, setVentasData] = useState(null);
  const [productosData, setProductosData] = useState(null);
  const [inventarioData, setInventarioData] = useState(null);
  const [clientesData, setClientesData] = useState(null);
  const [pedidosData, setPedidosData] = useState(null);
  const [categoriasData, setCategoriasData] = useState(null);

  // Función para formatear dinero chileno
  const formatCLP = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) return '$0';
    
    // Convertir a número si es string
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    // Formatear sin decimales (pesos chilenos no usan decimales)
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.round(num));
  };

  // Función para formatear números grandes de manera más legible
  const formatCLPCompact = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) return '$0';
    
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    if (num >= 1000000000) {
      return `$${(num / 1000000000).toFixed(1)}MM`;
    } else if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(0)}K`;
    }
    
    return formatCLP(num);
  };

  // Colores para los gráficos
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  const API_BASE = 'http://localhost:3000/api/reportes';

  // Función para verificar la conexión
  const testConnection = async () => {
    try {
      const response = await fetch(`${API_BASE}/health`);
      const data = await response.json();
      console.log('✅ Conexión exitosa:', data);
      return true;
    } catch (error) {
      console.error('❌ Error de conexión:', error);
      return false;
    }
  };

  // Función genérica para hacer peticiones
  const fetchData = async (endpoint, params = {}) => {
    try {
      setLoading(true);
      setError('');
      
      const queryParams = new URLSearchParams({ ...filters, ...params });
      const response = await fetch(`${API_BASE}${endpoint}?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (err) {
      setError(err.message);
      console.error('Error fetching data:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos del dashboard
  const loadDashboard = async () => {
    const data = await fetchData('/dashboard');
    if (data) setDashboardData(data);
  };

  // Cargar datos de ventas
  const loadVentas = async () => {
    const data = await fetchData('/ventas');
    if (data) setVentasData(data);
  };

  // Cargar productos más vendidos
  const loadProductos = async () => {
    const data = await fetchData('/productos-vendidos');
    if (data) setProductosData(data);
  };

  // Cargar inventario
  const loadInventario = async () => {
    const data = await fetchData('/inventario');
    if (data) setInventarioData(data);
  };

  // Cargar análisis de clientes
  const loadClientes = async () => {
    const data = await fetchData('/clientes');
    if (data) setClientesData(data);
  };

  // Cargar estado de pedidos
  const loadPedidos = async () => {
    const data = await fetchData('/pedidos');
    if (data) setPedidosData(data);
  };

  // Cargar rendimiento de categorías
  const loadCategorias = async () => {
    const data = await fetchData('/categorias');
    if (data) setCategoriasData(data);
  };

  // Cargar datos según la pestaña activa
  useEffect(() => {
    // Primero verificar conexión
    testConnection().then(connected => {
      if (!connected) {
        setError('No se puede conectar con el servidor. Verifica que esté corriendo en puerto 3000.');
        return;
      }
      
      const loadData = () => {
        switch (activeTab) {
          case 'dashboard':
            loadDashboard();
            break;
          case 'ventas':
            loadVentas();
            break;
          case 'productos':
            loadProductos();
            break;
          case 'inventario':
            loadInventario();
            break;
          case 'clientes':
            loadClientes();
            break;
          case 'pedidos':
            loadPedidos();
            break;
          case 'categorias':
            loadCategorias();
            break;
          default:
            loadDashboard();
        }
      };

      loadData();
    });
  }, [activeTab]);

  // Componente para métricas del dashboard
  const MetricCard = ({ title, value, icon: Icon, trend, color = 'blue', isMonetary = false }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200 hover:border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <div className={`p-2 rounded-lg mr-3 ${
              color === 'green' ? 'bg-green-100' :
              color === 'blue' ? 'bg-blue-100' :
              color === 'purple' ? 'bg-purple-100' :
              color === 'orange' ? 'bg-orange-100' :
              color === 'red' ? 'bg-red-100' :
              'bg-gray-100'
            }`}>
              <Icon className={`w-5 h-5 ${
                color === 'green' ? 'text-green-600' :
                color === 'blue' ? 'text-blue-600' :
                color === 'purple' ? 'text-purple-600' :
                color === 'orange' ? 'text-orange-600' :
                color === 'red' ? 'text-red-600' :
                'text-gray-600'
              }`} />
            </div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
          </div>
          <p className={`text-2xl font-bold ${
            color === 'green' ? 'text-green-600' :
            color === 'blue' ? 'text-blue-600' :
            color === 'purple' ? 'text-purple-600' :
            color === 'orange' ? 'text-orange-600' :
            color === 'red' ? 'text-red-600' :
            'text-gray-900'
          }`}>
            {isMonetary && typeof value === 'number' ? formatCLP(value) : 
             typeof value === 'number' ? value.toLocaleString('es-CL') : value}
          </p>
          {trend && (
            <div className={`flex items-center mt-2 text-sm ${
              trend > 0 ? 'text-green-600' : 
              trend < 0 ? 'text-red-600' : 
              'text-gray-500'
            }`}>
              {trend > 0 ? (
                <ArrowUp className="w-4 h-4 mr-1" />
              ) : trend < 0 ? (
                <ArrowDown className="w-4 h-4 mr-1" />
              ) : (
                <Minus className="w-4 h-4 mr-1" />
              )}
              <span>{Math.abs(trend)}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Componente para filtros
  const FiltersPanel = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="flex-1 min-w-48">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Fecha Inicio
            </label>
            <input
              type="date"
              value={filters.fechaInicio}
              onChange={(e) => setFilters({...filters, fechaInicio: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
          <div className="flex-1 min-w-48">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Fecha Fin
            </label>
            <input
              type="date"
              value={filters.fechaFin}
              onChange={(e) => setFilters({...filters, fechaFin: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
          <div className="flex-1 min-w-32">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Período
            </label>
            <select
              value={filters.periodo}
              onChange={(e) => setFilters({...filters, periodo: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="dia">Día</option>
              <option value="mes">Mes</option>
              <option value="año">Año</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              switch (activeTab) {
                case 'ventas': loadVentas(); break;
                case 'productos': loadProductos(); break;
                case 'inventario': loadInventario(); break;
                case 'clientes': loadClientes(); break;
                case 'pedidos': loadPedidos(); break;
                case 'categorias': loadCategorias(); break;
                default: loadDashboard();
              }
            }}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 flex items-center gap-2 font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
        </div>
      </div>
    </div>
  );

  // Tooltip personalizado para mostrar formato CLP
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg backdrop-blur-sm">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-2" 
                style={{ backgroundColor: entry.color }}
              ></div>
              {entry.name}: {
                entry.name.toLowerCase().includes('ingreso') || 
                entry.name.toLowerCase().includes('total') ||
                entry.name.toLowerCase().includes('gasto') ||
                entry.name.toLowerCase().includes('valor') ?
                formatCLP(entry.value) : 
                entry.value.toLocaleString('es-CL')
              }
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Dashboard General
  const DashboardView = () => (
    <div className="space-y-8">
      {dashboardData?.metricas && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <MetricCard
            title="Ventas del Mes"
            value={dashboardData.metricas.ventas_mes}
            icon={DollarSign}
            color="green"
          />
          <MetricCard
            title="Ingresos del Mes"
            value={dashboardData.metricas.ingresos_mes}
            icon={TrendingUp}
            color="blue"
            isMonetary={true}
          />
          <MetricCard
            title="Clientes Activos"
            value={dashboardData.metricas.clientes_activos}
            icon={Users}
            color="purple"
          />
          <MetricCard
            title="Stock Bajo"
            value={dashboardData.metricas.productos_stock_bajo}
            icon={AlertTriangle}
            color="orange"
          />
          <MetricCard
            title="Pedidos Pendientes"
            value={dashboardData.metricas.pedidos_pendientes}
            icon={Clock}
            color="red"
          />
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Gráfico de ventas diarias */}
        <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                Ventas Últimos 7 Días
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Evolución de ventas diarias
              </p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={dashboardData?.ventasDiarias || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="fecha" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(value) => formatCLPCompact(value)} />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="total_ventas" 
                stroke="#3B82F6" 
                strokeWidth={3}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, stroke: '#3B82F6', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top productos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              Top 5 Productos del Mes
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Más vendidos este mes
            </p>
          </div>
          <div className="space-y-4">
            {dashboardData?.topProductos?.map((producto, index) => (
              <div key={index} className="group p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all duration-200 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-blue-600 font-semibold text-sm">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                          {producto.nombre_producto}
                        </p>
                        <p className="text-sm text-gray-500">
                          {producto.cantidad_vendida} unidades
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">
                      {formatCLP(producto.ingresos)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Vista de Ventas
  const VentasView = () => (
    <div className="space-y-6">
      <FiltersPanel />
      
      {ventasData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              title="Total Ventas"
              value={ventasData.resumen.totalVentas}
              icon={ShoppingCart}
              color="blue"
            />
            <MetricCard
              title="Ingresos Totales"
              value={ventasData.resumen.ingresosTotales}
              icon={DollarSign}
              color="green"
              isMonetary={true}
            />
            <MetricCard
              title="Ticket Promedio"
              value={ventasData.resumen.ticketPromedio}
              icon={TrendingUp}
              color="purple"
              isMonetary={true}
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Gráfico de ventas por período */}
            <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Ventas por Período
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Evolución de ventas por período seleccionado
                </p>
              </div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={ventasData.ventasPorPeriodo}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="periodo" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(value) => formatCLPCompact(value)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="total_ventas" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Métodos de pago */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Ventas por Método de Pago
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Distribución de métodos de pago
                </p>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={ventasData.metodosPago}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="cantidad_ventas"
                    nameKey="metodo_pago"
                  >
                    {ventasData.metodosPago?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );

  // Vista de Productos
  const ProductosView = () => (
    <div className="space-y-6">
      <FiltersPanel />
      
      {productosData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <MetricCard
              title="Total Vendidos"
              value={productosData.resumen.totalProductosVendidos}
              icon={Package}
              color="blue"
            />
            <MetricCard
              title="Ingresos Totales"
              value={productosData.resumen.ingresosTotales}
              icon={DollarSign}
              color="green"
              isMonetary={true}
            />
            <MetricCard
              title="Categoría Top"
              value={productosData.resumen.categoriaTop}
              icon={TrendingUp}
              color="purple"
            />
            <MetricCard
              title="Marca Top"
              value={productosData.resumen.marcaTop}
              icon={Eye}
              color="orange"
            />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                Productos Más Vendidos
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categoría
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Marca
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vendidos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ingresos
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {productosData.productosTop?.map((producto, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {producto.nombre_producto}
                        </div>
                        <div className="text-sm text-gray-500">
                          {producto.descripcion}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {producto.nombre_categoria}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {producto.nombre_marca}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {producto.cantidad_vendida.toLocaleString('es-CL')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600 text-right">
                        {formatCLP(producto.ingresos_producto)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );

  // Vista de Inventario
  const InventarioView = () => (
    <div className="space-y-6">
      <FiltersPanel />
      
      {inventarioData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <MetricCard
              title="Total Productos"
              value={inventarioData.estadisticas.totalProductos}
              icon={Package}
              color="blue"
            />
            <MetricCard
              title="Sin Stock"
              value={inventarioData.estadisticas.sinStock}
              icon={XCircle}
              color="red"
            />
            <MetricCard
              title="Stock Bajo"
              value={inventarioData.estadisticas.stockBajo}
              icon={AlertTriangle}
              color="orange"
            />
            <MetricCard
              title="Valor Inventario"
              value={inventarioData.estadisticas.valorInventario}
              icon={DollarSign}
              color="green"
              isMonetary={true}
            />
          </div>

          {/* Alertas */}
          {(inventarioData.alertas.sinStock.length > 0 || inventarioData.alertas.stockBajo.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {inventarioData.alertas.sinStock.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                  <div className="flex items-center mb-4">
                    <XCircle className="w-5 h-5 text-red-600 mr-2" />
                    <h4 className="text-lg font-semibold text-red-800">Productos Sin Stock</h4>
                  </div>
                  <div className="space-y-2">
                    {inventarioData.alertas.sinStock.slice(0, 5).map((item, index) => (
                      <p key={index} className="text-sm text-red-700">
                        <strong>{item.nombre_producto}</strong> - {item.nombre_marca}
                      </p>
                    ))}
                    {inventarioData.alertas.sinStock.length > 5 && (
                      <p className="text-sm font-medium text-red-700">
                        +{inventarioData.alertas.sinStock.length - 5} productos más
                      </p>
                    )}
                  </div>
                </div>
              )}

              {inventarioData.alertas.stockBajo.length > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
                  <div className="flex items-center mb-4">
                    <AlertTriangle className="w-5 h-5 text-orange-600 mr-2" />
                    <h4 className="text-lg font-semibold text-orange-800">Stock Bajo</h4>
                  </div>
                  <div className="space-y-2">
                    {inventarioData.alertas.stockBajo.slice(0, 5).map((item, index) => (
                      <p key={index} className="text-sm text-orange-700">
                        <strong>{item.nombre_producto}</strong> - Stock: {item.stock}
                      </p>
                    ))}
                    {inventarioData.alertas.stockBajo.length > 5 && (
                      <p className="text-sm font-medium text-orange-700">
                        +{inventarioData.alertas.stockBajo.length - 5} productos más
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );

  // Vista de Clientes
  const ClientesView = () => (
    <div className="space-y-6">
      <FiltersPanel />
      
      {clientesData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <MetricCard
              title="Total Clientes"
              value={clientesData.estadisticas.totalClientes}
              icon={Users}
              color="blue"
            />
            <MetricCard
              title="Cliente Top"
              value={clientesData.estadisticas.clienteTop?.nombre_usuario || 'N/A'}
              icon={TrendingUp}
              color="green"
            />
            <MetricCard
              title="Región Top"
              value={clientesData.estadisticas.regionTop?.nombre_region || 'N/A'}
              icon={Eye}
              color="purple"
            />
            <MetricCard
              title="Gasto Promedio"
              value={clientesData.estadisticas.promedioGastoCliente}
              icon={DollarSign}
              color="orange"
              isMonetary={true}
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Top clientes */}
            <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Clientes Más Activos
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Clientes con mayor volumen de compras
                </p>
              </div>
              <div className="space-y-4">
                {clientesData.clientesTop?.map((cliente, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div>
                      <p className="font-medium text-gray-900">
                        {cliente.nombre_usuario} {cliente.apellido_usuario}
                      </p>
                      <p className="text-sm text-gray-500">{cliente.correo}</p>
                      <p className="text-sm text-blue-600">{cliente.nombre_region}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        {formatCLP(cliente.total_gastado)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {cliente.total_pedidos} pedidos
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Distribución geográfica */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Distribución por Región
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Clientes por región
                </p>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={clientesData.distribucionGeografica}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="nombre_region" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="total_clientes" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );

  // Vista de Pedidos
  const PedidosView = () => (
    <div className="space-y-6">
      <FiltersPanel />
      
      {pedidosData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <MetricCard
              title="Total Pedidos"
              value={pedidosData.estadisticas.totalPedidos}
              icon={ShoppingCart}
              color="blue"
            />
            <MetricCard
              title="Completados"
              value={pedidosData.estadisticas.pedidosCompletados}
              icon={CheckCircle}
              color="green"
            />
            <MetricCard
              title="Pendientes"
              value={pedidosData.estadisticas.pedidosPendientes}
              icon={Clock}
              color="orange"
            />
            <MetricCard
              title="Eficiencia"
              value={`${pedidosData.estadisticas.eficienciaEntrega}%`}
              icon={TrendingUp}
              color="purple"
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Estados de pedidos */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Estados de Pedidos
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Distribución por estado
                </p>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pedidosData.estadosPedidos}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="cantidad_pedidos"
                    nameKey="nombre_estado"
                  >
                    {pedidosData.estadosPedidos?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Pedidos por día */}
            <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Pedidos por Día
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Evolución diaria de pedidos
                </p>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={pedidosData.pedidosPorPeriodo}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="fecha" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip />
                  <Line type="monotone" dataKey="total_pedidos" stroke="#3B82F6" strokeWidth={2} />
                  <Line type="monotone" dataKey="pedidos_completados" stroke="#10B981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );

  // Vista de Categorías
  const CategoriasView = () => (
    <div className="space-y-6">
      <FiltersPanel />
      
      {categoriasData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <MetricCard
              title="Total Categorías"
              value={categoriasData.estadisticas.totalCategorias}
              icon={FileText}
              color="blue"
            />
            <MetricCard
              title="Categoría Top"
              value={categoriasData.estadisticas.categoriaTop?.nombre_categoria || 'N/A'}
              icon={TrendingUp}
              color="green"
            />
            <MetricCard
              title="Ingresos Totales"
              value={categoriasData.estadisticas.ingresosTotales}
              icon={DollarSign}
              color="purple"
              isMonetary={true}
            />
            <MetricCard
              title="Más Productos"
              value={categoriasData.estadisticas.categoriaMasProductos?.nombre_categoria || 'N/A'}
              icon={Package}
              color="orange"
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Rendimiento por categoría */}
            <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Rendimiento por Categoría
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Ingresos por categoría de productos
                </p>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoriasData.rendimientoCategorias}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="nombre_categoria" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(value) => formatCLPCompact(value)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="ingresos_categoria" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Tabla de categorías */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">
                  Detalle de Categorías
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Categoría
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Productos
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ingresos
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {categoriasData.rendimientoCategorias?.map((categoria, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-medium text-gray-900">{categoria.nombre_categoria}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {categoria.productos_categoria.toLocaleString('es-CL')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600 text-right">
                          {formatCLP(categoria.ingresos_categoria)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: TrendingUp },
    { id: 'ventas', name: 'Ventas', icon: DollarSign },
    { id: 'productos', name: 'Productos', icon: Package },
    { id: 'inventario', name: 'Inventario', icon: AlertTriangle },
    { id: 'clientes', name: 'Clientes', icon: Users },
    { id: 'pedidos', name: 'Pedidos', icon: ShoppingCart },
    { id: 'categorias', name: 'Categorías', icon: FileText }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header mejorado */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Panel de Reportes
              </h1>
              <p className="text-lg text-gray-600">
                Análisis completo de ventas, inventario y rendimiento del negocio
              </p>
            </div>
            <div className="flex items-center gap-3 mt-6 lg:mt-0">
              <button className="px-4 py-2 text-gray-600 bg-white rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Configurar
              </button>
              <button className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Enviar Reporte
              </button>
            </div>
          </div>
        </div>

        {/* Tabs mejorados */}
        <div className="mb-8">
          <nav className="flex space-x-1 overflow-x-auto bg-white p-1 rounded-xl shadow-sm border border-gray-100">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-6 py-3 text-sm font-medium rounded-lg whitespace-nowrap transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">{tab.name}</span>
                  <span className="sm:hidden">{tab.name.charAt(0)}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Error mejorado */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 rounded-lg p-6">
            <div className="flex items-center">
              <XCircle className="w-6 h-6 text-red-600 mr-3" />
              <div>
                <h4 className="text-lg font-semibold text-red-800">Error de Conexión</h4>
                <p className="mt-1 text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading mejorado */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
            <p className="mt-4 text-lg font-medium text-gray-600">Cargando datos...</p>
            <p className="text-sm text-gray-500">Esto puede tomar unos segundos</p>
          </div>
        )}

        {/* Content */}
        {!loading && (
          <div className="transition-all duration-300">
            {activeTab === 'dashboard' && <DashboardView />}
            {activeTab === 'ventas' && <VentasView />}
            {activeTab === 'productos' && <ProductosView />}
            {activeTab === 'inventario' && <InventarioView />}
            {activeTab === 'clientes' && <ClientesView />}
            {activeTab === 'pedidos' && <PedidosView />}
            {activeTab === 'categorias' && <CategoriasView />}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReportes;