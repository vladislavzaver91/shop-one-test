'use client'

import { useCart } from '@/helpers/context/CartContext'
import { Address } from '@/types'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const ShippingForm = dynamic(
	() => import('../../components/checkout/ShippingForm'),
	{
		ssr: false,
	}
)

export default function CheckoutPage() {
	const [step, setStep] = useState(1)
	const [shippingData, setShippingData] = useState<Address | null>(null)
	const { cart, clearCart } = useCart()
	const router = useRouter()

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const handleShippingSubmit = (data: any) => {
		setShippingData(data)
		setStep(2)
	}

	const handleCompleteOrder = async () => {
		if (!shippingData || cart.length === 0) {
			console.log('Please, fill in all details.')
			router.push('/checkout/cancel')
			return
		}

		const userId = localStorage.getItem('userId')
		const shopId = localStorage.getItem('shopId')
		if (!userId || !shopId) {
			console.log('User ID or Shop ID not found')
			router.push('/checkout/cancel')
			return
		}

		const productIds = cart.map(product => product.id)
		const deliveryAddressId =
			localStorage.getItem('deliveryAddressId') || crypto.randomUUID()
		const cartItems = cart.map(product => ({
			id: product.id,
			quantity: product.quantity,
			selectedColor: product.selectedColor || '',
			title: product.title,
			price: product.price,
		}))

		console.log('deliveryAddressId:', deliveryAddressId)

		const newOrder = {
			userId,
			productIds,
			cartItems,
			status: 'Pending',
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			deliveryAddressId,
		}

		console.log(newOrder)

		try {
			// 1. Создание заказа в магазине
			const storeResponse = await fetch('/api/order', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'user-id': userId,
				},
				body: JSON.stringify(newOrder),
			})

			if (!storeResponse.ok) {
				throw new Error(
					`Failed to create order in store: ${storeResponse.status}`
				)
			}

			const storeOrder = await storeResponse.json()

			// 2. Создание адреса в crm-shop-backend
			const crmAddressResponse = await fetch(
				'http://localhost:4444/api/addresses',
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						id: deliveryAddressId,
						shopId,
						name: shippingData.name || 'Unknown',
						address: shippingData.address || 'Unknown',
						city: shippingData.city || 'Unknown',
						postalCode: shippingData.postalCode || 'Unknown',
						country: shippingData.country || 'Unknown',
						isDefault: shippingData.isDefault || false,
					}),
				}
			)

			if (!crmAddressResponse.ok) {
				throw new Error(
					`Failed to create address in CRM: ${await crmAddressResponse.text()}`
				)
			}

			// 3. Создание заказа в crm-shop-backend
			const crmOrderData = {
				storeOrderId: storeOrder.id, // Сохраняем ID заказа из магазина
				shopId,
				completedAt: null,
				deviceName: 'Web',
				totalPrice: cart.reduce(
					(sum, item) => sum + item.price * item.quantity,
					0
				),
				productQuantityOrdered: cart.reduce(
					(sum, item) => sum + item.quantity,
					0
				),
				productQuantityDelivered: 0,
				orderItems: cartItems.map(item => ({
					productId: item.id,
					productName: item.title,
					quantity: item.quantity,
					selectedColor: item.selectedColor,
					price: item.price,
				})),
				paymentType: 'card',
				deliveryAddressId,
				createdAt: newOrder.createdAt,
				updatedAt: newOrder.updatedAt,
			}

			const crmResponse = await fetch('http://localhost:4444/api/orders', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(crmOrderData),
			})

			if (!crmResponse.ok) {
				throw new Error(
					`Failed to send order to CRM: ${await crmResponse.text()}`
				)
			}

			console.log('Order created and sent to CRM!')
			clearCart()
			setShippingData(null)
			router.push('/checkout/success')
		} catch (error) {
			console.error('Error completing order:', error)
			router.push('/checkout/cancel')
		}
	}

	return (
		<section className='heading-section'>
			<div className='max-w-2xl mx-auto p-6 space-y-6'>
				{step === 1 && <ShippingForm onSubmit={handleShippingSubmit} />}
				{step === 2 && (
					<button
						onClick={handleCompleteOrder}
						className='w-full py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition duration-200 shadow-md'
					>
						Complete Order
					</button>
				)}
			</div>
		</section>
	)
}
