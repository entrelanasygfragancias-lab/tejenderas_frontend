import { useState, useEffect, useRef } from 'react';
import ExcelJS from 'exceljs';
import { useReactToPrint } from 'react-to-print';
import api from '../../api';
import AdminLayout from '../../components/AdminLayout';
import { formatCurrency } from '../../utils/format';

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
            <div className="w-full pb-14 flex flex-col items-center">
                <div className="h-10 md:h-16"></div>
                {/* Filters */}
                <div className="w-[90%] md:w-full max-w-6xl mx-auto flex flex-col items-center gap-8 mb-14 mt-6">
                    <h2 className="text-2xl md:text-3xl font-black text-graphite uppercase tracking-tighter text-center">Listado de Ventas</h2>
                    <div className="flex flex-col md:flex-row justify-center items-center gap-6 w-full">
                        <div className="flex flex-wrap bg-white rounded-xl border-2 border-graphite p-1 gap-1 justify-center">
                            <button
                                onClick={() => setFilter('daily')}
                                className={`flex-1 md:flex-none px-4 py-2 rounded-lg font-bold uppercase text-sm transition-all ${filter === 'daily' ? 'bg-indigo-500 text-white shadow-md border-2 border-graphite' : 'text-gray-500 hover:bg-gray-100'}`}
                            >
                                Hoy
                            </button>
                            <button
                                onClick={() => setFilter('all')}
                                className={`flex-1 md:flex-none px-4 py-2 rounded-lg font-bold uppercase text-sm transition-all ${filter === 'all' ? 'bg-graphite text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
                            >
                                Todas
                            </button>
                            <button
                                onClick={() => setFilter('weekly')}
                                className={`flex-1 md:flex-none px-4 py-2 rounded-lg font-bold uppercase text-sm transition-all ${filter === 'weekly' ? 'bg-lime text-graphite shadow-md border-2 border-graphite' : 'text-gray-500 hover:bg-gray-100'}`}
                            >
                                Semanal
                            </button>
                            <button
                                onClick={() => setFilter('monthly')}
                                className={`flex-1 md:flex-none px-4 py-2 rounded-lg font-bold uppercase text-sm transition-all ${filter === 'monthly' ? 'bg-teal text-white shadow-md border-2 border-graphite' : 'text-gray-500 hover:bg-gray-100'}`}
                            >
                                Mensual
                            </button>
                        </div>
                        <button
                            onClick={exportExcel}
                            className="px-4 py-2 rounded-xl font-black uppercase text-xs bg-yellow-400 text-graphite border-2 border-graphite shadow-[2px_2px_0px_0px_#333] hover:bg-yellow-500 transition-all"
                        >
                            Exportar Excel
                        </button>
                    </div>
                </div>

                <div className="h-6 md:h-8"></div>

                {/* Stats Cards */}
                <div className="w-[85%] md:w-full max-w-6xl mx-auto mb-12">
                    <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-6">
                        <div className="bg-graphite text-white rounded-2xl shadow-lg border-2 border-black relative overflow-hidden group text-center flex flex-col items-center justify-center w-full py-4 md:py-5 px-2 min-h-[90px] md:min-h-[110px]">
                            <h3 className="text-[10px] md:text-[8px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2 md:mb-1 leading-tight">Total Global</h3>
                            <p className="text-xl md:text-lg font-black leading-none">{formatCurrency(stats.total)}</p>
                            <p className="hidden md:block text-[7px] text-gray-400 mt-1 font-bold uppercase">POS + Pedidos</p>
                        </div>

                        <div className="bg-pink-hot text-white rounded-2xl shadow-lg border-4 border-black relative overflow-hidden group text-center flex flex-col items-center justify-center w-full py-4 md:py-5 px-2 min-h-[90px] md:min-h-[110px]">
                            <h3 className="text-[10px] md:text-[8px] font-black uppercase tracking-[0.2em] text-pink-100 mb-2 md:mb-1 leading-tight">Telas / Lanas</h3>
                            <p className="text-xl md:text-lg font-black leading-none">{formatCurrency(stats.telas)}</p>
                        </div>

                        <div className="bg-purple-600 text-white rounded-2xl shadow-lg border-4 border-black relative overflow-hidden group text-center flex flex-col items-center justify-center w-full py-4 md:py-5 px-2 min-h-[90px] md:min-h-[110px]">
                            <h3 className="text-[10px] md:text-[8px] font-black uppercase tracking-[0.2em] text-purple-100 mb-2 md:mb-1 leading-tight">Perfumería</h3>
                            <p className="text-xl md:text-lg font-black leading-none">{formatCurrency(stats.perfumeria)}</p>
                        </div>

                        <div className="bg-violet-500 text-white rounded-2xl shadow-lg border-4 border-black relative overflow-hidden group text-center flex flex-col items-center justify-center w-full py-4 md:py-5 px-2 min-h-[90px] md:min-h-[110px]">
                            <h3 className="text-[10px] md:text-[8px] font-black uppercase tracking-[0.2em] text-violet-100 mb-2 md:mb-1 leading-tight">Catálogo</h3>
                            <p className="text-xl md:text-lg font-black leading-none">{formatCurrency(stats.perfumeria_catalogo || 0)}</p>
                        </div>

                        <div className="bg-indigo-500 text-white rounded-2xl shadow-lg border-4 border-black relative overflow-hidden group text-center flex flex-col items-center justify-center w-full py-4 md:py-5 px-2 min-h-[90px] md:min-h-[110px]">
                            <h3 className="text-[10px] md:text-[8px] font-black uppercase tracking-[0.2em] text-indigo-100 mb-2 md:mb-1 leading-tight">Diseñador</h3>
                            <p className="text-xl md:text-lg font-black leading-none">{formatCurrency(stats.perfumeria_disenador || 0)}</p>
                        </div>

                        <div className="bg-blue-600 text-white rounded-2xl shadow-lg border-4 border-black relative overflow-hidden group text-center flex flex-col items-center justify-center w-full py-4 md:py-5 px-2 min-h-[90px] md:min-h-[110px]">
                            <h3 className="text-[10px] md:text-[8px] font-black uppercase tracking-[0.2em] text-blue-100 mb-2 md:mb-1 leading-tight">Web</h3>
                            <p className="text-xl md:text-lg font-black leading-none">{formatCurrency(stats.orders_total || 0)}</p>
                        </div>

                        <div className="bg-orange-500 text-white rounded-2xl shadow-lg border-4 border-black relative overflow-hidden group text-center flex flex-col items-center justify-center w-full py-4 md:py-5 px-2 min-h-[90px] md:min-h-[110px]">
                            <h3 className="text-[10px] md:text-[8px] font-black uppercase tracking-[0.2em] text-orange-100 mb-2 md:mb-1 leading-tight">Contratos</h3>
                            <p className="text-xl md:text-lg font-black leading-none">{formatCurrency(stats.contracts_total || 0)}</p>
                        </div>
                    </div>
                </div>
                <div className="h-12"></div> {/* Unified spacing for mobile and desktop */}

                {error && (
                    <div className="w-full max-w-2xl mx-auto bg-red-pink/10 border-2 border-red-pink text-red-pink px-6 py-4 rounded-xl mb-8 font-bold text-center">
                        {error}
                    </div>
                )}

                {isLoading ? (
                    <div className="text-center py-20">
                        <div className="animate-spin w-12 h-12 border-4 border-graphite border-t-pink-hot rounded-full mx-auto mb-4"></div>
                    </div>
                ) : (
                    <div className="w-[90%] md:w-full max-w-6xl mx-auto mb-12">
                        {/* Desktop Table View */}
                        <div className="hidden lg:block bg-white rounded-2xl border-4 border-graphite shadow-[10px_10px_0px_0px_#333] overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead className="bg-graphite text-white">
                                        <tr>
                                            <th className="px-6 py-5 text-left text-sm font-black uppercase tracking-widest">Fecha / ID</th>
                                            <th className="px-6 py-5 text-center text-sm font-black uppercase tracking-widest">Vendedor</th>
                                            <th className="px-4 py-5 text-center text-sm font-black uppercase tracking-widest">Método</th>
                                            <th className="px-4 py-5 text-center text-sm font-black uppercase tracking-widest text-pink-200">Telas</th>
                                            <th className="px-4 py-5 text-center text-sm font-black uppercase tracking-widest text-purple-200">Perfumería</th>
                                            <th className="px-8 py-5 text-right text-sm font-black uppercase tracking-widest">Total</th>
                                            <th className="px-6 py-5 text-center text-sm font-black uppercase tracking-widest">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y-2 divide-gray-100">
                                        {sales.map((sale) => (
                                            <tr key={`${sale.type}-${sale.id}`} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-5">
                                                    <div className="font-bold text-graphite text-base">{formatDate(sale.created_at)}</div>
                                                    <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-0.5">
                                                        {sale.type === 'pos' && `POS #${sale.id.toString().padStart(6, '0')}`}
                                                        {sale.type === 'order' && `WEB #${sale.id.toString().padStart(6, '0')}`}
                                                        {sale.type === 'contract_payment' && `ABONO #${sale.id.toString().padStart(6, '0')}`}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 font-bold text-gray-600 text-center text-sm">
                                                    {sale.type === 'order' ? `Cliente: ${sale.user?.name}` : (sale.user?.name || 'Sistema')}
                                                    {sale.type === 'contract_payment' && <div className="text-[10px] text-orange-500 font-bold uppercase mt-1">{sale.details}</div>}
                                                </td>
                                                <td className="px-4 py-5 text-center">
                                                    <span className={`inline-block px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${sale.payment_method === 'web' ? 'bg-blue-100 text-blue-700' :
                                                        sale.type === 'contract_payment' ? 'bg-orange-100 text-orange-700' :
                                                            'bg-gray-100 text-gray-700'
                                                        }`}>
                                                        {translatePaymentMethod(sale.payment_method)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-5 text-center">
                                                    {(sale.type === 'pos' || sale.type === 'order') ? (
                                                        <span className="font-black text-lg text-pink-hot">{formatCurrency(sale.telas_total || 0)}</span>
                                                    ) : (
                                                        <span className="text-gray-300">-</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-5 text-center">
                                                    {(sale.type === 'pos' || sale.type === 'order') ? (
                                                        <div className="flex flex-col">
                                                            <span className="font-black text-lg text-purple-600">{formatCurrency(sale.perfumeria_total || 0)}</span>
                                                            {(Number(sale.perfumeria_catalogo_total || 0) > 0 || Number(sale.perfumeria_disenador_total || 0) > 0) ? (
                                                                <span className="text-[9px] text-gray-400 font-bold uppercase">
                                                                    Cat: {formatCurrency(sale.perfumeria_catalogo_total || 0)} / Dis: {formatCurrency(sale.perfumeria_disenador_total || 0)}
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-300">-</span>
                                                    )}
                                                </td>
                                                <td className="px-8 py-5 text-right whitespace-nowrap">
                                                    <span className="font-black text-xl text-graphite">{formatCurrency(sale.total)}</span>
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    {(sale.type === 'pos' || sale.type === 'order') && (
                                                        <button
                                                            onClick={() => triggerPrint(sale)}
                                                            className="p-3 bg-white border-2 border-graphite rounded-xl hover:bg-gray-50 text-graphite shadow-[3px_3px_0px_0px_#333] transition-all"
                                                            title="Imprimir Factura"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Mobile Card View */}
                        <div className="lg:hidden w-full flex justify-center mt-8">
                            <div className="w-full space-y-6 max-w-md px-2">
                                {sales.map((sale) => (
                                    <div key={`${sale.type}-${sale.id}`} className="bg-white rounded-2xl border-4 border-graphite shadow-[6px_6px_0px_0px_#333] p-5">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                                                    {sale.type === 'pos' && `POS #${sale.id.toString().padStart(6, '0')}`}
                                                    {sale.type === 'order' && `WEB #${sale.id.toString().padStart(6, '0')}`}
                                                    {sale.type === 'contract_payment' && `ABONO #${sale.id.toString().padStart(6, '0')}`}
                                                </div>
                                                <div className="font-black text-graphite text-lg leading-tight">{formatDate(sale.created_at)}</div>
                                            </div>
                                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border-2 border-graphite shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] ${sale.payment_method === 'web' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                                sale.type === 'contract_payment' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                                                    'bg-white text-gray-600'
                                                }`}>
                                                {translatePaymentMethod(sale.payment_method)}
                                            </span>
                                        </div>

                                        <div className="flex flex-col gap-3 mb-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Vendedor / Cliente</span>
                                                    <span className="text-sm font-bold text-gray-700">{sale.type === 'order' ? `Cliente: ${sale.user?.name}` : (sale.user?.name || 'Sistema')}</span>
                                                </div>
                                            </div>
                                            {sale.type === 'contract_payment' && (
                                                <div className="bg-orange-50 p-2 rounded-lg border-2 border-orange-100">
                                                    <span className="text-[10px] font-bold text-orange-600 block mb-1">DETALLES ABONO</span>
                                                    <span className="text-xs font-bold text-orange-700">{sale.details}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 pt-4 border-t-2 border-dashed border-gray-100 mb-4">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Desglose</span>
                                                {(sale.type === 'pos' || sale.type === 'order') ? (
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between items-center text-xs">
                                                            <span className="text-pink-500 font-bold">Telas:</span>
                                                            <span className="font-black">{formatCurrency(sale.telas_total || 0)}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center text-xs">
                                                            <span className="text-purple-500 font-bold">Perfumería:</span>
                                                            <span className="font-black">{formatCurrency(sale.perfumeria_total || 0)}</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-300 italic font-bold">No aplica</span>
                                                )}
                                            </div>
                                            <div className="flex flex-col items-end justify-center">
                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Cobrado</span>
                                                <span className="text-2xl font-black text-graphite">{formatCurrency(sale.total)}</span>
                                            </div>
                                        </div>

                                        {(sale.type === 'pos' || sale.type === 'order') && (
                                            <button
                                                onClick={() => triggerPrint(sale)}
                                                className="w-full py-3 bg-graphite text-white font-black uppercase tracking-widest rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] hover:bg-gray-800 transition-all flex items-center justify-center gap-3"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                                </svg>
                                                Imprimir Factura
                                            </button>
                                        )}
                                    </div>
                                ))}

                                {sales.length === 0 && (
                                    <div className="bg-white rounded-2xl border-4 border-dashed border-gray-200 p-12 text-center w-full">
                                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-gray-100 text-gray-300">
                                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-400">No hay ventas registradas</h3>
                                        <p className="text-sm text-gray-400 mt-1">Intenta con otro filtro de fecha.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                <div className="h-12 md:hidden"></div>

                {/* Integrated Footer Area */}
                <div className="pt-12 md:pt-96 pb-24 md:pb-48 text-center space-y-8 md:space-y-12 w-full">
                    <div className="flex justify-center gap-4 opacity-10">
                        <div className="w-12 h-1.5 bg-pink-hot rounded-full"></div>
                        <div className="w-12 h-1.5 bg-teal rounded-full"></div>
                    </div>
                    <p className="text-gray-400 text-[10px] sm:text-[14px] font-black uppercase tracking-[0.4em] md:tracking-[0.8em] max-w-5xl mx-auto leading-relaxed opacity-40 italic">
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
            </div>
        </AdminLayout >
    );
}
