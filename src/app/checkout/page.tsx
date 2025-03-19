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
		const deliveryAddress = shippingData
		const deliveryAddressId = localStorage.getItem('deliveryAddressId')
		const cartItems = cart.map(product => ({
			id: product.id,
			quantity: product.quantity,
			selectedColor: product.selectedColor || '',
		}))

		console.log('deliveryAddress:', deliveryAddress)
		console.log('deliveryAddressId:', deliveryAddressId)

		const newOrder = {
			userId: userId,
			productIds: productIds,
			cartItems,
			status: 'Pending',
			createAt: new Date().toISOString(),
			updateAt: new Date().toISOString(),
			deliveryAddressId,
		}

		console.log(newOrder)

		try {
			const storeResponse = await fetch('/api/order', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'user-id': userId,
				},
				body: JSON.stringify(newOrder),
			})

			if (!storeResponse.ok) {
				throw new Error('Failed to create order in store')
			}

			const storeOrder = await storeResponse.json()

			const crmResponse = await fetch('http://localhost:4444/api/orders', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					shopId: shopId,
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
					productName: cart.map(item => item.title).join(', '),
					paymentType: 'card',
					deliveryAddressId: storeOrder.deliveryAddressId || deliveryAddressId,
				}),
			})

			if (!crmResponse.ok) {
				throw new Error('Failed to send order to CRM')
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
