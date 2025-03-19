'use client'

import { Product } from '@/types'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { SetStateAction } from 'react'

interface ProductListProps {
	products: Product[]
	onEdit: (productId: string) => void
	onDelete: (productId: string) => void
	currentPage: number
	setCurrentPage: React.Dispatch<SetStateAction<number>>
}

const ITEMS_PER_PAGE_OPTIONS = 12

const ProductList = ({
	products,
	onEdit,
	onDelete,
	currentPage,
	setCurrentPage,
}: ProductListProps) => {
	const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE_OPTIONS)
	const startIndex = (currentPage - 1) * ITEMS_PER_PAGE_OPTIONS
	const currentProducts = products.slice(
		startIndex,
		startIndex + ITEMS_PER_PAGE_OPTIONS
	)

	return (
		<>
			<div className='grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'>
				{currentProducts.map((product, index) => {
					const imageSrc =
						product.images.length > 0 ? product.images[0] : '/placeholder.jpg'
					const imageUrl = imageSrc.startsWith('/') ? imageSrc : `${imageSrc}`
					return (
						<motion.div
							key={product.id}
							initial={{ opacity: 0, y: 50 }}
							whileInView={{ opacity: 1, y: 0 }}
							transition={{
								duration: 0.5,
								ease: 'easeOut',
								delay: index * 0.1,
							}}
							className='bg-white p-4 shadow-md rounded-lg'
						>
							<div className='flex justify-between'>
								<div>
									<h3 className='text-lg font-semibold mb-3'>
										{product.title}
									</h3>
									<p className='text-gray-600 mb-2'>ID: {product.id}</p>
									<p className='text-gray-600'>Type: {product.type}</p>
								</div>
								<div className='relative w-16 h-20'>
									<Image
										src={imageUrl}
										alt={product.title}
										fill
										className='w-full h-full object-contain object-center rounded-xl'
									/>
								</div>
							</div>

							<div className='mt-4 flex justify-end gap-2'>
								<button
									onClick={() => onEdit(product.id)}
									className='bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors'
								>
									Edit
								</button>
								<button
									onClick={() => onDelete(product.id)}
									className='bg-red-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-600 transition-colors'
								>
									Delete
								</button>
							</div>
						</motion.div>
					)
				})}
			</div>
			{/* Пагинация */}
			{totalPages > 1 && (
				<div className='flex justify-center gap-2 mt-10'>
					<button
						onClick={() => setCurrentPage(1)}
						disabled={currentPage === 1}
						className='p-2 hover:bg-gray-300 disabled:opacity-50'
					>
						First
					</button>
					<button
						onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
						disabled={currentPage === 1}
						className='p-2 hover:bg-gray-300 disabled:opacity-50'
					>
						Prev
					</button>

					{[...Array(totalPages)].map((_, i) => (
						<button
							key={i}
							onClick={() => setCurrentPage(i + 1)}
							className={`px-4 py-1 rounded-full text-[12px] ${
								currentPage === i + 1
									? 'bg-blue-500 text-white'
									: 'bg-gray-200 hover:bg-gray-300'
							}`}
						>
							{i + 1}
						</button>
					))}

					<button
						onClick={() =>
							setCurrentPage(prev => Math.min(prev + 1, totalPages))
						}
						disabled={currentPage === totalPages}
						className='p-2 hover:bg-gray-300 disabled:opacity-50'
					>
						Next
					</button>
					<button
						onClick={() => setCurrentPage(totalPages)}
						disabled={currentPage === totalPages}
						className='p-2 hover:bg-gray-300 disabled:opacity-50'
					>
						Last
					</button>
				</div>
			)}
		</>
	)
}

export default ProductList
