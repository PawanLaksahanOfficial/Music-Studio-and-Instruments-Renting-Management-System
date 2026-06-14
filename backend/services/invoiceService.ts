import Invoice from '../models/Invoice';
import StudioRental from '../models/StudioRental';
import ProductRental from '../models/ProductRental';
import { IInvoice } from '../interfaces/IInvoice';

class InvoiceService {
    async getAllInvoices(): Promise<IInvoice[]> {
        return await Invoice.find()
            .populate('customer', 'firstName lastName phone email')
            .populate('productRentals', 'rentalId')
            .populate('studioRentals', 'bookingId')
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 });
    }

    async getInvoiceById(id: string): Promise<IInvoice> {
        const invoice = await Invoice.findById(id)
            .populate('customer', 'firstName lastName phone email')
            .populate('productRentals', 'rentalId')
            .populate('studioRentals', 'bookingId')
            .populate('createdBy', 'name');
        
        if (!invoice) {
            const error: any = new Error('Invoice not found');
            error.statusCode = 404;
            throw error;
        }
        return invoice;
    }

    async createInvoice(data: any, createdBy: string): Promise<IInvoice | null> {
        const {
            customerId, productRentalIds, studioRentalIds,
            items, subtotal, tax, totalAmount,
            paymentMethod, paymentStatus, notes
        } = data;

        if (!customerId || !items?.length || !paymentMethod) {
            const error: any = new Error('customerId, items and paymentMethod are required');
            error.statusCode = 400;
            throw error;
        }

        const invoice = await Invoice.create({
            customer: customerId,
            productRentals: productRentalIds || [],
            studioRentals:  studioRentalIds  || [],
            items,
            subtotal: subtotal || 0,
            tax: tax || 0,
            totalAmount: totalAmount || 0,
            paymentMethod,
            paymentStatus,
            createdBy: createdBy,
            notes
        });

        return await Invoice.findById(invoice._id)
            .populate('customer', 'firstName lastName phone email')
            .populate('productRentals', 'rentalId')
            .populate('studioRentals', 'bookingId')
            .populate('createdBy', 'name');
    }

    async updatePaymentStatus(id: string, paymentStatus: string): Promise<IInvoice> {
        const invoice = await Invoice.findByIdAndUpdate(
            id,
            { paymentStatus },
            { new: true, runValidators: true }
        ).populate('customer', 'firstName lastName');

        if (!invoice) {
            const error: any = new Error('Invoice not found');
            error.statusCode = 404;
            throw error;
        }

        // Sync rental payment statuses if this invoice is linked to any
        if (paymentStatus === 'Paid') {
            if (invoice.studioRentals?.length > 0) {
                await StudioRental.updateMany(
                    { _id: { $in: invoice.studioRentals } },
                    { paymentStatus: 'Paid' }
                );
            }
            if (invoice.productRentals?.length > 0) {
                await ProductRental.updateMany(
                    { _id: { $in: invoice.productRentals } },
                    { paymentStatus: 'Paid' }
                );
            }
        }
        return invoice;
    }
}

export default new InvoiceService();
