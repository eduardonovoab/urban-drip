"use client"

import { useState, useEffect } from "react"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import {
  TrendingUp,
  Package,
  Users,
  ShoppingCart,
  AlertTriangle,
  Calendar,
  RefreshCw,
  DollarSign,
  Eye,
  ArrowUp,
  ArrowDown,
  Minus,
  CheckCircle,
  Clock,
  XCircle,
  Settings,
  Mail,
  FileText,
  Download,
  Filter,
} from "lucide-react"

import "../styles/dashboard.css"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"

const AdminReportes = () => {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [filters, setFilters] = useState({
    fechaInicio: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    fechaFin: new Date().toISOString().split("T")[0],
    periodo: "mes",
    limite: 10,
  })

  // Estados para cada tipo de reporte
  const [dashboardData, setDashboardData] = useState(null)
  const [ventasData, setVentasData] = useState(null)
  const [productosData, setProductosData] = useState(null)
  const [inventarioData, setInventarioData] = useState(null)
  const [clientesData, setClientesData] = useState(null)
  const [pedidosData, setPedidosData] = useState(null)
  const [categoriasData, setCategoriasData] = useState(null)

  // Función para formatear dinero chileno
  const formatCLP = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) return "$0"
    const num = typeof amount === "string" ? Number.parseFloat(amount) : amount
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.round(num))
  }

  const formatCLPCompact = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) return "$0"
    const num = typeof amount === "string" ? Number.parseFloat(amount) : amount
    if (num >= 1000000000) {
      return `$${(num / 1000000000).toFixed(1)}MM`
    } else if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(1)}M`
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(0)}K`
    }
    return formatCLP(num)
  }

  const COLORS = ["#667eea", "#764ba2", "#f093fb", "#f5576c", "#43e97b", "#38f9d7", "#fa709a", "#fee140"]

  const API_BASE = "http://localhost:3000/api/reportes"

  const testConnection = async () => {
    try {
      const response = await fetch(`${API_BASE}/health`)
      const data = await response.json()
      console.log("✅ Conexión exitosa:", data)
      return true
    } catch (error) {
      console.error("❌ Error de conexión:", error)
      return false
    }
  }

  const fetchData = async (endpoint, params = {}) => {
    try {
      setLoading(true)
      setError("")
      const queryParams = new URLSearchParams({ ...filters, ...params })
      const response = await fetch(`${API_BASE}${endpoint}?${queryParams}`)
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      const data = await response.json()
      return data
    } catch (err) {
      setError(err.message)
      console.error("Error fetching data:", err)
      return null
    } finally {
      setLoading(false)
    }
  }

  const loadDashboard = async () => {
    const data = await fetchData("/dashboard")
    if (data) setDashboardData(data)
  }

  const loadVentas = async () => {
    const data = await fetchData("/ventas")
    if (data) setVentasData(data)
  }

  const loadProductos = async () => {
    const data = await fetchData("/productos-vendidos")
    if (data) setProductosData(data)
  }

  const loadInventario = async () => {
    const data = await fetchData("/inventario")
    if (data) setInventarioData(data)
  }

  const loadClientes = async () => {
    const data = await fetchData("/clientes")
    if (data) setClientesData(data)
  }

  const loadPedidos = async () => {
    const data = await fetchData("/pedidos")
    if (data) setPedidosData(data)
  }

  const loadCategorias = async () => {
    const data = await fetchData("/categorias")
    if (data) setCategoriasData(data)
  }

  // Función para exportar a PDF
  const exportToPDF = async () => {
    try {
      setLoading(true)

      // Crear un elemento temporal con el contenido a exportar
      const exportElement = document.createElement("div")
      exportElement.style.position = "absolute"
      exportElement.style.left = "-9999px"
      exportElement.style.top = "0"
      exportElement.style.width = "1200px"
      exportElement.style.backgroundColor = "white"
      exportElement.style.padding = "40px"
      exportElement.style.fontFamily = "Inter, sans-serif"

      // Crear el contenido del PDF
      const currentDate = new Date().toLocaleDateString("es-CL", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })

      let htmlContent = `
        <div style="margin-bottom: 40px; text-align: center; border-bottom: 3px solid #667eea; padding-bottom: 20px;">
          <h1 style="color: #1a202c; font-size: 32px; margin-bottom: 10px; font-weight: 800;">
            Reporte de ${tabs.find((tab) => tab.id === activeTab)?.name || "Dashboard"}
          </h1>
          <p style="color: #718096; font-size: 16px; margin: 0;">
            Generado el ${currentDate} | Período: ${filters.fechaInicio} - ${filters.fechaFin}
          </p>
        </div>
      `

      // Añadir métricas según la pestaña activa
      if (activeTab === "dashboard" && dashboardData?.metricas) {
        htmlContent += `
          <div style="margin-bottom: 40px;">
            <h2 style="color: #1a202c; font-size: 24px; margin-bottom: 20px; font-weight: 700;">Métricas Principales</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
              <div style="background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); padding: 20px; border-radius: 12px; border-left: 4px solid #667eea;">
                <h3 style="color: #4a5568; font-size: 12px; text-transform: uppercase; margin-bottom: 8px;">Ventas del Mes</h3>
                <p style="color: #1a202c; font-size: 24px; font-weight: 800; margin: 0;">${dashboardData.metricas.ventas_mes?.toLocaleString("es-CL") || 0}</p>
              </div>
              <div style="background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); padding: 20px; border-radius: 12px; border-left: 4px solid #38a169;">
                <h3 style="color: #4a5568; font-size: 12px; text-transform: uppercase; margin-bottom: 8px;">Ingresos del Mes</h3>
                <p style="color: #1a202c; font-size: 24px; font-weight: 800; margin: 0;">${formatCLP(dashboardData.metricas.ingresos_mes)}</p>
              </div>
              <div style="background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); padding: 20px; border-radius: 12px; border-left: 4px solid #805ad5;">
                <h3 style="color: #4a5568; font-size: 12px; text-transform: uppercase; margin-bottom: 8px;">Clientes Activos</h3>
                <p style="color: #1a202c; font-size: 24px; font-weight: 800; margin: 0;">${dashboardData.metricas.clientes_activos?.toLocaleString("es-CL") || 0}</p>
              </div>
              <div style="background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); padding: 20px; border-radius: 12px; border-left: 4px solid #ed8936;">
                <h3 style="color: #4a5568; font-size: 12px; text-transform: uppercase; margin-bottom: 8px;">Stock Bajo</h3>
                <p style="color: #1a202c; font-size: 24px; font-weight: 800; margin: 0;">${dashboardData.metricas.productos_stock_bajo?.toLocaleString("es-CL") || 0}</p>
              </div>
            </div>
          </div>
        `

        // Añadir top productos
        if (dashboardData.topProductos && dashboardData.topProductos.length > 0) {
          htmlContent += `
            <div style="margin-bottom: 40px;">
              <h2 style="color: #1a202c; font-size: 24px; margin-bottom: 20px; font-weight: 700;">Top 5 Productos</h2>
              <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <thead>
                  <tr style="background: #f7fafc;">
                    <th style="padding: 15px; text-align: left; font-weight: 700; color: #4a5568; border-bottom: 1px solid #e2e8f0;">#</th>
                    <th style="padding: 15px; text-align: left; font-weight: 700; color: #4a5568; border-bottom: 1px solid #e2e8f0;">Producto</th>
                    <th style="padding: 15px; text-align: right; font-weight: 700; color: #4a5568; border-bottom: 1px solid #e2e8f0;">Vendidos</th>
                    <th style="padding: 15px; text-align: right; font-weight: 700; color: #4a5568; border-bottom: 1px solid #e2e8f0;">Ingresos</th>
                  </tr>
                </thead>
                <tbody>
                  ${dashboardData.topProductos
                    .map(
                      (producto, index) => `
                    <tr style="border-bottom: 1px solid #e2e8f0;">
                      <td style="padding: 15px; font-weight: 600; color: #667eea;">${index + 1}</td>
                      <td style="padding: 15px; font-weight: 600; color: #1a202c;">${producto.nombre_producto}</td>
                      <td style="padding: 15px; text-align: right; color: #4a5568;">${producto.cantidad_vendida?.toLocaleString("es-CL") || 0}</td>
                      <td style="padding: 15px; text-align: right; font-weight: 700; color: #38a169;">${formatCLP(producto.ingresos)}</td>
                    </tr>
                  `,
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
          `
        }
      }

      // Añadir contenido específico para otras pestañas
      if (activeTab === "ventas" && ventasData) {
        htmlContent += `
          <div style="margin-bottom: 40px;">
            <h2 style="color: #1a202c; font-size: 24px; margin-bottom: 20px; font-weight: 700;">Resumen de Ventas</h2>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
              <div style="background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); padding: 20px; border-radius: 12px; border-left: 4px solid #667eea;">
                <h3 style="color: #4a5568; font-size: 12px; text-transform: uppercase; margin-bottom: 8px;">Total Ventas</h3>
                <p style="color: #1a202c; font-size: 24px; font-weight: 800; margin: 0;">${ventasData.resumen?.totalVentas?.toLocaleString("es-CL") || 0}</p>
              </div>
              <div style="background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); padding: 20px; border-radius: 12px; border-left: 4px solid #38a169;">
                <h3 style="color: #4a5568; font-size: 12px; text-transform: uppercase; margin-bottom: 8px;">Ingresos Totales</h3>
                <p style="color: #1a202c; font-size: 24px; font-weight: 800; margin: 0;">${formatCLP(ventasData.resumen?.ingresosTotales)}</p>
              </div>
              <div style="background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); padding: 20px; border-radius: 12px; border-left: 4px solid #805ad5;">
                <h3 style="color: #4a5568; font-size: 12px; text-transform: uppercase; margin-bottom: 8px;">Ticket Promedio</h3>
                <p style="color: #1a202c; font-size: 24px; font-weight: 800; margin: 0;">${formatCLP(ventasData.resumen?.ticketPromedio)}</p>
              </div>
            </div>
          </div>
        `
      }

      if (activeTab === "productos" && productosData) {
        htmlContent += `
          <div style="margin-bottom: 40px;">
            <h2 style="color: #1a202c; font-size: 24px; margin-bottom: 20px; font-weight: 700;">Resumen de Productos</h2>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px;">
              <div style="background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); padding: 20px; border-radius: 12px; border-left: 4px solid #667eea;">
                <h3 style="color: #4a5568; font-size: 12px; text-transform: uppercase; margin-bottom: 8px;">Total Vendidos</h3>
                <p style="color: #1a202c; font-size: 24px; font-weight: 800; margin: 0;">${productosData.resumen?.totalProductosVendidos?.toLocaleString("es-CL") || 0}</p>
              </div>
              <div style="background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); padding: 20px; border-radius: 12px; border-left: 4px solid #38a169;">
                <h3 style="color: #4a5568; font-size: 12px; text-transform: uppercase; margin-bottom: 8px;">Ingresos Totales</h3>
                <p style="color: #1a202c; font-size: 24px; font-weight: 800; margin: 0;">${formatCLP(productosData.resumen?.ingresosTotales)}</p>
              </div>
              <div style="background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); padding: 20px; border-radius: 12px; border-left: 4px solid #805ad5;">
                <h3 style="color: #4a5568; font-size: 12px; text-transform: uppercase; margin-bottom: 8px;">Categoría Top</h3>
                <p style="color: #1a202c; font-size: 18px; font-weight: 800; margin: 0;">${productosData.resumen?.categoriaTop || "N/A"}</p>
              </div>
              <div style="background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); padding: 20px; border-radius: 12px; border-left: 4px solid #ed8936;">
                <h3 style="color: #4a5568; font-size: 12px; text-transform: uppercase; margin-bottom: 8px;">Marca Top</h3>
                <p style="color: #1a202c; font-size: 18px; font-weight: 800; margin: 0;">${productosData.resumen?.marcaTop || "N/A"}</p>
              </div>
            </div>
          </div>
        `

        if (productosData.productosTop && productosData.productosTop.length > 0) {
          htmlContent += `
            <div style="margin-bottom: 40px;">
              <h2 style="color: #1a202c; font-size: 24px; margin-bottom: 20px; font-weight: 700;">Productos Más Vendidos</h2>
              <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <thead>
                  <tr style="background: #f7fafc;">
                    <th style="padding: 15px; text-align: left; font-weight: 700; color: #4a5568; border-bottom: 1px solid #e2e8f0;">Producto</th>
                    <th style="padding: 15px; text-align: left; font-weight: 700; color: #4a5568; border-bottom: 1px solid #e2e8f0;">Categoría</th>
                    <th style="padding: 15px; text-align: left; font-weight: 700; color: #4a5568; border-bottom: 1px solid #e2e8f0;">Marca</th>
                    <th style="padding: 15px; text-align: right; font-weight: 700; color: #4a5568; border-bottom: 1px solid #e2e8f0;">Vendidos</th>
                    <th style="padding: 15px; text-align: right; font-weight: 700; color: #4a5568; border-bottom: 1px solid #e2e8f0;">Ingresos</th>
                  </tr>
                </thead>
                <tbody>
                  ${productosData.productosTop
                    .slice(0, 10)
                    .map(
                      (producto) => `
                    <tr style="border-bottom: 1px solid #e2e8f0;">
                      <td style="padding: 15px; font-weight: 600; color: #1a202c;">${producto.nombre_producto}</td>
                      <td style="padding: 15px; color: #4a5568;">${producto.nombre_categoria}</td>
                      <td style="padding: 15px; color: #4a5568;">${producto.nombre_marca}</td>
                      <td style="padding: 15px; text-align: right; font-weight: 600; color: #1a202c;">${producto.cantidad_vendida?.toLocaleString("es-CL") || 0}</td>
                      <td style="padding: 15px; text-align: right; font-weight: 700; color: #38a169;">${formatCLP(producto.ingresos_producto)}</td>
                    </tr>
                  `,
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
          `
        }
      }

      // Añadir contenido para Inventario
      if (activeTab === "inventario" && inventarioData) {
        htmlContent += `
          <div style="margin-bottom: 40px;">
            <h2 style="color: #1a202c; font-size: 24px; margin-bottom: 20px; font-weight: 700;">Estadísticas de Inventario</h2>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px;">
              <div style="background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); padding: 20px; border-radius: 12px; border-left: 4px solid #667eea;">
                <h3 style="color: #4a5568; font-size: 12px; text-transform: uppercase; margin-bottom: 8px;">Total Productos</h3>
                <p style="color: #1a202c; font-size: 24px; font-weight: 800; margin: 0;">${inventarioData.estadisticas?.totalProductos?.toLocaleString("es-CL") || 0}</p>
              </div>
              <div style="background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); padding: 20px; border-radius: 12px; border-left: 4px solid #ef4444;">
                <h3 style="color: #4a5568; font-size: 12px; text-transform: uppercase; margin-bottom: 8px;">Sin Stock</h3>
                <p style="color: #1a202c; font-size: 24px; font-weight: 800; margin: 0;">${inventarioData.estadisticas?.sinStock?.toLocaleString("es-CL") || 0}</p>
              </div>
              <div style="background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); padding: 20px; border-radius: 12px; border-left: 4px solid #f59e0b;">
                <h3 style="color: #4a5568; font-size: 12px; text-transform: uppercase; margin-bottom: 8px;">Stock Bajo</h3>
                <p style="color: #1a202c; font-size: 24px; font-weight: 800; margin: 0;">${inventarioData.estadisticas?.stockBajo?.toLocaleString("es-CL") || 0}</p>
              </div>
              <div style="background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); padding: 20px; border-radius: 12px; border-left: 4px solid #38a169;">
                <h3 style="color: #4a5568; font-size: 12px; text-transform: uppercase; margin-bottom: 8px;">Valor Inventario</h3>
                <p style="color: #1a202c; font-size: 24px; font-weight: 800; margin: 0;">${formatCLP(inventarioData.estadisticas?.valorInventario)}</p>
              </div>
            </div>
          </div>
        `

        // Productos sin stock
        if (inventarioData.alertas?.sinStock && inventarioData.alertas.sinStock.length > 0) {
          htmlContent += `
            <div style="margin-bottom: 40px;">
              <h2 style="color: #1a202c; font-size: 24px; margin-bottom: 20px; font-weight: 700;">Productos Sin Stock</h2>
              <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <thead>
                  <tr style="background: #f7fafc;">
                    <th style="padding: 15px; text-align: left; font-weight: 700; color: #4a5568; border-bottom: 1px solid #e2e8f0;">Producto</th>
                    <th style="padding: 15px; text-align: left; font-weight: 700; color: #4a5568; border-bottom: 1px solid #e2e8f0;">Marca</th>
                    <th style="padding: 15px; text-align: center; font-weight: 700; color: #4a5568; border-bottom: 1px solid #e2e8f0;">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  ${inventarioData.alertas.sinStock
                    .slice(0, 10)
                    .map(
                      (item) => `
                    <tr style="border-bottom: 1px solid #e2e8f0;">
                      <td style="padding: 15px; font-weight: 600; color: #1a202c;">${item.nombre_producto}</td>
                      <td style="padding: 15px; color: #4a5568;">${item.nombre_marca}</td>
                      <td style="padding: 15px; text-align: center;">
                        <span style="background: #fee2e2; color: #dc2626; padding: 4px 12px; border-radius: 9999px; font-weight: 600; font-size: 12px;">Sin Stock</span>
                      </td>
                    </tr>
                  `,
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
          `
        }

        // Productos con stock bajo
        if (inventarioData.alertas?.stockBajo && inventarioData.alertas.stockBajo.length > 0) {
          htmlContent += `
            <div style="margin-bottom: 40px;">
              <h2 style="color: #1a202c; font-size: 24px; margin-bottom: 20px; font-weight: 700;">Productos con Stock Bajo</h2>
              <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <thead>
                  <tr style="background: #f7fafc;">
                    <th style="padding: 15px; text-align: left; font-weight: 700; color: #4a5568; border-bottom: 1px solid #e2e8f0;">Producto</th>
                    <th style="padding: 15px; text-align: left; font-weight: 700; color: #4a5568; border-bottom: 1px solid #e2e8f0;">Marca</th>
                    <th style="padding: 15px; text-align: center; font-weight: 700; color: #4a5568; border-bottom: 1px solid #e2e8f0;">Stock Actual</th>
                  </tr>
                </thead>
                <tbody>
                  ${inventarioData.alertas.stockBajo
                    .slice(0, 10)
                    .map(
                      (item) => `
                    <tr style="border-bottom: 1px solid #e2e8f0;">
                      <td style="padding: 15px; font-weight: 600; color: #1a202c;">${item.nombre_producto}</td>
                      <td style="padding: 15px; color: #4a5568;">${item.nombre_marca}</td>
                      <td style="padding: 15px; text-align: center;">
                        <span style="background: #fef3c7; color: #d97706; padding: 4px 12px; border-radius: 9999px; font-weight: 600;">${item.stock}</span>
                      </td>
                    </tr>
                  `,
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
          `
        }
      }

      // Añadir contenido para Clientes
      if (activeTab === "clientes" && clientesData) {
        htmlContent += `
          <div style="margin-bottom: 40px;">
            <h2 style="color: #1a202c; font-size: 24px; margin-bottom: 20px; font-weight: 700;">Estadísticas de Clientes</h2>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px;">
              <div style="background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); padding: 20px; border-radius: 12px; border-left: 4px solid #667eea;">
                <h3 style="color: #4a5568; font-size: 12px; text-transform: uppercase; margin-bottom: 8px;">Total Clientes</h3>
                <p style="color: #1a202c; font-size: 24px; font-weight: 800; margin: 0;">${clientesData.estadisticas?.totalClientes?.toLocaleString("es-CL") || 0}</p>
              </div>
              <div style="background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); padding: 20px; border-radius: 12px; border-left: 4px solid #38a169;">
                <h3 style="color: #4a5568; font-size: 12px; text-transform: uppercase; margin-bottom: 8px;">Cliente Top</h3>
                <p style="color: #1a202c; font-size: 18px; font-weight: 800; margin: 0;">${clientesData.estadisticas?.clienteTop?.nombre_usuario || "N/A"}</p>
              </div>
              <div style="background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); padding: 20px; border-radius: 12px; border-left: 4px solid #805ad5;">
                <h3 style="color: #4a5568; font-size: 12px; text-transform: uppercase; margin-bottom: 8px;">Región Top</h3>
                <p style="color: #1a202c; font-size: 18px; font-weight: 800; margin: 0;">${clientesData.estadisticas?.regionTop?.nombre_region || "N/A"}</p>
              </div>
              <div style="background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); padding: 20px; border-radius: 12px; border-left: 4px solid #ed8936;">
                <h3 style="color: #4a5568; font-size: 12px; text-transform: uppercase; margin-bottom: 8px;">Gasto Promedio</h3>
                <p style="color: #1a202c; font-size: 24px; font-weight: 800; margin: 0;">${formatCLP(clientesData.estadisticas?.promedioGastoCliente)}</p>
              </div>
            </div>
          </div>
        `

        if (clientesData.clientesTop && clientesData.clientesTop.length > 0) {
          htmlContent += `
            <div style="margin-bottom: 40px;">
              <h2 style="color: #1a202c; font-size: 24px; margin-bottom: 20px; font-weight: 700;">Top 10 Clientes</h2>
              <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <thead>
                  <tr style="background: #f7fafc;">
                    <th style="padding: 15px; text-align: left; font-weight: 700; color: #4a5568; border-bottom: 1px solid #e2e8f0;">#</th>
                    <th style="padding: 15px; text-align: left; font-weight: 700; color: #4a5568; border-bottom: 1px solid #e2e8f0;">Cliente</th>
                    <th style="padding: 15px; text-align: left; font-weight: 700; color: #4a5568; border-bottom: 1px solid #e2e8f0;">Email</th>
                    <th style="padding: 15px; text-align: left; font-weight: 700; color: #4a5568; border-bottom: 1px solid #e2e8f0;">Región</th>
                    <th style="padding: 15px; text-align: right; font-weight: 700; color: #4a5568; border-bottom: 1px solid #e2e8f0;">Pedidos</th>
                    <th style="padding: 15px; text-align: right; font-weight: 700; color: #4a5568; border-bottom: 1px solid #e2e8f0;">Total Gastado</th>
                  </tr>
                </thead>
                <tbody>
                  ${clientesData.clientesTop
                    .slice(0, 10)
                    .map(
                      (cliente, index) => `
                    <tr style="border-bottom: 1px solid #e2e8f0;">
                      <td style="padding: 15px; font-weight: 600; color: #667eea;">${index + 1}</td>
                      <td style="padding: 15px; font-weight: 600; color: #1a202c;">${cliente.nombre_usuario} ${cliente.apellido_usuario}</td>
                      <td style="padding: 15px; color: #4a5568; font-size: 14px;">${cliente.correo}</td>
                      <td style="padding: 15px;">
                        <span style="background: #e0e7ff; color: #4338ca; padding: 4px 12px; border-radius: 9999px; font-weight: 600; font-size: 12px;">${cliente.nombre_region}</span>
                      </td>
                      <td style="padding: 15px; text-align: right; font-weight: 600;">${cliente.total_pedidos?.toLocaleString("es-CL") || 0}</td>
                      <td style="padding: 15px; text-align: right; font-weight: 700; color: #38a169;">${formatCLP(cliente.total_gastado)}</td>
                    </tr>
                  `,
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
          `
        }

        if (clientesData.distribucionGeografica && clientesData.distribucionGeografica.length > 0) {
          htmlContent += `
            <div style="margin-bottom: 40px;">
              <h2 style="color: #1a202c; font-size: 24px; margin-bottom: 20px; font-weight: 700;">Distribución por Región</h2>
              <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <thead>
                  <tr style="background: #f7fafc;">
                    <th style="padding: 15px; text-align: left; font-weight: 700; color: #4a5568; border-bottom: 1px solid #e2e8f0;">Región</th>
                    <th style="padding: 15px; text-align: right; font-weight: 700; color: #4a5568; border-bottom: 1px solid #e2e8f0;">Total Clientes</th>
                    <th style="padding: 15px; text-align: right; font-weight: 700; color: #4a5568; border-bottom: 1px solid #e2e8f0;">% del Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${clientesData.distribucionGeografica
                    .map(
                      (region) => `
                    <tr style="border-bottom: 1px solid #e2e8f0;">
                      <td style="padding: 15px; font-weight: 600; color: #1a202c;">${region.nombre_region}</td>
                      <td style="padding: 15px; text-align: right; font-weight: 600;">${region.total_clientes?.toLocaleString("es-CL") || 0}</td>
                      <td style="padding: 15px; text-align: right; color: #4a5568;">
                        ${((region.total_clientes / clientesData.estadisticas.totalClientes) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  `,
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
          `
        }
      }

      // Añadir contenido para Pedidos
      if (activeTab === "pedidos" && pedidosData) {
        htmlContent += `
          <div style="margin-bottom: 40px;">
            <h2 style="color: #1a202c; font-size: 24px; margin-bottom: 20px; font-weight: 700;">Estadísticas de Pedidos</h2>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px;">
              <div style="background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); padding: 20px; border-radius: 12px; border-left: 4px solid #667eea;">
                <h3 style="color: #4a5568; font-size: 12px; text-transform: uppercase; margin-bottom: 8px;">Total Pedidos</h3>
                <p style="color: #1a202c; font-size: 24px; font-weight: 800; margin: 0;">${pedidosData.estadisticas?.totalPedidos?.toLocaleString("es-CL") || 0}</p>
              </div>
              <div style="background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); padding: 20px; border-radius: 12px; border-left: 4px solid #38a169;">
                <h3 style="color: #4a5568; font-size: 12px; text-transform: uppercase; margin-bottom: 8px;">Completados</h3>
                <p style="color: #1a202c; font-size: 24px; font-weight: 800; margin: 0;">${pedidosData.estadisticas?.pedidosCompletados?.toLocaleString("es-CL") || 0}</p>
              </div>
              <div style="background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); padding: 20px; border-radius: 12px; border-left: 4px solid #f59e0b;">
                <h3 style="color: #4a5568; font-size: 12px; text-transform: uppercase; margin-bottom: 8px;">Pendientes</h3>
                <p style="color: #1a202c; font-size: 24px; font-weight: 800; margin: 0;">${pedidosData.estadisticas?.pedidosPendientes?.toLocaleString("es-CL") || 0}</p>
              </div>
              <div style="background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); padding: 20px; border-radius: 12px; border-left: 4px solid #805ad5;">
                <h3 style="color: #4a5568; font-size: 12px; text-transform: uppercase; margin-bottom: 8px;">Eficiencia</h3>
                <p style="color: #1a202c; font-size: 24px; font-weight: 800; margin: 0;">${pedidosData.estadisticas?.eficienciaEntrega || 0}%</p>
              </div>
            </div>
          </div>
        `

        if (pedidosData.estadosPedidos && pedidosData.estadosPedidos.length > 0) {
          htmlContent += `
            <div style="margin-bottom: 40px;">
              <h2 style="color: #1a202c; font-size: 24px; margin-bottom: 20px; font-weight: 700;">Estados de Pedidos</h2>
              <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <thead>
                  <tr style="background: #f7fafc;">
                    <th style="padding: 15px; text-align: left; font-weight: 700; color: #4a5568; border-bottom: 1px solid #e2e8f0;">Estado</th>
                    <th style="padding: 15px; text-align: right; font-weight: 700; color: #4a5568; border-bottom: 1px solid #e2e8f0;">Cantidad</th>
                    <th style="padding: 15px; text-align: right; font-weight: 700; color: #4a5568; border-bottom: 1px solid #e2e8f0;">% del Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${pedidosData.estadosPedidos
                    .map(
                      (estado) => `
                    <tr style="border-bottom: 1px solid #e2e8f0;">
                      <td style="padding: 15px;">
                        <span style="
                          background: ${
                            estado.nombre_estado === 'Completado' ? '#d1fae5' :
                            estado.nombre_estado === 'Pendiente' ? '#fef3c7' :
                            estado.nombre_estado === 'En Proceso' ? '#dbeafe' :
                            estado.nombre_estado === 'Cancelado' ? '#fee2e2' : '#f3f4f6'
                          };
                          color: ${
                            estado.nombre_estado === 'Completado' ? '#065f46' :
                            estado.nombre_estado === 'Pendiente' ? '#92400e' :
                            estado.nombre_estado === 'En Proceso' ? '#1e40af' :
                            estado.nombre_estado === 'Cancelado' ? '#991b1b' : '#374151'
                          };
                          padding: 4px 12px;
                          border-radius: 9999px;
                          font-weight: 600;
                          font-size: 14px;
                        ">${estado.nombre_estado}</span>
                      </td>
                      <td style="padding: 15px; text-align: right; font-weight: 600;">${estado.cantidad_pedidos?.toLocaleString("es-CL") || 0}</td>
                      <td style="padding: 15px; text-align: right; color: #4a5568;">
                        ${((estado.cantidad_pedidos / pedidosData.estadisticas.totalPedidos) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  `,
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
          `
        }
      }

      // Añadir contenido para Categorías
      if (activeTab === "categorias" && categoriasData) {
        htmlContent += `
          <div style="margin-bottom: 40px;">
            <h2 style="color: #1a202c; font-size: 24px; margin-bottom: 20px; font-weight: 700;">Estadísticas de Categorías</h2>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px;">
              <div style="background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); padding: 20px; border-radius: 12px; border-left: 4px solid #667eea;">
                <h3 style="color: #4a5568; font-size: 12px; text-transform: uppercase; margin-bottom: 8px;">Total Categorías</h3>
                <p style="color: #1a202c; font-size: 24px; font-weight: 800; margin: 0;">${categoriasData.estadisticas?.totalCategorias?.toLocaleString("es-CL") || 0}</p>
              </div>
              <div style="background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); padding: 20px; border-radius: 12px; border-left: 4px solid #38a169;">
                <h3 style="color: #4a5568; font-size: 12px; text-transform: uppercase; margin-bottom: 8px;">Categoría Top</h3>
                <p style="color: #1a202c; font-size: 18px; font-weight: 800; margin: 0;">${categoriasData.estadisticas?.categoriaTop?.nombre_categoria || "N/A"}</p>
              </div>
              <div style="background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); padding: 20px; border-radius: 12px; border-left: 4px solid #805ad5;">
                <h3 style="color: #4a5568; font-size: 12px; text-transform: uppercase; margin-bottom: 8px;">Ingresos Totales</h3>
                <p style="color: #1a202c; font-size: 24px; font-weight: 800; margin: 0;">${formatCLP(categoriasData.estadisticas?.ingresosTotales)}</p>
              </div>
              <div style="background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); padding: 20px; border-radius: 12px; border-left: 4px solid #ed8936;">
                <h3 style="color: #4a5568; font-size: 12px; text-transform: uppercase; margin-bottom: 8px;">Más Productos</h3>
                <p style="color: #1a202c; font-size: 18px; font-weight: 800; margin: 0;">${categoriasData.estadisticas?.categoriaMasProductos?.nombre_categoria || "N/A"}</p>
              </div>
            </div>
          </div>
        `

        if (categoriasData.rendimientoCategorias && categoriasData.rendimientoCategorias.length > 0) {
          htmlContent += `
            <div style="margin-bottom: 40px;">
              <h2 style="color: #1a202c; font-size: 24px; margin-bottom: 20px; font-weight: 700;">Rendimiento por Categoría</h2>
              <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <thead>
                  <tr style="background: #f7fafc;">
                    <th style="padding: 15px; text-align: left; font-weight: 700; color: #4a5568; border-bottom: 1px solid #e2e8f0;">Categoría</th>
                    <th style="padding: 15px; text-align: right; font-weight: 700; color: #4a5568; border-bottom: 1px solid #e2e8f0;">Productos</th>
                    <th style="padding: 15px; text-align: right; font-weight: 700; color: #4a5568; border-bottom: 1px solid #e2e8f0;">Vendidos</th>
                    <th style="padding: 15px; text-align: right; font-weight: 700; color: #4a5568; border-bottom: 1px solid #e2e8f0;">Ingresos</th>
                    <th style="padding: 15px; text-align: right; font-weight: 700; color: #4a5568; border-bottom: 1px solid #e2e8f0;">% del Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${categoriasData.rendimientoCategorias
                    .map(
                      (categoria) => `
                    <tr style="border-bottom: 1px solid #e2e8f0;">
                      <td style="padding: 15px; font-weight: 600; color: #1a202c;">${categoria.nombre_categoria}</td>
                      <td style="padding: 15px; text-align: right;">${categoria.productos_categoria?.toLocaleString("es-CL") || 0}</td>
                      <td style="padding: 15px; text-align: right; font-weight: 600;">${categoria.cantidad_vendida?.toLocaleString("es-CL") || 0}</td>
                      <td style="padding: 15px; text-align: right; font-weight: 700; color: #38a169;">${formatCLP(categoria.ingresos_categoria)}</td>
                      <td style="padding: 15px; text-align: right; color: #4a5568;">
                        ${((categoria.ingresos_categoria / categoriasData.estadisticas.ingresosTotales) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  `,
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
          `
        }
      }

      // Añadir footer
      htmlContent += `
        <div style="margin-top: 60px; padding-top: 20px; border-top: 2px solid #e2e8f0; text-align: center; color: #718096;">
          <p style="margin: 0; font-size: 14px;">
            Reporte generado automáticamente por el Sistema de Reportes | ${new Date().toLocaleString("es-CL")}
          </p>
        </div>
      `

      exportElement.innerHTML = htmlContent
      document.body.appendChild(exportElement)

      // Capturar el elemento como imagen
      const canvas = await html2canvas(exportElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        width: 1200,
        height: exportElement.scrollHeight,
      })

      // Remover el elemento temporal
      document.body.removeChild(exportElement)

      // Crear el PDF
      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF("p", "mm", "a4")

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = pdfWidth - 20 // Margen de 10mm a cada lado
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      let heightLeft = imgHeight
      let position = 10 // Margen superior

      // Añadir la primera página
      pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight)
      heightLeft -= pdfHeight - 20 // Restar márgenes

      // Añadir páginas adicionales si es necesario
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 10
        pdf.addPage()
        pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight)
        heightLeft -= pdfHeight - 20
      }

      // Generar nombre del archivo
      const fileName = `reporte-${activeTab}-${new Date().toISOString().split("T")[0]}.pdf`

      // Descargar el PDF
      pdf.save(fileName)

      console.log("✅ PDF generado exitosamente:", fileName)
    } catch (error) {
      console.error("❌ Error al generar PDF:", error)
      setError("Error al generar el PDF. Por favor, inténtalo de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    testConnection().then((connected) => {
      if (!connected) {
        setError("No se puede conectar con el servidor. Verifica que esté corriendo en puerto 3000.")
        return
      }

      const loadData = () => {
        switch (activeTab) {
          case "dashboard":
            loadDashboard()
            break
          case "ventas":
            loadVentas()
            break
          case "productos":
            loadProductos()
            break
          case "inventario":
            loadInventario()
            break
          case "clientes":
            loadClientes()
            break
          case "pedidos":
            loadPedidos()
            break
          case "categorias":
            loadCategorias()
            break
          default:
            loadDashboard()
        }
      }

      loadData()
    })
  }, [activeTab])

  // Componente para métricas del dashboard
  const MetricCard = ({ title, value, icon: Icon, trend, color = "blue", isMonetary = false }) => (
    <div className="metric-card fade-in-up">
      <div className={`metric-icon ${color}`}>
        <Icon size={24} />
      </div>
      <div className="metric-title">{title}</div>
      <div className="metric-value">
        {isMonetary && typeof value === "number"
          ? formatCLP(value)
          : typeof value === "number"
            ? value.toLocaleString("es-CL")
            : value}
      </div>
      {trend !== undefined && (
        <div className={`metric-trend ${trend > 0 ? "positive" : trend < 0 ? "negative" : "neutral"}`}>
          {trend > 0 ? <ArrowUp size={16} /> : trend < 0 ? <ArrowDown size={16} /> : <Minus size={16} />}
          <span>{Math.abs(trend)}% vs mes anterior</span>
        </div>
      )}
    </div>
  )

  // Componente para filtros
  const FiltersPanel = () => (
    <div className="filters-panel slide-in-right">
      <div className="filters-title">
        <Filter size={20} />
        Filtros de Reporte
      </div>
      <div className="filters-grid">
        <div className="form-group">
          <label className="form-label">
            <Calendar size={16} />
            Fecha Inicio
          </label>
          <input
            type="date"
            value={filters.fechaInicio}
            onChange={(e) => setFilters({ ...filters, fechaInicio: e.target.value })}
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label className="form-label">
            <Calendar size={16} />
            Fecha Fin
          </label>
          <input
            type="date"
            value={filters.fechaFin}
            onChange={(e) => setFilters({ ...filters, fechaFin: e.target.value })}
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Período</label>
          <select
            value={filters.periodo}
            onChange={(e) => setFilters({ ...filters, periodo: e.target.value })}
            className="form-select"
          >
            <option value="dia">Día</option>
            <option value="mes">Mes</option>
            <option value="año">Año</option>
          </select>
        </div>
        <div className="form-group">
          <button
            onClick={() => {
              switch (activeTab) {
                case "ventas":
                  loadVentas()
                  break
                case "productos":
                  loadProductos()
                  break
                case "inventario":
                  loadInventario()
                  break
                case "clientes":
                  loadClientes()
                  break
                case "pedidos":
                  loadPedidos()
                  break
                case "categorias":
                  loadCategorias()
                  break
                default:
                  loadDashboard()
              }
            }}
            className="btn btn-primary"
          >
            <RefreshCw size={16} />
            Actualizar
          </button>
        </div>
      </div>
    </div>
  )

  // Tooltip personalizado
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass" style={{ padding: "1rem", borderRadius: "12px", boxShadow: "var(--shadow-medium)" }}>
          <p style={{ fontWeight: "600", marginBottom: "0.5rem", color: "#1a202c" }}>{label}</p>
          {payload.map((entry, index) => (
            <div key={index} style={{ display: "flex", alignItems: "center", marginBottom: "0.25rem" }}>
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  backgroundColor: entry.color,
                  borderRadius: "50%",
                  marginRight: "0.5rem",
                }}
              ></div>
              <span style={{ fontSize: "0.875rem", color: "#4a5568" }}>
                {entry.name}:{" "}
                <strong>
                  {entry.name.toLowerCase().includes("ingreso") ||
                  entry.name.toLowerCase().includes("total") ||
                  entry.name.toLowerCase().includes("gasto") ||
                  entry.name.toLowerCase().includes("valor")
                    ? formatCLP(entry.value)
                    : entry.value.toLocaleString("es-CL")}
                </strong>
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  // Dashboard General
  const DashboardView = () => (
    <div>
      {dashboardData?.metricas && (
        <div className="metrics-grid">
          <MetricCard
            title="Ventas del Mes"
            value={dashboardData.metricas.ventas_mes}
            icon={ShoppingCart}
            color="blue"
          />
          <MetricCard
            title="Ingresos del Mes"
            value={dashboardData.metricas.ingresos_mes}
            icon={DollarSign}
            color="green"
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

      <div className="content-grid">
        {/* Gráfico de ventas diarias */}
        <div className="content-card" style={{ gridColumn: "1 / -1" }}>
          <div className="card-header">
            <div className="card-title">Ventas Últimos 7 Días</div>
            <div className="card-subtitle">Evolución de ventas diarias</div>
          </div>
          <div className="card-content">
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={dashboardData?.ventasDiarias || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="fecha" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} tickFormatter={(value) => formatCLPCompact(value)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="total_ventas"
                    stroke="#667eea"
                    strokeWidth={3}
                    dot={{ fill: "#667eea", strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8, stroke: "#667eea", strokeWidth: 2, fill: "#fff" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Top productos */}
        <div className="content-card">
          <div className="card-header">
            <div className="card-title">Top 5 Productos</div>
            <div className="card-subtitle">Más vendidos este mes</div>
          </div>
          <div className="card-content">
            <div className="item-list">
              {dashboardData?.topProductos?.map((producto, index) => (
                <div key={index} className="item-card">
                  <div className="item-header">
                    <div className="item-rank">#{index + 1}</div>
                    <div className="item-info">
                      <div className="item-name">{producto.nombre_producto}</div>
                      <div className="item-details">{producto.cantidad_vendida} unidades vendidas</div>
                    </div>
                    <div className="item-value">
                      <div className="item-amount">{formatCLP(producto.ingresos)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // Vista de Ventas
  const VentasView = () => (
    <div>
      <FiltersPanel />
      {ventasData && (
        <>
          <div className="metrics-grid">
            <MetricCard title="Total Ventas" value={ventasData.resumen.totalVentas} icon={ShoppingCart} color="blue" />
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

          <div className="content-grid">
            <div className="content-card" style={{ gridColumn: "span 2" }}>
              <div className="card-header">
                <div className="card-title">Ventas por Período</div>
                <div className="card-subtitle">Evolución de ventas por período seleccionado</div>
              </div>
              <div className="card-content">
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={ventasData.ventasPorPeriodo}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="periodo" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} tickFormatter={(value) => formatCLPCompact(value)} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="total_ventas" fill="#667eea" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="content-card">
              <div className="card-header">
                <div className="card-title">Métodos de Pago</div>
                <div className="card-subtitle">Distribución de ventas</div>
              </div>
              <div className="card-content">
                <div className="chart-container">
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
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )

  // Vista de Productos
  const ProductosView = () => (
    <div>
      <FiltersPanel />
      {productosData && (
        <>
          <div className="metrics-grid">
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
            <MetricCard title="Marca Top" value={productosData.resumen.marcaTop} icon={Eye} color="orange" />
          </div>

          <div className="table-container">
            <div className="table-header">
              <div className="card-title">Productos Más Vendidos</div>
              <div className="card-subtitle">Ranking de productos por ventas</div>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th>Marca</th>
                  <th style={{ textAlign: "right" }}>Vendidos</th>
                  <th style={{ textAlign: "right" }}>Ingresos</th>
                </tr>
              </thead>
              <tbody>
                {productosData.productosTop?.map((producto, index) => (
                  <tr key={index}>
                    <td>
                      <div>
                        <div style={{ fontWeight: "600", marginBottom: "0.25rem" }}>{producto.nombre_producto}</div>
                        <div style={{ fontSize: "0.875rem", color: "#718096" }}>{producto.descripcion}</div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-primary">{producto.nombre_categoria}</span>
                    </td>
                    <td style={{ fontWeight: "600" }}>{producto.nombre_marca}</td>
                    <td style={{ textAlign: "right", fontWeight: "600" }}>
                      {producto.cantidad_vendida.toLocaleString("es-CL")}
                    </td>
                    <td style={{ textAlign: "right", fontWeight: "700", color: "#38a169" }}>
                      {formatCLP(producto.ingresos_producto)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )

  // Vista de Inventario
  const InventarioView = () => (
    <div>
      <FiltersPanel />
      {inventarioData && (
        <>
          <div className="metrics-grid">
            <MetricCard
              title="Total Productos"
              value={inventarioData.estadisticas.totalProductos}
              icon={Package}
              color="blue"
            />
            <MetricCard title="Sin Stock" value={inventarioData.estadisticas.sinStock} icon={XCircle} color="red" />
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

          {(inventarioData.alertas.sinStock.length > 0 || inventarioData.alertas.stockBajo.length > 0) && (
            <div className="content-grid">
              {inventarioData.alertas.sinStock.length > 0 && (
                <div className="alert alert-danger">
                  <div className="alert-header">
                    <div className="alert-icon" style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444" }}>
                      <XCircle size={24} />
                    </div>
                    <div>
                      <div className="alert-title">Productos Sin Stock</div>
                      <div className="alert-subtitle">Requieren reposición inmediata</div>
                    </div>
                  </div>
                  <div className="alert-content">
                    {inventarioData.alertas.sinStock.slice(0, 5).map((item, index) => (
                      <div key={index} className="alert-item">
                        <div style={{ fontWeight: "600" }}>{item.nombre_producto}</div>
                        <div style={{ fontSize: "0.875rem", color: "#718096" }}>{item.nombre_marca}</div>
                      </div>
                    ))}
                    {inventarioData.alertas.sinStock.length > 5 && (
                      <div style={{ textAlign: "center", paddingTop: "1rem" }}>
                        <span className="badge badge-danger">
                          +{inventarioData.alertas.sinStock.length - 5} productos más
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {inventarioData.alertas.stockBajo.length > 0 && (
                <div className="alert alert-warning">
                  <div className="alert-header">
                    <div className="alert-icon" style={{ background: "rgba(245, 158, 11, 0.1)", color: "#f59e0b" }}>
                      <AlertTriangle size={24} />
                    </div>
                    <div>
                      <div className="alert-title">Stock Bajo</div>
                      <div className="alert-subtitle">Productos con inventario limitado</div>
                    </div>
                  </div>
                  <div className="alert-content">
                    {inventarioData.alertas.stockBajo.slice(0, 5).map((item, index) => (
                      <div key={index} className="alert-item">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <div style={{ fontWeight: "600" }}>{item.nombre_producto}</div>
                            <div style={{ fontSize: "0.875rem", color: "#718096" }}>{item.nombre_marca}</div>
                          </div>
                          <span className="badge badge-warning">{item.stock}</span>
                        </div>
                      </div>
                    ))}
                    {inventarioData.alertas.stockBajo.length > 5 && (
                      <div style={{ textAlign: "center", paddingTop: "1rem" }}>
                        <span className="badge badge-warning">
                          +{inventarioData.alertas.stockBajo.length - 5} productos más
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )

  // Vista de Clientes
  const ClientesView = () => (
    <div>
      <FiltersPanel />
      {clientesData && (
        <>
          <div className="metrics-grid">
            <MetricCard
              title="Total Clientes"
              value={clientesData.estadisticas.totalClientes}
              icon={Users}
              color="blue"
            />
            <MetricCard
              title="Cliente Top"
              value={clientesData.estadisticas.clienteTop?.nombre_usuario || "N/A"}
              icon={TrendingUp}
              color="green"
            />
            <MetricCard
              title="Región Top"
              value={clientesData.estadisticas.regionTop?.nombre_region || "N/A"}
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

          <div className="content-grid">
            <div className="content-card" style={{ gridColumn: "span 2" }}>
              <div className="card-header">
                <div className="card-title">Clientes Más Activos</div>
                <div className="card-subtitle">Clientes con mayor volumen de compras</div>
              </div>
              <div className="card-content">
                <div className="item-list">
                  {clientesData.clientesTop?.map((cliente, index) => (
                    <div key={index} className="item-card">
                      <div className="item-header">
                        <div className="item-rank">#{index + 1}</div>
                        <div className="item-info">
                          <div className="item-name">
                            {cliente.nombre_usuario} {cliente.apellido_usuario}
                          </div>
                          <div className="item-details">{cliente.correo}</div>
                          <span className="badge badge-primary" style={{ marginTop: "0.25rem" }}>
                            {cliente.nombre_region}
                          </span>
                        </div>
                        <div className="item-value">
                          <div className="item-amount">{formatCLP(cliente.total_gastado)}</div>
                          <div className="item-meta">{cliente.total_pedidos} pedidos</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="content-card">
              <div className="card-header">
                <div className="card-title">Por Región</div>
                <div className="card-subtitle">Distribución de clientes</div>
              </div>
              <div className="card-content">
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={clientesData.distribucionGeografica}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="nombre_region" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="total_clientes" fill="#667eea" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )

  // Vista de Pedidos
  const PedidosView = () => (
    <div>
      <FiltersPanel />
      {pedidosData && (
        <>
          <div className="metrics-grid">
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

          <div className="content-grid">
            <div className="content-card">
              <div className="card-header">
                <div className="card-title">Estados de Pedidos</div>
                <div className="card-subtitle">Distribución por estado</div>
              </div>
              <div className="card-content">
                <div className="chart-container">
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
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="content-card" style={{ gridColumn: "span 2" }}>
              <div className="card-header">
                <div className="card-title">Pedidos por Día</div>
                <div className="card-subtitle">Evolución diaria de pedidos</div>
              </div>
              <div className="card-content">
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={pedidosData.pedidosPorPeriodo}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="fecha" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="total_pedidos" stroke="#667eea" strokeWidth={3} />
                      <Line type="monotone" dataKey="pedidos_completados" stroke="#43e97b" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )

  // Vista de Categorías
  const CategoriasView = () => (
    <div>
      <FiltersPanel />
      {categoriasData && (
        <>
          <div className="metrics-grid">
            <MetricCard
              title="Total Categorías"
              value={categoriasData.estadisticas.totalCategorias}
              icon={FileText}
              color="blue"
            />
            <MetricCard
              title="Categoría Top"
              value={categoriasData.estadisticas.categoriaTop?.nombre_categoria || "N/A"}
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
              value={categoriasData.estadisticas.categoriaMasProductos?.nombre_categoria || "N/A"}
              icon={Package}
              color="orange"
            />
          </div>

          <div className="content-grid">
            <div className="content-card" style={{ gridColumn: "span 2" }}>
              <div className="card-header">
                <div className="card-title">Rendimiento por Categoría</div>
                <div className="card-subtitle">Ingresos por categoría de productos</div>
              </div>
              <div className="card-content">
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={categoriasData.rendimientoCategorias}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="nombre_categoria" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} tickFormatter={(value) => formatCLPCompact(value)} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="ingresos_categoria" fill="#667eea" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="content-card">
              <div className="card-header">
                <div className="card-title">Detalle de Categorías</div>
                <div className="card-subtitle">Resumen por categoría</div>
              </div>
              <div className="card-content">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Categoría</th>
                      <th style={{ textAlign: "right" }}>Productos</th>
                      <th style={{ textAlign: "right" }}>Ingresos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoriasData.rendimientoCategorias?.map((categoria, index) => (
                      <tr key={index}>
                        <td style={{ fontWeight: "600" }}>{categoria.nombre_categoria}</td>
                        <td style={{ textAlign: "right", fontWeight: "600" }}>
                          {categoria.productos_categoria.toLocaleString("es-CL")}
                        </td>
                        <td style={{ textAlign: "right", fontWeight: "700", color: "#38a169" }}>
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
  )

  const tabs = [
    { id: "dashboard", name: "Dashboard", icon: TrendingUp },
    { id: "ventas", name: "Ventas", icon: DollarSign },
    { id: "productos", name: "Productos", icon: Package },
    { id: "inventario", name: "Inventario", icon: AlertTriangle },
    { id: "clientes", name: "Clientes", icon: Users },
    { id: "pedidos", name: "Pedidos", icon: ShoppingCart },
    { id: "categorias", name: "Categorías", icon: FileText },
  ]

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        {/* Header */}
        <div className="dashboard-header">
          <h1 className="dashboard-title">Panel de Reportes</h1>
          <p className="dashboard-subtitle">
            Análisis completo de ventas, inventario y rendimiento del negocio con insights en tiempo real
          </p>
          <div className="dashboard-actions">
            <button className="btn btn-primary" onClick={exportToPDF} disabled={loading}>
              <Download size={16} />
              {loading ? "Generando PDF..." : "Exportar PDF"}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs-container">
          <nav className="tabs-nav">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`tab-button ${activeTab === tab.id ? "active" : ""}`}
                >
                  <Icon size={16} />
                  <span>{tab.name}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Error */}
        {error && (
          <div className="alert alert-danger">
            <div className="alert-header">
              <div className="alert-icon" style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444" }}>
                <XCircle size={24} />
              </div>
              <div>
                <div className="alert-title">Error de Conexión</div>
                <div className="alert-subtitle">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <h3 className="loading-title">Cargando datos...</h3>
            <p className="loading-subtitle">Esto puede tomar unos segundos</p>
          </div>
        )}

        {/* Content */}
        {!loading && (
          <div>
            {activeTab === "dashboard" && <DashboardView />}
            {activeTab === "ventas" && <VentasView />}
            {activeTab === "productos" && <ProductosView />}
            {activeTab === "inventario" && <InventarioView />}
            {activeTab === "clientes" && <ClientesView />}
            {activeTab === "pedidos" && <PedidosView />}
            {activeTab === "categorias" && <CategoriasView />}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminReportes