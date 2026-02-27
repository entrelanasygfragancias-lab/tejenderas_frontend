import { useState, useEffect, useRef } from 'react';
import { CheckCircle } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import api from '../../api';
import { AxiosError } from 'axios';
import AdminLayout from '../../components/AdminLayout';
import { formatCurrency } from '../../utils/format';

interface Payment {
    id: number;
    amount: number;
    payment_date: string;
    notes: string | null;
}

interface Contract {
    id: number;
    company_name: string;
    contact_person: string;
    phone: string;
    email: string | null;
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
    delivery_date: string;
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'delivered';
    notes: string | null;
    additional_costs: { description: string; amount: number }[] | null;
    payments?: Payment[];
}

interface ContractForm {
    company_name: string;
    contact_person: string;
    phone: string;
    email: string;
    description: string;
    quantity: number;
    unit_price: number;
    delivery_date: string;
    notes: string;
    additional_costs: { description: string; amount: number }[];
    is_paid: boolean;
}

const statusColors = {
    pending: 'bg-yellow-400 text-graphite border-2 border-graphite',
    in_progress: 'bg-blue-400 text-white border-2 border-graphite',
    completed: 'bg-lime text-graphite border-2 border-graphite',
    cancelled: 'bg-red-pink text-white border-2 border-graphite',
    delivered: 'bg-teal text-white border-2 border-graphite', // Keeps internal status 'delivered' but shows 'Pagado'
};

const statusLabels = {
    pending: 'Pendiente',
    in_progress: 'En Progreso',
    completed: 'Completado',
    cancelled: 'Cancelado',
    delivered: 'Pagado', // Changed from Entregado
};

export default function ContractList() {
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingContract, setEditingContract] = useState<Contract | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const printRef = useRef<HTMLDivElement>(null);
    const [selectedContractForPrint, setSelectedContractForPrint] = useState<Contract | null>(null);
    const [showExtensionModal, setShowExtensionModal] = useState(false);
    const [selectedContractForExtension, setSelectedContractForExtension] = useState<Contract | null>(null);
    const [extensionForm, setExtensionForm] = useState({ new_date: '', reason: '' });
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [selectedHistoryContract, setSelectedHistoryContract] = useState<Contract | null>(null);

    // Payment Method Modal State
    const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
    const [contractToPay, setContractToPay] = useState<Contract | null>(null);
    const [paymentMethodForStatus, setPaymentMethodForStatus] = useState<string>('cash');

    const getTodayDate = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const getRemainingBalance = (contract: Contract | null) => {
        if (!contract) return 0;
        try {
            console.log('Calculating balance for:', contract);
            const total = Number(contract.total) || 0;
            const payments = Array.isArray(contract.payments) ? contract.payments : [];
            const paid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
            return total - paid;
        } catch (err) {
            console.error('Error calculating balance:', err);
            return 0;
        }
    };

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: selectedContractForPrint ? `Contrato_${selectedContractForPrint.company_name} ` : 'Contrato',
    });

    useEffect(() => {
        if (selectedContractForPrint) {
            handlePrint();
        }
    }, [selectedContractForPrint]);

    const [form, setForm] = useState<ContractForm>({
        company_name: '',
        contact_person: '',
        phone: '',
        email: '',
        description: '',
        quantity: 1,
        unit_price: 0,
        delivery_date: '',
        notes: '',
        additional_costs: [],
        is_paid: false,
    });

    const [paymentForm, setPaymentForm] = useState({
        amount: 0,
        payment_date: getTodayDate(),
        notes: '',
    });

    useEffect(() => {
        fetchContracts();
    }, []);

    const fetchContracts = async () => {
        try {
            const response = await api.get('/admin/contracts');
            setContracts(response.data);
        } catch (err) {
            console.error('Error fetching contracts:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setForm({
            company_name: '',
            contact_person: '',
            phone: '',
            email: '',
            description: '',
            quantity: 1,
            unit_price: 0,
            delivery_date: '',
            notes: '',
            additional_costs: [],
            is_paid: false,
        });
        setEditingContract(null);
        setPaymentForm({
            amount: 0,
            payment_date: getTodayDate(),
            notes: '',
        });
    };

    const openModal = (contract?: Contract) => {
        if (contract) {
            setEditingContract(contract);
            setForm({
                company_name: contract.company_name,
                contact_person: contract.contact_person,
                phone: contract.phone,
                email: contract.email || '',
                description: contract.description,
                quantity: contract.quantity,
                unit_price: contract.unit_price,
                delivery_date: contract.delivery_date.split('T')[0],
                notes: contract.notes || '',
                additional_costs: contract.additional_costs || [],
                is_paid: false, // Not used when editing
            });
        } else {
            resetForm();
        }
        setShowModal(true);
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            if (editingContract) {
                await api.put(`/admin/contracts/${editingContract.id}`, form);
                setSuccess('Contrato actualizado');
            } else {
                await api.post('/admin/contracts', form);
                setSuccess('Contrato creado');
            }
            setShowModal(false);
            resetForm();
            fetchContracts();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            const error = err as AxiosError<{ message?: string }>;
            setError(error.response?.data?.message || 'Error al guardar');
        }
    };

    const initiateMarkAsPaid = (contract: Contract) => {
        setContractToPay(contract);
        setPaymentMethodForStatus('cash');
        setShowPaymentMethodModal(true);
    };

    const confirmMarkAsPaid = async () => {
        if (!contractToPay) return;
        try {
            await api.put(`/admin/contracts/${contractToPay.id}`, {
                status: 'delivered',
                payment_method: paymentMethodForStatus
            });
            fetchContracts();
            setSuccess('Estado actualizado y abono registrado');
            setShowPaymentMethodModal(false);
            setContractToPay(null);
            if (editingContract?.id === contractToPay.id) {
                setShowModal(false); // Close edit modal if open
            }
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Error updating status:', err);
        }
    };

    const updateStatus = async (contract: Contract, newStatus: string) => {
        // If changing to Delivered/Pagado, use the modal flow
        if (newStatus === 'delivered') {
            initiateMarkAsPaid(contract);
            return;
        }

        try {
            await api.put(`/admin/contracts/${contract.id}`, { status: newStatus });
            fetchContracts();
            setSuccess('Estado actualizado');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Error updating status:', err);
        }
    };

    const deleteContract = async (contract: Contract) => {
        if (!confirm(`¿Eliminar contrato de ${contract.company_name}?`)) return;

        try {
            await api.delete(`/admin/contracts/${contract.id}`);
            fetchContracts();
            setSuccess('Contrato eliminado');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Error deleting contract:', err);
        }
    };

    const addCost = () => {
        setForm({
            ...form,
            additional_costs: [...form.additional_costs, { description: '', amount: 0 }]
        });
    };

    const removeCost = (index: number) => {
        const newCosts = [...form.additional_costs];
        newCosts.splice(index, 1);
        setForm({ ...form, additional_costs: newCosts });
    };

    const updateCost = (index: number, field: 'description' | 'amount', value: string | number) => {
        const newCosts = [...form.additional_costs];
        // @ts-ignore
        newCosts[index][field] = value;
        setForm({ ...form, additional_costs: newCosts });
    };

    const calculateTotal = () => {
        const base = form.quantity * form.unit_price;
        const additional = form.additional_costs.reduce((sum, cost) => sum + (Number(cost.amount) || 0), 0);
        return base + additional;
    };

    const activeContracts = contracts.filter((contract) => contract.status !== 'delivered');
    const deliveredContracts = contracts.filter((contract) => contract.status === 'delivered');

    const openExtensionModal = (contract: Contract) => {
        setSelectedContractForExtension(contract);
        setExtensionForm({
            new_date: contract.delivery_date.split('T')[0],
            reason: ''
        });
        setShowExtensionModal(true);
    };

    const handleExtend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedContractForExtension) return;

        try {
            await api.post(`/admin/contracts/${selectedContractForExtension.id}/extend`, extensionForm);
            setSuccess('Prórroga aplicada y correo enviado');
            setShowExtensionModal(false);
            setSelectedContractForExtension(null);
            fetchContracts();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            const error = err as AxiosError<{ message?: string }>;
            setError(error.response?.data?.message || 'Error al extender contrato');
        }
    };

    const handleAddPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingContract) return;

        try {
            await api.post(`/admin/contracts/${editingContract.id}/payments`, paymentForm);
            setSuccess('Abono registrado');

            // Refresh contract data to show new payment
            const response = await api.get(`/admin/contracts/${editingContract.id}`);
            setEditingContract(response.data);

            // Reset payment form
            setPaymentForm({
                amount: 0,
                payment_date: getTodayDate(),
                notes: '',
            });

            fetchContracts(); // Update list too
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            const error = err as AxiosError<{ message?: string }>;
            setError(error.response?.data?.message || 'Error al registrar pago');
        }
    };

    return (
        <AdminLayout
            title="Gestión de Contratos"
            subtitle="Seguimiento de uniformes corporativos y pedidos especiales"
            actions={
                <button
                    onClick={() => openModal()}
                    className="px-6 py-3 bg-pink-hot hover:bg-pink-600 text-white font-black uppercase tracking-widest rounded-xl border-2 border-graphite shadow-[4px_4px_0px_0px_#333] hover:translate-x-[5px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#333] transition-all flex items-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Nuevo Contrato
                </button>
            }
        >
            <div className="flex flex-col items-center w-full">
                <div className="h-10 md:h-16"></div>
                {error && (
                    <div className="mb-8 w-[90%] md:w-full max-w-6xl mx-auto bg-red-pink/10 border-l-8 border-red-pink p-6 rounded-r-xl">
                        <div className="flex items-center gap-4">
                            <svg className="w-8 h-3 text-red-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <h3 className="text-xl font-black text-red-pink uppercase">Error</h3>
                                <p className="text-gray-700 font-medium text-lg">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {success && (
                    <div className="mb-8 w-[90%] md:w-full max-w-6xl mx-auto bg-teal/10 border-l-8 border-teal p-6 rounded-r-xl">
                        <div className="flex items-center gap-4">
                            <svg className="w-8 h-8 text-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <div>
                                <h3 className="text-xl font-black text-teal uppercase">Éxito</h3>
                                <p className="text-gray-700 font-medium text-lg">{success}</p>
                            </div>
                        </div>
                    </div>
                )}

                {isLoading ? (
                    <div className="text-center py-20 w-full">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-teal mx-auto mb-6"></div>
                        <p className="text-gray-500 font-medium text-xl">Cargando contratos...</p>
                    </div>
                ) : activeContracts.length === 0 ? (
                    <div className="w-[90%] md:w-full max-w-6xl mx-auto bg-white rounded-[3rem] border-8 border-dashed border-gray-300 p-20 text-center">
                        <div className="w-32 h-32 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-10 border-4 border-pink-100">
                            <svg className="w-16 h-16 text-pink-hot" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h3 className="text-4xl font-black text-graphite mb-4 uppercase">No hay contratos activos</h3>
                        <p className="text-gray-500 mb-10 font-medium text-xl">Crea un nuevo contrato o revisa el historial</p>
                        <button
                            onClick={() => openModal()}
                            className="inline-block px-10 py-6 bg-teal hover:bg-teal-600 text-white font-black uppercase tracking-widest rounded-2xl border-4 border-graphite shadow-[8px_8px_0px_0px_#333] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_#333] transition-all text-xl"
                        >
                            Crear Contrato
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-8 items-center w-full mb-24">
                        {activeContracts.map((contract) => (
                            <div
                                key={contract.id}
                                className="w-[90%] md:w-full max-w-5xl bg-white rounded-md md:rounded-lg shadow-xl border-2 md:border-4 border-graphite transition-all duration-300 text-center"
                                style={{ padding: '32px' }}
                            >
                                <div className="flex flex-col lg:flex-row items-center justify-center gap-4 md:gap-16">
                                    <div className="w-full lg:w-3/5">
                                        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4 mb-4">
                                            <h3 className="text-xl md:text-3xl font-black text-graphite uppercase tracking-tight wrap-break-word text-center">{contract.company_name}</h3>
                                            <span className={`px-2 py-1 md:px-4 md:py-2 rounded-lg md:rounded-xl text-xs md:text-sm font-black uppercase tracking-wider border-2 ${statusColors[contract.status]}`}>
                                                {statusLabels[contract.status]}
                                            </span>
                                        </div>
                                        <p className="text-gray-600 font-medium mb-4 bg-gray-50 p-3 md:p-4 rounded-xl border-2 border-gray-100 text-sm md:text-base leading-relaxed text-center">{contract.description}</p>
                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 text-sm md:text-base text-center">
                                            <div>
                                                <span className="block text-gray-400 font-black uppercase text-[10px] md:text-xs tracking-widest mb-1">Contacto</span>
                                                <p className="text-graphite font-bold text-sm md:text-lg truncate">{contract.contact_person}</p>
                                            </div>
                                            <div>
                                                <span className="block text-gray-400 font-black uppercase text-[10px] md:text-xs tracking-widest mb-1">Teléfono</span>
                                                <p className="text-graphite font-bold text-sm md:text-lg truncate">{contract.phone}</p>
                                            </div>
                                            <div>
                                                <span className="block text-gray-400 font-black uppercase text-[10px] md:text-xs tracking-widest mb-1">Cantidad</span>
                                                <p className="text-graphite font-bold text-sm md:text-lg">{contract.quantity} u.</p>
                                            </div>
                                            <div>
                                                <span className="block text-gray-400 font-black uppercase text-[10px] md:text-xs tracking-widest mb-1">Entrega</span>
                                                <p className="text-graphite font-bold text-sm md:text-lg">{new Date(contract.delivery_date).toLocaleDateString()}</p>
                                            </div>
                                        </div>


                                        {/* Display Additional Costs if any */}
                                        {contract.additional_costs && contract.additional_costs.length > 0 && (
                                            <div className="mt-4 p-3 bg-blue-50/50 rounded-lg border-2 border-blue-100 w-full text-center">
                                                <p className="text-blue-500 font-black uppercase text-[10px] md:text-xs tracking-widest mb-2">Costos Adicionales</p>
                                                <ul className="space-y-1">
                                                    {contract.additional_costs.map((cost, idx) => (
                                                        <li key={idx} className="flex justify-between text-xs md:text-sm font-bold text-graphite/80 md:px-4">
                                                            <span>{cost.description}</span>
                                                            <span>+{formatCurrency(cost.amount)}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>

                                    <div className="w-full lg:w-auto flex flex-col items-center justify-center border-t-2 lg:border-t-0 lg:border-l-4 border-gray-100 pt-4 lg:pt-0 lg:pl-12 relative shrink-0">
                                        <div className="mb-4 text-center">
                                            <p className="text-2xl md:text-4xl font-black text-teal tracking-tight">{formatCurrency(contract.total)}</p>
                                            <p className="text-gray-400 text-[10px] md:text-xs font-bold uppercase tracking-wider mt-1">{formatCurrency(contract.unit_price)} c/u</p>
                                        </div>

                                        <div className="flex gap-2 justify-center mb-4 lg:mb-0">
                                            <button
                                                onClick={() => setSelectedContractForPrint(contract)}
                                                className="p-2 md:p-3 text-graphite hover:text-white hover:bg-graphite rounded-xl border-2 border-transparent hover:border-graphite hover:shadow-[3px_3px_0px_0px_#333] transition-all"
                                                title="Imprimir / PDF"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => openExtensionModal(contract)}
                                                className="p-2 md:p-3 text-orange-500 hover:text-white hover:bg-orange-500 rounded-xl border-2 border-transparent hover:border-graphite hover:shadow-[3px_3px_0px_0px_#333] transition-all"
                                                title="Extender Plazo / Prórroga"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => openModal(contract)}
                                                className="p-2 md:p-3 text-blue-600 hover:text-white hover:bg-blue-600 rounded-xl border-2 border-transparent hover:border-graphite hover:shadow-[3px_3px_0px_0px_#333] transition-all"
                                                title="Editar"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => deleteContract(contract)}
                                                className="p-2 md:p-3 text-red-pink hover:text-white hover:bg-red-pink rounded-xl border-2 border-transparent hover:border-graphite hover:shadow-[3px_3px_0px_0px_#333] transition-all"
                                                title="Eliminar"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t-2 border-gray-100 flex flex-wrap items-center justify-center gap-2">
                                    <span className="text-gray-400 text-xs font-black uppercase tracking-wider mr-2">Cambiar Estado:</span>
                                    {['pending', 'in_progress', 'completed', 'delivered', 'cancelled'].map((status) => (
                                        <button
                                            key={status}
                                            onClick={() => updateStatus(contract, status)}
                                            className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border hover:opacity-80 transition-opacity ${status === contract.status ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                                                } ${statusColors[status as keyof typeof statusColors]}`}
                                        >
                                            {statusLabels[status as keyof typeof statusLabels]}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )
                }

                {deliveredContracts.length > 0 && (
                    <>
                        <div className="h-16 md:h-15"></div>
                        <div className="w-[90%] md:w-full max-w-6xl mx-auto mt-40 pt-12 border-t-8 border-dashed border-gray-200 bg-gray-50/60 rounded-lg px-4 md:px-8 pb-8">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                                <div>
                                    <h3 className="text-2xl md:text-3xl font-black text-graphite uppercase tracking-tight">Historial de Contratos</h3>
                                    <p className="text-xs font-black uppercase tracking-widest text-gray-400 mt-2">
                                        {deliveredContracts.length} finalizados
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsHistoryOpen((prev) => !prev)}
                                    className="px-4 py-2 bg-graphite text-white font-black uppercase tracking-widest rounded-xl border-2 border-graphite shadow-[3px_3px_0px_0px_#333] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_0px_#333] transition-all text-xs"
                                >
                                    {isHistoryOpen ? 'Ocultar' : 'Mostrar'}
                                </button>
                            </div>
                            {isHistoryOpen && (
                                <div className="bg-white rounded-lg border-4 border-graphite shadow-xl overflow-hidden" style={{ padding: '16px' }}>
                                    <div className="divide-y-2 divide-gray-100">
                                        {deliveredContracts.map((contract) => (
                                            <div key={contract.id} className="p-10 md:p-12 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div>
                                                    <p className="text-xl font-black text-graphite">{contract.company_name}</p>
                                                    <p className="text-sm text-gray-500 font-medium">{contract.contact_person} · {new Date(contract.delivery_date).toLocaleDateString()}</p>
                                                </div>
                                                <div className="flex flex-col items-start md:items-end gap-2">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border-2 ${statusColors.delivered}`}>
                                                        Pagado
                                                    </span>
                                                    <span className="text-lg font-black text-teal">{formatCurrency(contract.total)}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedHistoryContract(contract)}
                                                        className="text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full border-2 border-graphite text-graphite hover:bg-graphite hover:text-white transition-colors"
                                                    >
                                                        Ver detalle
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* Modal */}
                {
                    showModal && (
                        <div className="fixed inset-0 bg-graphite/80 backdrop-blur-sm flex items-center justify-center p-4 z-60">
                            <div className="bg-white rounded-xl p-6 md:p-10 max-w-2xl w-full border-4 border-graphite shadow-[16px_16px_0px_0px_#333] max-h-[90vh] overflow-y-auto text-black">
                                <div className="flex justify-between items-center mb-6 md:mb-10 border-b-4 border-gray-100 pb-4 md:pb-6">
                                    <h2 className="text-3xl md:text-4xl font-black text-black uppercase tracking-tight">
                                        {editingContract ? 'Editar Contrato' : 'Nuevo Contrato'}
                                    </h2>
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="text-black/60 hover:text-red-pink transition-colors p-2 hover:bg-gray-50 rounded-xl"
                                    >
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className="block text-sm font-black text-black uppercase tracking-widest">Empresa</label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full px-5 py-4 bg-gray-50 border-4 border-gray-200 rounded-xl text-black font-bold focus:border-graphite focus:bg-white focus:outline-none transition-all placeholder-black/40"
                                                value={form.company_name}
                                                onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                                                placeholder="Nombre de la empresa"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="block text-sm font-black text-black uppercase tracking-widest">Contacto</label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full px-5 py-4 bg-gray-50 border-4 border-gray-200 rounded-xl text-black font-bold focus:border-graphite focus:bg-white focus:outline-none transition-all placeholder-black/40"
                                                value={form.contact_person}
                                                onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
                                                placeholder="Nombre del contacto"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className="block text-sm font-black text-black uppercase tracking-widest">Teléfono</label>
                                            <input
                                                type="tel"
                                                required
                                                className="w-full px-5 py-4 bg-gray-50 border-4 border-gray-200 rounded-xl text-black font-bold focus:border-graphite focus:bg-white focus:outline-none transition-all placeholder-black/40"
                                                value={form.phone}
                                                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                                placeholder="+56 9 ..."
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="block text-sm font-black text-black uppercase tracking-widest">Email (Obligatorio)</label>
                                            <input
                                                type="email"
                                                required
                                                className="w-full px-5 py-4 bg-gray-50 border-4 border-gray-200 rounded-xl text-black font-bold focus:border-graphite focus:bg-white focus:outline-none transition-all placeholder-black/40"
                                                value={form.email}
                                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                                placeholder="contacto@empresa.com"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="block text-sm font-black text-black uppercase tracking-widest">Descripción del Pedido</label>
                                        <textarea
                                            required
                                            rows={3}
                                            className="w-full px-5 py-4 bg-gray-50 border-4 border-gray-200 rounded-xl text-black font-bold focus:border-graphite focus:bg-white focus:outline-none transition-all placeholder-black/40 resize-none"
                                            value={form.description}
                                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                                            placeholder="Detalles de los uniformes (tallas, colores, logo...)"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                        <div className="space-y-3">
                                            <label className="block text-sm font-black text-black uppercase tracking-widest">Cantidad</label>
                                            <input
                                                type="number"
                                                required
                                                min="1"
                                                className="w-full px-5 py-4 bg-gray-50 border-4 border-gray-200 rounded-xl text-black font-bold focus:border-graphite focus:bg-white focus:outline-none transition-all placeholder-black/40"
                                                value={form.quantity}
                                                onChange={(e) => {
                                                    const qty = parseInt(e.target.value) || 0;
                                                    setForm({ ...form, quantity: qty });
                                                }}
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="block text-sm font-black text-black uppercase tracking-widest">Precio Unitario</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    required
                                                    min="0"
                                                    className="w-full px-5 py-4 bg-gray-50 border-4 border-gray-200 rounded-xl text-black font-bold focus:border-graphite focus:bg-white focus:outline-none transition-all placeholder-black/40"
                                                    value={form.unit_price}
                                                    onChange={(e) => {
                                                        const price = parseFloat(e.target.value) || 0;
                                                        setForm({ ...form, unit_price: price });
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="block text-sm font-black text-black uppercase tracking-widest">Entrega</label>
                                            <input
                                                type="date"
                                                required
                                                className="w-full px-5 py-4 bg-gray-50 border-4 border-gray-200 rounded-xl text-black font-bold focus:border-graphite focus:bg-white focus:outline-none transition-all placeholder-black/40"
                                                value={form.delivery_date}
                                                onChange={(e) => setForm({ ...form, delivery_date: e.target.value })}
                                            />
                                        </div>
                                    </div>



                                    {/* Additional Costs Section */}
                                    <div className="space-y-4 pt-6 border-t-4 border-gray-100">
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-xl font-black text-graphite uppercase tracking-tight">Costos Adicionales / Extras</h3>
                                            <button
                                                type="button"
                                                onClick={addCost}
                                                className="px-4 py-2 bg-blue-100 text-blue-600 font-bold rounded-lg hover:bg-blue-200 transition-colors text-sm uppercase tracking-wide"
                                            >
                                                + Agregar Costo
                                            </button>
                                        </div>

                                        {form.additional_costs.length === 0 && (
                                            <p className="text-gray-400 italic text-sm">No hay costos adicionales registrados.</p>
                                        )}

                                        <div className="space-y-3">
                                            {form.additional_costs.map((cost, index) => (
                                                <div key={index} className="flex gap-4 items-start">
                                                    <div className="flex-1">
                                                        <input
                                                            type="text"
                                                            placeholder="Descripción (Ej: Envío, Bordado extra...)"
                                                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-graphite focus:border-graphite focus:outline-none transition-all"
                                                            value={cost.description}
                                                            onChange={(e) => updateCost(index, 'description', e.target.value)}
                                                            required
                                                        />
                                                    </div>
                                                    <div className="w-32 relative">
                                                        <input
                                                            type="number"
                                                            placeholder="0"
                                                            min="0"
                                                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-graphite focus:border-graphite focus:outline-none transition-all font-bold"
                                                            value={cost.amount}
                                                            onChange={(e) => updateCost(index, 'amount', parseFloat(e.target.value) || 0)}
                                                            required
                                                        />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeCost(index)}
                                                        className="p-3 text-red-pink hover:bg-red-50 rounded-xl transition-colors"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Pay in Full Checkbox (Only for new contracts) */}
                                    {!editingContract && (
                                        <div className="mt-6 p-4 bg-teal/10 rounded-xl border-2 border-teal/30 flex items-center gap-4">
                                            <input
                                                type="checkbox"
                                                id="is_paid"
                                                className="w-6 h-6 text-teal rounded focus:ring-teal border-gray-300"
                                                checked={form.is_paid}
                                                onChange={(e) => setForm({ ...form, is_paid: e.target.checked })}
                                            />
                                            <div>
                                                <label htmlFor="is_paid" className="block text-sm font-black text-teal uppercase tracking-widest cursor-pointer">
                                                    Pagado Completo
                                                </label>
                                                <p className="text-xs text-teal/70">Marcar si el cliente paga el total ahora. Se creará el abono y se marcará como pagado.</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="p-6 bg-teal/10 rounded-2xl border-4 border-teal flex flex-col gap-2">
                                        <div className="flex justify-between items-center text-teal/70 font-bold uppercase text-sm">
                                            <span>Subtotal (Uniformes)</span>
                                            <span>{formatCurrency(form.quantity * form.unit_price)}</span>
                                        </div>
                                        {form.additional_costs.length > 0 && (
                                            <div className="flex justify-between items-center text-teal/70 font-bold uppercase text-sm">
                                                <span>Extras</span>
                                                <span>{formatCurrency(form.additional_costs.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0))}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center border-t-2 border-teal/20 pt-2 mt-1">
                                            <span className="text-teal font-black uppercase tracking-widest text-lg">Total Final</span>
                                            <span className="text-4xl font-black text-teal tracking-tight">{formatCurrency(calculateTotal())}</span>
                                        </div>
                                    </div>

                                    {/* Payments Section (Only for editing) */}
                                    {editingContract && (
                                        <div className="mt-8 pt-6 border-t-4 border-gray-100">
                                            <h3 className="text-xl font-black text-graphite uppercase tracking-tight mb-4">Historial de Abonos / Pagos</h3>

                                            {/* Payment Stats */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                                <div className="p-4 bg-teal/10 rounded-xl border-2 border-teal/20">
                                                    <p className="text-xs font-black text-teal uppercase tracking-widest mb-1">Total Abonado</p>
                                                    <p className="text-2xl font-black text-teal">
                                                        {formatCurrency(editingContract.payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0)}
                                                    </p>
                                                </div>
                                                <div className="p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
                                                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Total Contrato</p>
                                                    <p className="text-2xl font-black text-graphite">
                                                        {formatCurrency(editingContract.total)}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Payments List */}
                                            <div className="mb-6 space-y-2">
                                                {editingContract.payments && editingContract.payments.length > 0 ? (
                                                    editingContract.payments.map((payment) => (
                                                        <div key={payment.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100 text-sm">
                                                            <div>
                                                                <p className="font-bold text-graphite">{formatCurrency(payment.amount)}</p>
                                                                <p className="text-xs text-gray-500">{new Date(payment.payment_date).toLocaleDateString()} {payment.notes && `- ${payment.notes}`}</p>
                                                            </div>
                                                            <div className="text-teal font-black text-xs uppercase bg-teal/10 px-2 py-1 rounded">Abonado</div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-gray-400 italic text-sm text-center py-2">No hay abonos registrados.</p>
                                                )}
                                            </div>

                                            {/* Add Payment Form */}
                                            <div className="bg-blue-50/50 p-4 rounded-xl border-2 border-blue-100">
                                                <p className="text-sm font-black text-blue-600 uppercase tracking-widest mb-3">Registrar Nuevo Abono</p>
                                                <div className="flex flex-col md:flex-row gap-3 items-end">
                                                    <div className="flex-1 w-full">
                                                        <label className="block text-xs font-bold text-blue-400 mb-1">Monto</label>
                                                        <input
                                                            type="number"
                                                            className="w-full px-3 py-2 bg-white border-2 border-blue-200 rounded-lg text-graphite font-bold focus:border-blue-500 focus:outline-none"
                                                            value={paymentForm.amount}
                                                            onChange={(e) => setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) || 0 })}
                                                            placeholder="0"
                                                        />
                                                    </div>
                                                    <div className="w-full md:w-32">
                                                        <label className="block text-xs font-bold text-blue-400 mb-1">Fecha</label>
                                                        <input
                                                            type="date"
                                                            className="w-full px-3 py-2 bg-white border-2 border-blue-200 rounded-lg text-graphite font-bold focus:border-blue-500 focus:outline-none"
                                                            value={paymentForm.payment_date}
                                                            onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="flex-1 w-full">
                                                        <label className="block text-xs font-bold text-blue-400 mb-1">Nota (Opcional)</label>
                                                        <input
                                                            type="text"
                                                            className="w-full px-3 py-2 bg-white border-2 border-blue-200 rounded-lg text-graphite font-bold focus:border-blue-500 focus:outline-none"
                                                            value={paymentForm.notes}
                                                            onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                                                            placeholder="Ej: Transferencia..."
                                                        />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={handleAddPayment}
                                                        disabled={paymentForm.amount <= 0}
                                                        className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white font-black uppercase tracking-wide rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                                                    >
                                                        Agregar
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex justify-end gap-4 pt-4 border-t-4 border-gray-100">
                                        {editingContract && editingContract.status !== 'delivered' && (
                                            <button
                                                type="button"
                                                onClick={() => updateStatus(editingContract!, 'delivered')}
                                                className="px-4 py-2 bg-teal text-white font-black uppercase tracking-wide rounded-lg hover:bg-teal/90 transition-colors shadow-md flex items-center gap-2"
                                            >
                                                <CheckCircle size={18} />
                                                Marcar como Pagado
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => setShowModal(false)}
                                            className="px-8 py-4 bg-white text-gray-500 font-black uppercase tracking-widest rounded-xl border-4 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-8 py-4 bg-graphite text-white font-black uppercase tracking-widest rounded-xl border-4 border-graphite hover:bg-gray-800 transition-all shadow-[4px_4px_0px_0px_#ccc] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#ccc]"
                                        >
                                            {editingContract ? 'Guardar Cambios' : 'Crear Contrato'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )
                }
                <div className="h-12 md:h-16"></div>
            </div>

            {selectedHistoryContract && (
                <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 p-4">
                    <div className="rounded-xl border-2 border-graphite w-full max-w-3xl shadow-[12px_12px_0px_0px_#333] p-6 bg-white">
                        <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
                            <div className="bg-graphite text-white p-6 md:p-7 flex items-start justify-between">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest text-white/70">Historial</p>
                                    <h3 className="text-2xl md:text-3xl font-black">Contrato #{selectedHistoryContract.id}</h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSelectedHistoryContract(null)}
                                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-pink-hot transition-colors flex items-center justify-center"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                            <div className="p-7 md:p-10 space-y-8 max-h-[80vh] overflow-y-auto text-black">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                                        <p className="text-xs font-black uppercase tracking-widest text-gray-400">Empresa</p>
                                        <p className="font-black text-black">{selectedHistoryContract.company_name}</p>
                                        <p className="text-sm text-black/70">{selectedHistoryContract.contact_person}</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                                        <p className="text-xs font-black uppercase tracking-widest text-gray-400">Contacto</p>
                                        <p className="text-sm text-black/70">{selectedHistoryContract.email || 'Sin correo'}</p>
                                        <p className="text-sm text-black/70">{selectedHistoryContract.phone}</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                                        <p className="text-xs font-black uppercase tracking-widest text-gray-400">Entrega</p>
                                        <p className="font-black text-black">{new Date(selectedHistoryContract.delivery_date).toLocaleDateString()}</p>
                                        <p className="text-sm text-black/70">Estado: {statusLabels[selectedHistoryContract.status]}</p>
                                    </div>
                                </div>
                                <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                                    <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Descripción</p>
                                    <p className="text-sm text-black/80 leading-relaxed">{selectedHistoryContract.description}</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                                        <p className="text-xs font-black uppercase tracking-widest text-gray-400">Cantidad</p>
                                        <p className="text-lg font-black text-black">{selectedHistoryContract.quantity}</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                                        <p className="text-xs font-black uppercase tracking-widest text-gray-400">Precio U.</p>
                                        <p className="text-lg font-black text-black">{formatCurrency(selectedHistoryContract.unit_price)}</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                                        <p className="text-xs font-black uppercase tracking-widest text-gray-400">Total</p>
                                        <p className="text-lg font-black text-black">{formatCurrency(selectedHistoryContract.total)}</p>
                                    </div>
                                </div>
                                {selectedHistoryContract.additional_costs && selectedHistoryContract.additional_costs.length > 0 && (
                                    <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
                                        <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Costos adicionales</p>
                                        <div className="space-y-2">
                                            {selectedHistoryContract.additional_costs.map((cost, idx) => (
                                                <div key={idx} className="flex justify-between text-sm font-bold text-black/80">
                                                    <span>{cost.description}</span>
                                                    <span>{formatCurrency(cost.amount)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {selectedHistoryContract.notes && (
                                    <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                                        <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Notas</p>
                                        <p className="text-sm text-black/80">{selectedHistoryContract.notes}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Extension Modal */}
            {showExtensionModal && selectedContractForExtension && (
                <div className="fixed inset-0 bg-graphite/80 backdrop-blur-sm flex items-center justify-center p-4 z-70">
                    <div className="bg-white rounded-[2.5rem] p-10 max-w-lg w-full border-8 border-graphite shadow-[16px_16px_0px_0px_#333]">
                        <div className="flex justify-between items-center mb-6 border-b-4 border-gray-100 pb-4">
                            <h2 className="text-3xl font-black text-graphite uppercase tracking-tight">Extender Plazo</h2>
                            <button
                                onClick={() => setShowExtensionModal(false)}
                                className="text-gray-400 hover:text-red-pink transition-colors"
                            >
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="mb-6 bg-orange-50 p-4 rounded-xl border-l-4 border-orange-400">
                            <p className="text-sm font-bold text-orange-800">
                                Contrato: {selectedContractForExtension.company_name}
                            </p>
                            <p className="text-xs text-orange-600 mt-1">
                                Fecha actual: {new Date(selectedContractForExtension.delivery_date).toLocaleDateString()}
                            </p>
                        </div>

                        <form onSubmit={handleExtend} className="space-y-6">
                            <div className="space-y-3">
                                <label className="block text-sm font-black text-gray-400 uppercase tracking-widest">Nueva Fecha de Entrega</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full px-5 py-4 bg-gray-50 border-4 border-gray-200 rounded-xl text-graphite font-bold focus:border-graphite focus:bg-white focus:outline-none transition-all"
                                    value={extensionForm.new_date}
                                    onChange={(e) => setExtensionForm({ ...extensionForm, new_date: e.target.value })}
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="block text-sm font-black text-gray-400 uppercase tracking-widest">Motivo (Para el correo)</label>
                                <textarea
                                    rows={4}
                                    className="w-full px-5 py-4 bg-gray-50 border-4 border-gray-200 rounded-xl text-graphite font-bold focus:border-graphite focus:bg-white focus:outline-none transition-all resize-none"
                                    value={extensionForm.reason}
                                    onChange={(e) => setExtensionForm({ ...extensionForm, reason: e.target.value })}
                                    placeholder="Explique la razón del cambio de fecha..."
                                />
                                <p className="text-xs text-gray-400 font-medium">Se enviará un correo automático al cliente con esta información.</p>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t-4 border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setShowExtensionModal(false)}
                                    className="px-6 py-3 bg-white text-gray-500 font-black uppercase tracking-widest rounded-xl border-4 border-gray-200 hover:bg-gray-50 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-3 bg-orange-500 text-white font-black uppercase tracking-widest rounded-xl border-4 border-graphite hover:bg-orange-600 transition-all shadow-[4px_4px_0px_0px_#333]"
                                >
                                    Confirmar Prórroga
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Hidden Print Invoice Template */}
            <div className="hidden">
                <div ref={printRef} className="p-10 bg-white max-w-[800px] mx-auto text-graphite font-sans">
                    {selectedContractForPrint && (
                        <div className="border-4 border-graphite p-8">
                            {/* Header */}
                            <div className="flex justify-between items-start mb-10 border-b-4 border-black pb-6">
                                <div className="flex items-center gap-4">
                                    <img src="/logo_original.png" alt="Logo" className="w-16 h-16 object-contain border-2 border-graphite rounded-xl p-1" />
                                    <div className="flex flex-col">
                                        <h1 className="text-4xl font-black uppercase tracking-tight">Entre Lanas y Fragancias</h1>
                                        <div className="mt-1 space-y-0.5">
                                            <p className="text-gray-500 font-bold text-xs tracking-widest uppercase italic">NIT 20421751 - 2</p>
                                            <p className="text-gray-400 font-bold text-xs uppercase">Carrera 11 # 6-08, Barrio el Rosario, Chía</p>
                                            <p className="text-gray-400 font-bold text-xs uppercase">Tel: 312 457 8081 - 314 461 6230</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-black uppercase text-gray-400">Factura / Contrato</p>
                                    <p className="text-3xl font-black">#{selectedContractForPrint.id.toString().padStart(6, '0')}</p>
                                    <p className="text-gray-500 font-bold mt-1">{new Date().toLocaleDateString()}</p>
                                </div>
                            </div>

                            {/* Client Info */}
                            <div className="grid grid-cols-2 gap-8 mb-10">
                                <div>
                                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Cliente</p>
                                    <p className="text-2xl font-black">{selectedContractForPrint.company_name}</p>
                                    <p className="text-lg font-medium">{selectedContractForPrint.contact_person}</p>
                                    <p className="text-gray-500">{selectedContractForPrint.email}</p>
                                    <p className="text-gray-500">{selectedContractForPrint.phone}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Detalles de Entrega</p>
                                    <p className="text-xl font-bold">{new Date(selectedContractForPrint.delivery_date).toLocaleDateString()}</p>
                                    <p className={`inline-block mt-2 px-3 py-1 text-sm font-black uppercase tracking-wider border-2 rounded-lg ${statusColors[selectedContractForPrint.status]}`}>
                                        {statusLabels[selectedContractForPrint.status]}
                                    </p>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="mb-10 p-6 bg-gray-50 border-2 border-gray-200 rounded-xl">
                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Descripción del Pedido</p>
                                <p className="text-lg leading-relaxed font-medium">{selectedContractForPrint.description}</p>
                            </div>

                            {/* Items Table */}
                            <table className="w-full mb-8">
                                <thead className="border-b-4 border-black">
                                    <tr>
                                        <th className="text-left py-3 font-black uppercase tracking-wider">Descripción</th>
                                        <th className="text-right py-3 font-black uppercase tracking-wider">Cant.</th>
                                        <th className="text-right py-3 font-black uppercase tracking-wider">Precio U.</th>
                                        <th className="text-right py-3 font-black uppercase tracking-wider">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y-2 divide-gray-100">
                                    <tr>
                                        <td className="py-4 font-bold text-lg">Confección de Uniformes</td>
                                        <td className="py-4 text-right font-medium">{selectedContractForPrint.quantity}</td>
                                        <td className="py-4 text-right font-medium">{formatCurrency(selectedContractForPrint.unit_price)}</td>
                                        <td className="py-4 text-right font-black">{formatCurrency(selectedContractForPrint.quantity * selectedContractForPrint.unit_price)}</td>
                                    </tr>
                                    {selectedContractForPrint.additional_costs?.map((cost, idx) => (
                                        <tr key={idx} className="bg-gray-50">
                                            <td className="py-3 pl-4 text-gray-600 font-medium italic">{cost.description}</td>
                                            <td className="py-3 text-right text-gray-400">-</td>
                                            <td className="py-3 text-right text-gray-400">-</td>
                                            <td className="py-3 text-right font-bold text-gray-700">{formatCurrency(cost.amount)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Total */}
                            <div className="flex justify-end pt-6 border-t-4 border-black">
                                <div className="text-right">
                                    <p className="text-sm font-black text-gray-400 uppercase tracking-widest mb-1">Total a Pagar</p>
                                    <p className="text-5xl font-black text-teal tracking-tighter">{formatCurrency(selectedContractForPrint.total)}</p>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="mt-20 text-center text-gray-400 text-sm font-medium border-t-2 border-gray-100 pt-6">
                                <p>Gracias por su preferencia - Entre Lanas y Fragancias</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {/* Payment Method Modal for 'Pagado' Status */}
            {showPaymentMethodModal && contractToPay && (
                <div className="fixed inset-0 bg-graphite/80 backdrop-blur-sm flex items-center justify-center p-4 z-60">
                    <div className="bg-white rounded-[2.5rem] p-6 md:p-10 max-w-lg w-full border-8 border-teal shadow-[16px_16px_0px_0px_#333] max-h-[90vh] overflow-y-auto relative">

                        {/* Close Button */}
                        <div className="absolute top-6 right-6">
                            <button
                                type="button"
                                onClick={() => setShowPaymentMethodModal(false)}
                                className="text-gray-400 hover:text-red-pink transition-colors p-2 hover:bg-gray-50 rounded-xl"
                            >
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="text-center mb-8">
                            <div className="w-20 h-20 bg-teal/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle className="h-10 w-10 text-teal" />
                            </div>
                            <h3 className="text-3xl font-black text-graphite uppercase tracking-tight leading-none" id="modal-title">
                                Confirmar Pago
                            </h3>
                        </div>

                        <div className="space-y-6">
                            <p className="text-gray-500 font-medium text-center">
                                Al marcar como <strong>Pagado</strong>, se generará automáticamante un abono por el saldo pendiente.
                            </p>

                            <div className="space-y-3">
                                <label className="block text-sm font-black text-gray-400 uppercase tracking-widest text-center">Selecciona Método de Pago</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {['cash', 'card', 'transfer'].map((method) => (
                                        <button
                                            key={method}
                                            type="button"
                                            onClick={() => setPaymentMethodForStatus(method)}
                                            className={`py-4 px-2 rounded-xl text-sm font-black uppercase tracking-wide border-4 transition-all ${paymentMethodForStatus === method
                                                ? 'bg-teal text-white border-teal shadow-[4px_4px_0px_0px_#333] translate-x-[2px] translate-y-[2px]'
                                                : 'bg-white text-gray-400 border-gray-200 hover:border-teal/50'
                                                }`}
                                        >
                                            {method === 'cash' ? 'Efectivo' : method === 'card' ? 'Tarjeta' : 'Transf.'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="p-6 bg-teal/5 rounded-2xl border-4 border-teal/20 text-center">
                                <p className="text-xs font-black text-teal/60 uppercase tracking-widest mb-1">Saldo Pendiente a Saldar</p>
                                <p className="text-4xl font-black text-teal">
                                    {(() => {
                                        try {
                                            const balance = getRemainingBalance(contractToPay);
                                            console.log('Rendering balance:', balance);
                                            return formatCurrency(balance);
                                        } catch (err) {
                                            console.error('Render error:', err);
                                            return '$0';
                                        }
                                    })()}
                                </p>
                            </div>

                            <div className="pt-4 flex flex-col gap-3">
                                <button
                                    type="button"
                                    onClick={confirmMarkAsPaid}
                                    className="w-full py-4 bg-teal hover:bg-teal-600 text-white font-black uppercase tracking-widest rounded-xl border-4 border-transparent hover:border-graphite shadow-sm transition-all text-lg"
                                >
                                    Confirmar y Pagar
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowPaymentMethodModal(false)}
                                    className="w-full py-4 bg-white text-gray-400 font-black uppercase tracking-widest rounded-xl border-4 border-transparent hover:bg-gray-50 transition-all"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
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
        </AdminLayout>
    );
}
