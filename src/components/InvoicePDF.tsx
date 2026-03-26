import React from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface OrderItem {
    id: number;
    product_name: string;
    quantity: number;
    price: string;
    product?: {
        name: string;
        image?: string;
    }
}

interface Order {
    id: number;
    created_at: string;
    status: string;
    total: string;
    shipping_cost: string;
    shipping_address: string;
    city: string;
    department: string;
    phone: string;
    payment_proof?: string;
    shipping_date?: string | null;
    items: OrderItem[];
}

interface User {
    name: string;
    email: string;
    address?: string;
    city?: string;
    department?: string;
    phone?: string;
}

interface InvoicePDFProps {
    order: Order;
    user: User | null;
}

const InvoicePDF: React.FC<InvoicePDFProps> = ({ order, user }) => {
    const generatePDF = async () => {
        try {
            // Crear un contenedor temporal para el contenido del PDF
            const tempContainer = document.createElement('div');
            tempContainer.style.position = 'absolute';
            tempContainer.style.left = '-9999px';
            tempContainer.style.top = '-9999px';
            tempContainer.style.width = '210mm';
            tempContainer.style.backgroundColor = '#ffffff';
            document.body.appendChild(tempContainer);

            // Generar el contenido HTML para el PDF
            const invoiceContent = createInvoiceContent();
            tempContainer.innerHTML = invoiceContent;

            // Esperar un momento para que el contenido se renderice
            await new Promise(resolve => setTimeout(resolve, 100));

            const canvas = await html2canvas(tempContainer, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            
            const imgWidth = 210;
            const pageHeight = 295;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            pdf.save(`Factura_Pedido_${order.id.toString().padStart(6, '0')}.pdf`);

            // Limpiar el contenedor temporal
            document.body.removeChild(tempContainer);
        } catch (error) {
            console.error('Error generating PDF:', error);
        }
    };

    const createInvoiceContent = () => {
        const formatDate = (dateString: string) => {
            return new Date(dateString).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        };

        const formatCurrency = (amount: string | number) => {
            return parseFloat(amount.toString()).toLocaleString('es-CO', {
                style: 'currency',
                currency: 'COP',
                minimumFractionDigits: 0,
            });
        };

        const getStatusText = (status: string) => {
            switch (status) {
                case 'pending': return 'Pendiente';
                case 'confirmed': return 'Confirmado';
                case 'completed': return 'Completado';
                case 'rejected': return 'Rechazado';
                default: return status;
            }
        };

        const getStatusColor = (status: string) => {
            switch (status) {
                case 'pending': return '#F59E0B';
                case 'confirmed': return '#3B82F6';
                case 'completed': return '#10B981';
                case 'rejected': return '#EF4444';
                default: return '#6B7280';
            }
        };

        return `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #1f2937; background-color: #ffffff; min-height: 277mm;">
                <!-- Header compacto -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #1f2937; padding-bottom: 10px;">
                    <div>
                        <h1 style="font-size: 24px; font-weight: bold; margin: 0; color: #1f2937;">FACTURA</h1>
                        <p style="font-size: 12px; margin: 2px 0 0 0; color: #6b7280;">Pedido #${order.id.toString().padStart(6, '0')}</p>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 16px; font-weight: bold; margin-bottom: 3px; color: #1f2937;">ENTRE LANAS</div>
                        <div style="font-size: 12px; font-weight: bold; margin-bottom: 2px; color: #FF4D8D;">Y FRAGANCIAS</div>
                        <div style="font-size: 10px; color: #6b7280; font-style: italic;">NIT 20421751 - 2</div>
                    </div>
                </div>

                <!-- Información del cliente y pedido compacta -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                    <div style="background-color: #f9fafb; padding: 12px; border-radius: 8px; border-left: 3px solid #FF4D8D;">
                        <h3 style="font-size: 12px; font-weight: bold; margin-bottom: 8px; color: #374151;">DATOS DEL CLIENTE</h3>
                        <div style="font-size: 11px; line-height: 1.4;">
                            <div style="margin-bottom: 4px;"><strong>Nombre:</strong> ${user?.name || 'N/A'}</div>
                            <div style="margin-bottom: 4px;"><strong>Email:</strong> ${user?.email || 'N/A'}</div>
                            <div style="margin-bottom: 4px;"><strong>Teléfono:</strong> ${user?.phone || order.phone || 'N/A'}</div>
                            <div style="margin-bottom: 4px;"><strong>Dirección:</strong> ${user?.address || order.shipping_address || 'N/A'}</div>
                            <div><strong>Ciudad:</strong> ${user?.city || order.city || 'N/A'}, ${user?.department || order.department || 'N/A'}</div>
                        </div>
                    </div>
                    <div style="background-color: #f9fafb; padding: 12px; border-radius: 8px; border-left: 3px solid #14b8a6;">
                        <h3 style="font-size: 12px; font-weight: bold; margin-bottom: 8px; color: #374151;">DATOS DEL PEDIDO</h3>
                        <div style="font-size: 11px; line-height: 1.4;">
                            <div style="margin-bottom: 4px;"><strong>Fecha:</strong> ${formatDate(order.created_at)}</div>
                            <div style="margin-bottom: 4px;">
                                <strong>Estado:</strong> 
                                <span style="color: ${getStatusColor(order.status)}; font-weight: bold; margin-left: 3px; padding: 1px 4px; border-radius: 8px; font-size: 10px; background-color: ${getStatusColor(order.status)}20;">
                                    ${getStatusText(order.status)}
                                </span>
                            </div>
                            <div style="margin-bottom: 4px;">
                                <strong>Fecha de envío:</strong> ${order.shipping_date ? formatDate(order.shipping_date) : 'Por definir'}
                            </div>
                            <div><strong>Costo de envío:</strong> ${formatCurrency(order.shipping_cost || 0)}</div>
                        </div>
                    </div>
                </div>

                <!-- Tabla de productos compacta -->
                <div style="margin-bottom: 20px;">
                    <h3 style="font-size: 12px; font-weight: bold; margin-bottom: 8px; color: #374151; display: flex; align-items: center; gap: 8px;">
                        <span style="display: inline-block; width: 3px; height: 16px; background-color: #FF4D8D; border-radius: 2px;"></span>
                        DETALLE DE PRODUCTOS
                    </h3>
                    <table style="width: 100%; border-collapse: collapse; font-size: 11px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                        <thead>
                            <tr style="background-color: #FF4D8D; color: white;">
                                <th style="padding: 8px; text-align: left; font-weight: bold;">Producto</th>
                                <th style="padding: 8px; text-align: center; font-weight: bold;">Cant.</th>
                                <th style="padding: 8px; text-align: right; font-weight: bold;">P. Unit.</th>
                                <th style="padding: 8px; text-align: right; font-weight: bold;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${order.items.map((item, index) => `
                                <tr style="background-color: ${index % 2 === 0 ? '#ffffff' : '#f9fafb'}; border-bottom: 1px solid #e5e7eb;">
                                    <td style="padding: 6px; font-weight: 500;">${item.product?.name || item.product_name}</td>
                                    <td style="padding: 6px; text-align: center; color: #6b7280;">${item.quantity}</td>
                                    <td style="padding: 6px; text-align: right; color: #6b7280;">${formatCurrency(item.price)}</td>
                                    <td style="padding: 6px; text-align: right; font-weight: bold; color: #1f2937;">${formatCurrency(parseFloat(item.price) * item.quantity)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <!-- Resumen y contacto en una fila -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                    <!-- Resumen de totales compacto -->
                    <div style="background: linear-gradient(135deg, #1f2937 0%, #374151 100%); border-radius: 12px; padding: 16px; color: white; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
                        <h4 style="font-size: 12px; font-weight: bold; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px; color: #FF4D8D;">RESUMEN DE COMPRA</h4>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 11px;">
                            <span style="color: #d1d5db;">Subtotal:</span>
                            <span>${formatCurrency(parseFloat(order.total) - parseFloat(order.shipping_cost || '0'))}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 11px;">
                            <span style="color: #d1d5db;">Envío:</span>
                            <span>${formatCurrency(order.shipping_cost || 0)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding-top: 10px; border-top: 2px solid #4b5563; font-size: 16px; font-weight: bold;">
                            <span>TOTAL:</span>
                            <span style="color: #14b8a6;">${formatCurrency(order.total)}</span>
                        </div>
                    </div>

                    <!-- Información de contacto compacta -->
                    <div style="background-color: #f9fafb; padding: 16px; border-radius: 12px; border: 1px solid #e5e7eb;">
                        <h3 style="font-size: 12px; font-weight: bold; margin-bottom: 10px; color: #374151; display: flex; align-items: center; gap: 8px;">
                            <span style="display: inline-block; width: 3px; height: 16px; background-color: #14b8a6; border-radius: 2px;"></span>
                            CONTACTO
                        </h3>
                        <div style="font-size: 10px; line-height: 1.4;">
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                                <div style="width: 24px; height: 24px; background-color: #FF4D8D; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;">📍</div>
                                <div>
                                    <div style="color: #6b7280;">Carrera 11# 6-08, Barrio el Rosario, Chía</div>
                                </div>
                            </div>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <div style="width: 24px; height: 24px; background-color: #14b8a6; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;">📞</div>
                                <div>
                                    <div style="color: #6b7280;">+57 312 457 8081 - 314 461 6230</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Footer compacto -->
                <div style="text-align: center; padding-top: 15px; border-top: 1px solid #e5e7eb;">
                    <div style="display: flex; justify-content: center; align-items: center; gap: 10px; margin-bottom: 8px;">
                        <div style="width: 30px; height: 30px; background-color: #1f2937; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px;">E</div>
                        <div style="text-align: left;">
                            <div style="font-weight: bold; color: #1f2937; font-size: 14px;">ENTRE LANAS</div>
                            <div style="color: #FF4D8D; font-weight: bold; font-size: 11px;">Y FRAGANCIAS</div>
                        </div>
                    </div>
                    <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 11px;">
                        Gracias por tu compra en Entre Lanas y Fragancias
                    </p>
                    <p style="margin: 0; color: #9ca3af; font-size: 9px;">
                        Esta factura es un documento válido para tu referencia • NIT 20421751 - 2
                    </p>
                    <div style="margin-top: 8px; display: flex; justify-content: center; gap: 15px;">
                        <span style="font-size: 8px; color: #9ca3af;">© 2026 Entre Lanas y Fragancias</span>
                        <span style="font-size: 8px; color: #9ca3af;">Todos los derechos reservados</span>
                    </div>
                </div>
            </div>
        `;
    };

    return (
        <>
            {/* Botón de descarga */}
            <button
                onClick={generatePDF}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Descargar PDF
            </button>
        </>
    );
};

export default InvoicePDF;
