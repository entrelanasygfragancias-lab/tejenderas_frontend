import { useState, useEffect, useRef } from 'react';
import ExcelJS from 'exceljs';
import { useReactToPrint } from 'react-to-print';
import api from '../../api';
import AdminLayout from '../../components/AdminLayout';
import { formatCurrency } from '../../utils/format';
import './SalesRegistry.css';

interface SaleItem {
    id: number;
    product_name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
    product: {
        category: string;
        name: string;
    }
}

interface Sale {
    id: number;
    type: 'pos' | 'order' | 'contract_payment';
    created_at: string;
    total: number;
    payment_method: string;
    user: {
        name: string;
    };
    telas_total?: number;
    perfumeria_total?: number;
    perfumeria_catalogo_total?: number;
    perfumeria_disenador_total?: number;
    items?: SaleItem[];
    details?: string; // For contract notes
}

export default function SalesRegistry() {
    const [sales, setSales] = useState<Sale[]>([]);
    const [stats, setStats] = useState({
        total: 0,
        telas: 0,
        perfumeria: 0,
        perfumeria_catalogo: 0,
        perfumeria_disenador: 0,
        orders_total: 0,
        contracts_total: 0
    });
    const [filter, setFilter] = useState('daily'); // 'daily', 'all', 'weekly', 'monthly'
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedSaleForPrint, setSelectedSaleForPrint] = useState<Sale | null>(null);
    const [showTotalsModal, setShowTotalsModal] = useState(false);
    const [selectedSales, setSelectedSales] = useState<Set<string>>(new Set());
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: 'Re-impresión Factura',
    });

    const triggerPrint = (sale: Sale) => {
        setSelectedSaleForPrint(sale);
        // Small delay to let the state update and React render the print template before starting print
        setTimeout(() => {
            handlePrint();
        }, 100);
    };

    // Funciones de selección
    const toggleSaleSelection = (saleKey: string) => {
        setSelectedSales(prev => {
            const newSet = new Set(prev);
            if (newSet.has(saleKey)) {
                newSet.delete(saleKey);
            } else {
                newSet.add(saleKey);
            }
            return newSet;
        });
    };

    const selectAllSales = () => {
        const allSaleKeys = sales.map(sale => `${sale.type}-${sale.id}`);
        setSelectedSales(new Set(allSaleKeys));
    };

    const clearSelection = () => {
        setSelectedSales(new Set());
    };

    // Función de eliminación
    const deleteSelectedSales = async () => {
        setIsDeleting(true);
        
        // Guardar el tamaño original para el mensaje
        const deletedCount = selectedSales.size;
        
        // Limpiar selección inmediatamente
        setSelectedSales(new Set());
        setShowDeleteConfirm(false);
        
        try {
            console.log('Iniciando eliminación de ventas:', Array.from(selectedSales));
            
            // Eliminar cada venta seleccionada
            const deletePromises = Array.from(selectedSales).map(async (saleKey) => {
                const [type, id] = saleKey.split('-');
                console.log(`Eliminando ${type} con ID: ${id}`);
                
                try {
                    let response;
                    if (type === 'pos') {
                        response = await api.delete(`/admin/sales/${id}`);
                    } else if (type === 'order') {
                        response = await api.delete(`/admin/orders/${id}`);
                    } else if (type === 'contract_payment') {
                        response = await api.delete(`/admin/contract-payments/${id}`);
                    }
                    
                    console.log(`Respuesta del servidor para ${type} ${id}:`, response);
                    return response;
                } catch (error: any) {
                    console.error(`Error al eliminar ${type} ${id}:`, error.response?.data || error.message);
                    throw error;
                }
            });

            const results = await Promise.all(deletePromises);
            console.log('Todos los resultados de eliminación:', results);

            // Actualizar el listado
            await fetchSales();
            
            // Mostrar éxito
            const successMessage = `Se eliminaron ${deletedCount} venta(s) exitosamente`;
            console.log(successMessage);
            
            // Mostrar mensaje de éxito temporal
            setError(successMessage);
            setTimeout(() => setError(''), 3000);
            
        } catch (error: any) {
            console.error('Error al eliminar ventas:', error);
            const errorMessage = error.response?.data?.message || 'Error al eliminar las ventas seleccionadas';
            setError(errorMessage);
        } finally {
            setIsDeleting(false);
        }
    };

    useEffect(() => {
        fetchSales();
    }, [filter]);

    const fetchSales = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/admin/sales', {
                params: { period: filter }
            });
            // New structure: { stats: {...}, sales: { data: [...] } }
            setSales(response.data.sales.data);
            setStats(response.data.stats);
        } catch (err) {
            setError('Error al cargar el registro de ventas');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('es-MX', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const translatePaymentMethod = (method: string) => {
        switch (method) {
            case 'cash': return 'Efectivo';
            case 'card': return 'Tarjeta';
            case 'transfer': return 'Transferencia';
            default: return method;
        }
    };

    const exportExcel = async () => {
        const headers = [
            'Tipo',
            'ID',
            'Fecha',
            'Vendedor',
            'Metodo',
            'Telas',
            'Perfumeria',
            'Catalogo',
            'Disenador',
            'Total'
        ];

        const periodLabel = {
            daily: 'Diario',
            weekly: 'Semanal',
            monthly: 'Mensual',
            all: 'Todas'
        }[filter] || 'Todas';

        const exportDate = new Date().toLocaleDateString('es-MX', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        const dataRows = sales.map((sale) => ([
            sale.type,
            sale.id,
            formatDate(sale.created_at),
            sale.type === 'order' ? `Cliente: ${sale.user?.name}` : (sale.user?.name || 'Sistema'),
            translatePaymentMethod(sale.payment_method),
            sale.type === 'pos' ? Number(sale.telas_total || 0) : '',
            sale.type === 'pos' ? Number(sale.perfumeria_total || 0) : '',
            sale.type === 'pos' ? Number(sale.perfumeria_catalogo_total || 0) : '',
            sale.type === 'pos' ? Number(sale.perfumeria_disenador_total || 0) : '',
            Number(sale.total || 0)
        ]));

        const totals = sales.reduce(
            (acc, sale) => {
                acc.total += Number(sale.total || 0);
                if (sale.type === 'pos') {
                    acc.telas += Number(sale.telas_total || 0);
                    acc.perfumeria += Number(sale.perfumeria_total || 0);
                    acc.catalogo += Number(sale.perfumeria_catalogo_total || 0);
                    acc.disenador += Number(sale.perfumeria_disenador_total || 0);
                } else if (sale.type === 'order') {
                    acc.orders += Number(sale.total || 0);
                } else if (sale.type === 'contract_payment') {
                    acc.contracts += Number(sale.total || 0);
                }
                return acc;
            },
            { total: 0, telas: 0, perfumeria: 0, catalogo: 0, disenador: 0, orders: 0, contracts: 0 }
        );

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Ventas');

        worksheet.mergeCells('A1:J1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = `Reporte de ventas (${periodLabel}) - ${exportDate}`;
        titleCell.font = { size: 16, bold: true, color: { argb: 'FF1F2937' } };
        titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
        worksheet.addRow([]);

        const headerRow = worksheet.addRow(headers);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
        headerRow.eachCell((cell) => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF111827' } };
            cell.border = {
                top: { style: 'thin', color: { argb: 'FF111827' } },
                left: { style: 'thin', color: { argb: 'FF111827' } },
                bottom: { style: 'thin', color: { argb: 'FF111827' } },
                right: { style: 'thin', color: { argb: 'FF111827' } }
            };
        });

        dataRows.forEach((row) => {
            const addedRow = worksheet.addRow(row);
            addedRow.alignment = { vertical: 'middle', horizontal: 'center' };
        });

        const separatorRow = worksheet.addRow(['---', '---', '---', '---', '---', '---', '---', '---', '---', '---']);
        separatorRow.font = { color: { argb: 'FF9CA3AF' } };
        separatorRow.alignment = { horizontal: 'center' };

        const totalsRows = [
            ['TOTAL GENERAL', totals.total],
            ['TOTAL TELAS', totals.telas],
            ['TOTAL PERFUMERIA', totals.perfumeria],
            ['TOTAL CATALOGO', totals.catalogo],
            ['TOTAL DISENADOR', totals.disenador],
            ['TOTAL PEDIDOS WEB', totals.orders],
            ['TOTAL CONTRATOS', totals.contracts]
        ];

        totalsRows.forEach((row, index) => {
            const totalsRow = worksheet.addRow([row[0], row[1]]);
            totalsRow.font = { bold: true, color: { argb: 'FF111827' } };
            totalsRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFDE68A' } };
            totalsRow.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFDE68A' } };
            totalsRow.getCell(1).alignment = { horizontal: 'left' };
            totalsRow.getCell(2).alignment = { horizontal: 'right' };
            totalsRow.getCell(2).numFmt = '#,##0.00';
            if (index === 0) {
                totalsRow.getCell(1).font = { bold: true, size: 12 };
                totalsRow.getCell(2).font = { bold: true, size: 12 };
            }
        });

        [6, 7, 8, 9, 10].forEach((colIndex) => {
            worksheet.getColumn(colIndex).numFmt = '#,##0.00';
        });

        worksheet.columns = [
            { width: 12 },
            { width: 10 },
            { width: 22 },
            { width: 28 },
            { width: 16 },
            { width: 14 },
            { width: 16 },
            { width: 16 },
            { width: 18 },
            { width: 14 }
        ];

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ventas-${filter}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <AdminLayout
            title="Registro de Ventas"
            subtitle="Seguimiento detallado de todas las transacciones comerciales"
        >
            <div className="sales-registry">
                <div className="spacer-10"></div>
                
                {/* Filters */}
                <div className="filters-container">
                    <div className="flex flex-col md:flex-row justify-center items-center gap-6 w-full">
                        <div className="filter-buttons">
                            <button
                                onClick={() => setFilter('daily')}
                                className={`filter-btn ${filter === 'daily' ? 'active' : ''}`}
                            >
                                Hoy
                            </button>
                            <button
                                onClick={() => setFilter('all')}
                                className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                            >
                                Todas
                            </button>
                            <button
                                onClick={() => setFilter('weekly')}
                                className={`filter-btn ${filter === 'weekly' ? 'active' : ''}`}
                            >
                                Semanal
                            </button>
                            <button
                                onClick={() => setFilter('monthly')}
                                className={`filter-btn ${filter === 'monthly' ? 'active' : ''}`}
                            >
                                Mensual
                            </button>
                        </div>
                        
                        <div className="flex flex-col md:flex-row gap-4">
                            <button
                                onClick={() => setShowTotalsModal(true)}
                                className="stats-btn"
                            >
                                <svg className="stats-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                Ver Estadísticas
                            </button>
                            
                            <button
                                onClick={exportExcel}
                                className="export-btn"
                            >
                                Exportar Excel
                            </button>
                        </div>
                    </div>
                </div>

                <div className="spacer-2"></div>
                
                {/* Subtítulo */}
                <div className="subtitle">
                    <h3>Historial de Facturas y Ventas</h3>
                </div>

                <div className="spacer-4"></div>

                {/* Controles de selección masiva */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 px-4">
                    <div className="flex items-center gap-4">
                        <input
                            type="checkbox"
                            id="selectAll"
                            checked={selectedSales.size === sales.length && sales.length > 0}
                            onChange={(e) => e.target.checked ? selectAllSales() : clearSelection()}
                            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="selectAll" className="text-sm font-medium text-gray-700">
                            Seleccionar todo ({selectedSales.size} de {sales.length})
                        </label>
                    </div>
                    
                    {selectedSales.size > 0 && (
                        <div className="flex items-center gap-3">
                            <button
                                onClick={clearSelection}
                                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Limpiar selección
                            </button>
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Eliminar ({selectedSales.size})
                            </button>
                        </div>
                    )}
                </div>

                <div className="spacer-2"></div>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                {isLoading ? (
                    <div className="loading">
                        <div className="loading-spinner"></div>
                    </div>
                ) : (
                    <div className="w-[90%] md:w-full max-w-6xl mx-auto mb-12">
                        {/* Desktop Table View */}
                        <div className="desktop-table">
                            <div className="table-container">
                                <table className="sales-table">
                                    <thead className="table-header">
                                        <tr>
                                            <th className="px-4 py-5 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedSales.size === sales.length && sales.length > 0}
                                                    onChange={(e) => e.target.checked ? selectAllSales() : clearSelection()}
                                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                />
                                            </th>
                                            <th>Fecha / ID</th>
                                            <th>Vendedor</th>
                                            <th>Método</th>
                                            <th>Telas</th>
                                            <th>Perfumería</th>
                                            <th>Total</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="table-body">
                                        {sales.map((sale) => {
                                            const saleKey = `${sale.type}-${sale.id}`;
                                            const isSelected = selectedSales.has(saleKey);
                                            return (
                                                <tr key={saleKey} className={`table-row ${isSelected ? 'bg-blue-50' : ''}`}>
                                                    <td className="table-cell text-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => toggleSaleSelection(saleKey)}
                                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                        />
                                                    </td>
                                                    <td className="table-cell">
                                                        <div className="sale-date">{formatDate(sale.created_at)}</div>
                                                        <div className="sale-id">
                                                            {sale.type === 'pos' && `POS #${sale.id.toString().padStart(6, '0')}`}
                                                            {sale.type === 'order' && `WEB #${sale.id.toString().padStart(6, '0')}`}
                                                            {sale.type === 'contract_payment' && `ABONO #${sale.id.toString().padStart(6, '0')}`}
                                                        </div>
                                                    </td>
                                                <td className="table-cell">
                                                    {sale.type === 'order' ? `Cliente: ${sale.user?.name}` : (sale.user?.name || 'Sistema')}
                                                    {sale.type === 'contract_payment' && <div className="text-[10px] text-orange-500 font-bold uppercase mt-1">{sale.details}</div>}
                                                </td>
                                                <td className="table-cell">
                                                    <span className={`payment-badge ${sale.payment_method === 'web' ? 'web' :
                                                        sale.type === 'contract_payment' ? 'contract' :
                                                            'default'
                                                        }`}>
                                                        {translatePaymentMethod(sale.payment_method)}
                                                    </span>
                                                </td>
                                                <td className="table-cell">
                                                    {(sale.type === 'pos' || sale.type === 'order') ? (
                                                        <span className="telas-amount">{formatCurrency(sale.telas_total || 0)}</span>
                                                    ) : (
                                                        <span className="text-gray-300">-</span>
                                                    )}
                                                </td>
                                                <td className="table-cell">
                                                    {(sale.type === 'pos' || sale.type === 'order') ? (
                                                        <div className="flex flex-col">
                                                            <span className="perfumeria-amount">{formatCurrency(sale.perfumeria_total || 0)}</span>
                                                            {(Number(sale.perfumeria_catalogo_total || 0) > 0 || Number(sale.perfumeria_disenador_total || 0) > 0) ? (
                                                                <span className="perfumeria-details">
                                                                    Cat: {formatCurrency(sale.perfumeria_catalogo_total || 0)} / Dis: {formatCurrency(sale.perfumeria_disenador_total || 0)}
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-300">-</span>
                                                    )}
                                                </td>
                                                <td className="table-cell">
                                                    <span className="total-amount">{formatCurrency(sale.total)}</span>
                                                </td>
                                                <td className="table-cell">
                                                    {(sale.type === 'pos' || sale.type === 'order') && (
                                                        <button
                                                            onClick={() => triggerPrint(sale)}
                                                            className="print-btn"
                                                            title="Imprimir Factura"
                                                        >
                                                            <svg className="print-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Mobile Card View */}
                        <div className="mobile-cards">
                            <div className="mobile-cards-container">
                                {sales.map((sale) => {
                                    const saleKey = `${sale.type}-${sale.id}`;
                                    const isSelected = selectedSales.has(saleKey);
                                    return (
                                        <div key={saleKey} className={`mobile-card ${isSelected ? 'ring-4 ring-blue-500 bg-blue-50' : ''}`}>
                                            {/* Checkbox de selección */}
                                            <div className="flex justify-between items-start mb-4">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleSaleSelection(saleKey)}
                                                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                />
                                                <div className="mobile-card-header">
                                                    <div>
                                                        <div className="mobile-card-id">
                                                            {sale.type === 'pos' && `POS #${sale.id.toString().padStart(6, '0')}`}
                                                            {sale.type === 'order' && `WEB #${sale.id.toString().padStart(6, '0')}`}
                                                            {sale.type === 'contract_payment' && `ABONO #${sale.id.toString().padStart(6, '0')}`}
                                                        </div>
                                                        <div className="mobile-card-date">{formatDate(sale.created_at)}</div>
                                                    </div>
                                                    <span className={`mobile-payment-badge ${sale.payment_method === 'web' ? 'web' :
                                                        sale.type === 'contract_payment' ? 'contract' :
                                                            'default'
                                                        }`}>
                                                        {translatePaymentMethod(sale.payment_method)}
                                                    </span>
                                                </div>
                                            </div>

                                        <div className="mobile-seller-section">
                                            <div className="mobile-seller-info">
                                                <div className="mobile-seller-icon">
                                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                    </svg>
                                                </div>
                                                <div className="mobile-seller-details">
                                                    <span className="mobile-seller-label">Vendedor / Cliente</span>
                                                    <span className="mobile-seller-name">{sale.type === 'order' ? `Cliente: ${sale.user?.name}` : (sale.user?.name || 'Sistema')}</span>
                                                </div>
                                            </div>
                                            {sale.type === 'contract_payment' && (
                                                <div className="contract-details">
                                                    <span className="contract-details-title">DETALLES ABONO</span>
                                                    <span className="contract-details-text">{sale.details}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="mobile-breakdown">
                                            <div className="flex flex-col">
                                                <span className="mobile-breakdown-title">Desglose</span>
                                                {(sale.type === 'pos' || sale.type === 'order') ? (
                                                    <div className="mobile-breakdown-items">
                                                        <div className="breakdown-item">
                                                            <span className="breakdown-label telas">Telas:</span>
                                                            <span className="breakdown-value">{formatCurrency(sale.telas_total || 0)}</span>
                                                        </div>
                                                        <div className="breakdown-item">
                                                            <span className="breakdown-label perfumeria">Perfumería:</span>
                                                            <span className="breakdown-value">{formatCurrency(sale.perfumeria_total || 0)}</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-300 italic font-bold">No aplica</span>
                                                )}
                                            </div>
                                            <div className="mobile-total-section">
                                                <span className="mobile-total-label">Total Cobrado</span>
                                                <span className="mobile-total-amount">{formatCurrency(sale.total)}</span>
                                            </div>
                                        </div>

                                        {(sale.type === 'pos' || sale.type === 'order') && (
                                            <button
                                                onClick={() => triggerPrint(sale)}
                                                className="mobile-print-btn"
                                            >
                                                <svg className="mobile-print-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                                </svg>
                                                Imprimir Factura
                                            </button>
                                        )}
                                    </div>
                                    );
                                })}

                                {sales.length === 0 && (
                                    <div className="no-sales-container">
                                        <div className="no-sales-icon">
                                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <h3 className="no-sales-title">No hay ventas registradas</h3>
                                        <p className="no-sales-text">Intenta con otro filtro de fecha.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                <div className="spacer-12 md:hidden"></div>

                {/* Integrated Footer Area */}
                <div className="footer-section">
                    <div className="footer-section-content">
                        <div className="footer-bar pink"></div>
                        <div className="footer-bar teal"></div>
                    </div>
                    <p className="footer-text">
                        SISTEMA CENTRAL DE GESTIÓN VISUAL • VERSIÓN 2.5
                    </p>
                </div>

                {/* Hidden Print Area */}
                <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
                    <div ref={printRef} className="p-10 bg-white min-w-[320px] text-graphite font-sans">
                        {selectedSaleForPrint && (
                            <>
                                <div className="mb-6 rounded-xl border-2 border-graphite overflow-hidden">
                                    <div className="bg-pink-hot text-white px-4 py-3 flex items-center gap-3">
                                        <img src="/logo_original.png" alt="Logo" className="h-10 w-10 object-contain bg-white rounded p-0.5" />
                                        <div>
                                            <h2 className="text-2xl font-black leading-none uppercase">Entre Lanas y Fragancias</h2>
                                            <p className="text-xs opacity-90 font-bold mt-1">NIT 20421751 - 2</p>
                                            <p className="text-xs opacity-90">Carrera 11 # 6-08, Barrio el Rosario, Chía</p>
                                            <p className="text-xs opacity-90">Tel: 312 457 8081 - 314 461 6230</p>
                                        </div>
                                        <div className="ml-auto text-right">
                                            <p className="text-xs font-bold">{new Date(selectedSaleForPrint.created_at).toLocaleDateString()}</p>
                                            <p className="text-xs opacity-90">{new Date(selectedSaleForPrint.created_at).toLocaleTimeString()}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-4 text-center border-b-2 border-dashed border-gray-200 pb-2">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                        {selectedSaleForPrint.type === 'pos' ? 'Venta de Mostrador' : 'Pedido Web'}
                                    </p>
                                    <h3 className="text-xl font-black">FACTURA #{selectedSaleForPrint.id.toString().padStart(6, '0')}</h3>
                                </div>

                                <div className="border-b-2 border-dashed border-gray-100 py-3 mb-4 text-sm">
                                    <div className="grid grid-cols-2 gap-2">
                                        <span className="font-bold text-gray-400 uppercase text-[10px]">Cajero/Vendedor</span>
                                        <span className="text-right font-bold">{selectedSaleForPrint.user?.name || 'Sistema'}</span>
                                        <span className="font-bold text-gray-400 uppercase text-[10px]">Método de Pago</span>
                                        <span className="text-right font-bold uppercase">{selectedSaleForPrint.payment_method}</span>
                                    </div>
                                </div>

                                <div className="py-2 text-sm">
                                    <div className="flex justify-between font-black border-b-2 border-graphite pb-1 mb-2">
                                        <span>Descripción</span>
                                        <span>Subtotal</span>
                                    </div>
                                    {(selectedSaleForPrint.items || []).map((item, idx) => (
                                        <div key={idx} className="mb-3">
                                            <div className="flex justify-between font-bold">
                                                <span className="max-w-[180px]">{item.product_name}</span>
                                                <span>{formatCurrency(item.subtotal)}</span>
                                            </div>
                                            <div className="flex justify-between text-[11px] text-gray-500 italic">
                                                <span>Qty: {item.quantity} x {formatCurrency(item.unit_price)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-4 pt-4 border-t-4 border-graphite">
                                    <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg">
                                        <span className="font-black text-lg uppercase">Total Pagado</span>
                                        <span className="text-2xl font-black">{formatCurrency(selectedSaleForPrint.total)}</span>
                                    </div>
                                </div>

                                <div className="mt-12 text-center text-gray-400">
                                    <p className="text-xs font-bold uppercase tracking-widest mb-1">¡Gracias por tu compra!</p>
                                    <p className="text-[10px]">Te invitamos a visitarnos de nuevo en Entre Lanas y Fragancias</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Modal de Valores Totales */}
                {showTotalsModal && (
                    <div className="totals-modal-overlay" onClick={() => setShowTotalsModal(false)}>
                        <div className="totals-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="totals-modal-header">
                                <h3 className="totals-modal-title">Valores Totales Detallados</h3>
                                <button 
                                    className="totals-modal-close"
                                    onClick={() => setShowTotalsModal(false)}
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div className="totals-modal-body">
                                <div className="totals-grid">
                                    <div className="total-card total">
                                        <h4 className="total-title">Total Global</h4>
                                        <p className="total-value">{formatCurrency(stats.total)}</p>
                                        <p className="total-description">Todas las ventas</p>
                                    </div>

                                    <div className="total-card telas">
                                        <h4 className="total-title">Telas / Lanas</h4>
                                        <p className="total-value">{formatCurrency(stats.telas)}</p>
                                        <p className="total-description">Ventas locales POS</p>
                                    </div>

                                    <div className="total-card perfumeria">
                                        <h4 className="total-title">Perfumería</h4>
                                        <p className="total-value">{formatCurrency(stats.perfumeria)}</p>
                                        <p className="total-description">Ventas de fragancias</p>
                                    </div>

                                    <div className="total-card catalogo">
                                        <h4 className="total-title">Catálogo</h4>
                                        <p className="total-value">{formatCurrency(stats.perfumeria_catalogo || 0)}</p>
                                        <p className="total-description">Ventas por catálogo</p>
                                    </div>

                                    <div className="total-card disenador">
                                        <h4 className="total-title">Diseñador</h4>
                                        <p className="total-value">{formatCurrency(stats.perfumeria_disenador || 0)}</p>
                                        <p className="total-description">Ventas diseñador</p>
                                    </div>

                                    <div className="total-card web">
                                        <h4 className="total-title">Pedidos Web</h4>
                                        <p className="total-value">{formatCurrency(stats.orders_total || 0)}</p>
                                        <p className="total-description">Ventas online</p>
                                    </div>

                                    <div className="total-card contratos">
                                        <h4 className="total-title">Contratos</h4>
                                        <p className="total-value">{formatCurrency(stats.contracts_total || 0)}</p>
                                        <p className="total-description">Abonos a contratos</p>
                                    </div>
                                </div>

                                <div className="totals-summary">
                                    <h4 className="totals-summary-title">Resumen General</h4>
                                    <div className="totals-summary-item">
                                        <span className="summary-label">Ventas POS (Telas + Perfumería)</span>
                                        <span className="summary-value">{formatCurrency(stats.telas + stats.perfumeria)}</span>
                                    </div>
                                    <div className="totals-summary-item">
                                        <span className="summary-label">Ventas Online (Web)</span>
                                        <span className="summary-value">{formatCurrency(stats.orders_total || 0)}</span>
                                    </div>
                                    <div className="totals-summary-item">
                                        <span className="summary-label">Contratos y Abonos</span>
                                        <span className="summary-value">{formatCurrency(stats.contracts_total || 0)}</span>
                                    </div>
                                    <div className="totals-summary-item">
                                        <span className="summary-label">TOTAL GENERAL</span>
                                        <span className="summary-value">{formatCurrency(stats.total)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal de Confirmación de Eliminación */}
                {showDeleteConfirm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl border-4 border-graphite shadow-[12px_12px_0px_0px_#333] max-w-md w-full p-6">
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">¿Confirmar Eliminación?</h3>
                                <p className="text-gray-600">
                                    Estás a punto de eliminar <span className="font-bold text-red-600">{selectedSales.size}</span> venta{selectedSales.size !== 1 ? 's' : ''}.
                                    Esta acción no se puede deshacer.
                                </p>
                            </div>
                            
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    disabled={isDeleting}
                                    className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-xl font-bold hover:bg-gray-200 transition-colors disabled:opacity-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={deleteSelectedSales}
                                    disabled={isDeleting}
                                    className="flex-1 px-4 py-3 text-white bg-red-600 rounded-xl font-bold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isDeleting ? (
                                        <>
                                            <svg className="animate-spin w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                            Eliminando...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                            Eliminar
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
