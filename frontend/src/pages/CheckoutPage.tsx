import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, Loader2, CreditCard, User, MapPin } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, simulatePayment, cn } from '../lib/utils';
import { checkoutSchema, paymentSchema, type CheckoutFormData, type PaymentFormData } from '../lib/schemas';
import { createOrder, previewOrder } from '../lib/api';

export default function CheckoutPage() {
  const { items, cartTotal, clearCart } = useCart();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [customerData, setCustomerData] = useState<CheckoutFormData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState('');

  const customerForm = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    mode: 'onTouched',
  });

  const paymentForm = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    mode: 'onTouched',
  });

  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  if (items.length === 0 && !isProcessing) {
    return <Navigate to="/cart" replace />;
  }

  const onCustomerSubmit = (data: CheckoutFormData) => {
    setCustomerData(data);
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const [preview, setPreview] = useState<any>(null);
  
  useEffect(() => {
    if (step === 2 && customerData) {
      const loadPreview = async () => {
        try {
          const res = await previewOrder({
            customer: {
              name: customerData.name,
              email: customerData.email,
              phone: customerData.phone,
              address: {
                street: customerData.street,
                city: customerData.city,
                postalCode: customerData.postalCode,
              }
            },
            items: items.map(i => ({ productId: i.productId, quantity: i.quantity })),
            couponCode: couponCode || undefined
          });
          if (res.success) setPreview(res.pricing);
        } catch (e) {
          console.error('Failed to load preview', e);
        }
      };
      loadPreview();
    }
  }, [step, customerData, items, couponCode]);

  const onPaymentSubmit = async (data: PaymentFormData) => {
    if (!customerData) return;
    
    setIsProcessing(true);
    setPaymentError(null);

    try {
      const { success, transactionId } = await simulatePayment(data.cardNumber);
      
      if (!success) {
        setPaymentError('Payment declined. Please try a different card.');
        setIsProcessing(false);
        return;
      }

      const orderPayload = {
        cartId: 'cart-' + Math.random().toString(36).substring(7),
        customer: {
          name: customerData.name,
          email: customerData.email,
          phone: customerData.phone,
          address: {
            street: customerData.street,
            city: customerData.city,
            postalCode: customerData.postalCode,
          }
        },
        items: items.map(i => ({
          productId: i.productId,
          quantity: i.quantity
        })),
        couponCode: couponCode || undefined,
        totalWeightKg: 1
      };

      const res = await createOrder(orderPayload);
      clearCart();
      navigate('/order-confirmation', { state: { order: res.order, transactionId } });

    } catch (err: any) {
      const apiMessage =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.message;
      setPaymentError(apiMessage || 'An error occurred during checkout. Please try again.');
      setIsProcessing(false);
    }
  };

  const InputField = ({ label, name, form, type = "text", placeholder = "", icon: Icon }: any) => {
    const error = form.formState.errors[name];
    return (
      <div className="flex flex-col gap-1.5 mb-4">
        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-gray-400" />}
          {label}
        </label>
        <input
          {...form.register(name)}
          type={type}
          placeholder={placeholder}
          className={cn(
            "px-4 py-2.5 rounded-lg border bg-gray-50/50 outline-none transition-all duration-200",
            "focus:bg-white focus:ring-2 focus:ring-ceylon-gold/50 focus:border-ceylon-gold",
            error ? "border-red-400 bg-red-50/50" : "border-gray-300"
          )}
        />
        {error && <span className="text-red-500 text-xs font-medium">{error.message as string}</span>}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 md:px-6 py-12 max-w-6xl animate-fade-in">
      <h1 className="text-3xl font-bold text-ceylon-charcoal mb-8 tracking-tight">Checkout</h1>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        <div className="w-full lg:w-2/3">
          
          {/* Step 1: Customer Details */}
          <div className={cn(
            "bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 mb-6 transition-all duration-500",
            step === 2 && "opacity-60 pointer-events-none scale-[0.99]"
          )}>
            <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
              <h2 className="text-xl font-bold text-ceylon-charcoal flex items-center gap-2">
                <span className="bg-ceylon-charcoal text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">1</span>
                Customer Information
              </h2>
              {step === 2 && (
                <button 
                  onClick={() => setStep(1)} 
                  className="text-sm text-ceylon-maroon font-medium hover:underline pointer-events-auto"
                >
                  Edit
                </button>
              )}
            </div>

            <form onSubmit={customerForm.handleSubmit(onCustomerSubmit)} className={cn("transition-all", step === 2 && "hidden")}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                <InputField label="Full Name" name="name" form={customerForm} icon={User} />
                <InputField label="Email Address" name="email" type="email" form={customerForm} />
                <InputField label="Phone Number" name="phone" form={customerForm} />
                <div className="md:col-span-2">
                  <InputField label="Street Address" name="street" form={customerForm} icon={MapPin} />
                </div>
                <InputField label="City" name="city" form={customerForm} />
                <InputField label="Postal Code" name="postalCode" form={customerForm} />
              </div>
              <button 
                type="submit"
                className="mt-6 w-full py-3 bg-ceylon-charcoal text-white font-medium rounded-lg hover:bg-ceylon-slate transition-colors"
              >
                Continue to Payment
              </button>
            </form>
          </div>

          {/* Step 2: Payment */}
          <div className={cn(
            "bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 transition-all duration-500",
            step === 1 && "opacity-50 pointer-events-none grayscale"
          )}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 border-b border-gray-100 pb-4 gap-2">
              <h2 className="text-xl font-bold text-ceylon-charcoal flex items-center gap-2">
                <span className="bg-ceylon-charcoal text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">2</span>
                Payment Details
              </h2>
              <div className="flex items-center gap-1.5 text-xs font-medium bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md w-fit">
                <Lock className="w-3 h-3" />
                Simulated — No real charges
              </div>
            </div>

            <form onSubmit={paymentForm.handleSubmit(onPaymentSubmit)} className={cn("transition-all", step === 1 && "hidden")}>
              {paymentError && (
                <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm font-medium">
                  {paymentError}
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                <div className="md:col-span-2">
                  <InputField label="Cardholder Name" name="cardholderName" form={paymentForm} icon={User} />
                </div>
                <div className="md:col-span-2">
                  <InputField label="Card Number" name="cardNumber" form={paymentForm} placeholder="0000 0000 0000 0000" icon={CreditCard} />
                  <p className="text-xs text-gray-500 mb-4 -mt-2">Use any 16-digit number. Avoid ending in '0000' to simulate a successful payment.</p>
                </div>
                <InputField label="Expiry Date" name="expiryDate" form={paymentForm} placeholder="MM/YY" />
                <InputField label="CVV" name="cvv" form={paymentForm} placeholder="123" />
              </div>
              
              <button 
                type="submit"
                disabled={isProcessing}
                className="mt-6 w-full py-4 bg-ceylon-gold text-white font-bold rounded-lg hover:bg-ceylon-gold-light transition-colors shadow-md flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    Pay {formatCurrency(cartTotal)}
                  </>
                )}
              </button>
            </form>
          </div>
          
        </div>

        {/* Order Summary Sidebar */}
        <div className="w-full lg:w-1/3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-24 glass-card">
            <h2 className="text-lg font-bold text-ceylon-charcoal mb-4 border-b border-gray-100 pb-3">Order Summary</h2>
            
            <div className="flex flex-col gap-3 max-h-60 overflow-y-auto pr-2 mb-4">
              {items.map(item => (
                <div key={item.productId} className="flex items-center gap-3">
                  <div className="relative">
                    <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded border border-gray-100" />
                    <span className="absolute -top-2 -right-2 bg-gray-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-800 truncate">{item.name}</h4>
                    <p className="text-xs text-gray-500">{formatCurrency(item.price)} each</p>
                  </div>
                  <div className="font-semibold text-sm">
                    {formatCurrency(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="border-t border-gray-100 pt-4 mt-4 flex flex-col gap-2 mb-4 text-sm">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Coupon Code" 
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-ceylon-gold"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  disabled={step === 1}
                />
              </div>
              <div className="flex justify-between text-gray-600 mt-2">
                <span>Subtotal</span>
                <span>{preview ? formatCurrency(preview.subtotalMinor / 100) : formatCurrency(cartTotal)}</span>
              </div>
              {preview && preview.discountTotalMinor > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(preview.discountTotalMinor / 100)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>{preview ? (preview.shippingCostMinor > 0 ? formatCurrency(preview.shippingCostMinor / 100) : 'Free') : 'Calculated at payment details'}</span>
              </div>
              {preview && preview.taxAmountMinor > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Tax</span>
                  <span>{formatCurrency(preview.taxAmountMinor / 100)}</span>
                </div>
              )}
            </div>
            
            <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
              <span className="font-bold text-lg text-ceylon-charcoal">Total</span>
              <span className="font-bold text-xl text-ceylon-maroon">{preview ? formatCurrency(preview.totalMinor / 100) : formatCurrency(cartTotal)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
