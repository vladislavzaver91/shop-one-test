/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import useCategoryDropDownOnAdmin from '@/helpers/hooks/useCategoryDropDownOnAdmin'
import useColorDropdownOnAdmin from '@/helpers/hooks/useColorDropdownOnAdmin'
import { COLORS } from '@/helpers/variables/colors'
import { Product } from '@/types'
import { motion } from 'framer-motion'
import {
	ChevronDown,
	ChevronUp,
	CircleMinus,
	CirclePlus,
	X,
} from 'lucide-react'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

interface CreateProductFormProps {
	onCreate: (newProduct: {
		name: string // Missing from the original Product type in ProductPage
		id: string
		type: 'Digital' | 'Physical'
		title: string
		description: string
		price: number
		category: string
		images: string[]
		colorsAvailable: string[]
		attributes: string[]
		color: string // Also missing
		quantity: number
		weight?: number | null // Убедитесь, что weight не может быть undefined
		dimensions?: string | null // То же для dimensions
		createdAt: Date
		updatedAt: Date
	}) => void
	onCancel: () => void
	editingProduct?: Product | null
}

const PRODUCT_TYPES = [
	{ value: 'Digital', label: 'Digital' },
	{ value: 'Physical', label: 'Physical' },
]

type ProductType = 'Digital' | 'Physical'

const CreateProductForm = ({
	onCreate,
	onCancel,
	editingProduct = null,
}: CreateProductFormProps) => {
	const {
		register,
		handleSubmit,
		watch,
		setValue,
		reset,
		formState: { errors },
	} = useForm({
		defaultValues: editingProduct || {
			type: 'Digital' as ProductType,
			title: '',
			description: '',
			price: 0,
			category: '',
			attributes: [] as string[],
			images: [] as string[],
			colorsAvailable: [] as string[],
			quantity: 0,
			weight: null,
			dimensions: '',
		},
	})

	const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState<boolean>(false)
	const [attributes, setAttributes] = useState<string[]>([])
	const [selectedFiles, setSelectedFiles] = useState<File[]>([])
	const [previews, setPreviews] = useState<string[]>([])
	const [colorInput, setColorInput] = useState<string>('')

	const { isColorDropdownOpen, setIsColorDropdownOpen, dropdownRef } =
		useColorDropdownOnAdmin()

	const {
		categoryDropdownRef,
		categoryInput,
		setCategoryInput,
		categories,
		setCategories,
		setIsCategoryDropdownOpen,
		isCategoryDropdownOpen,
	} = useCategoryDropDownOnAdmin()

	useEffect(() => {
		if (editingProduct) {
			Object.keys(editingProduct).forEach(key => {
				setValue(key as keyof Product, editingProduct[key as keyof Product])
			})
			setPreviews(editingProduct.images)
			setAttributes(editingProduct.attributes || [])
			setValue('attributes', editingProduct.attributes || [])
			if (editingProduct.category) {
				setCategoryInput(editingProduct.category)
				if (!categories.includes(editingProduct.category)) {
					setCategories(prev => [editingProduct.category, ...prev])
				}
			}
		}
	}, [editingProduct, setValue, setCategories, setCategoryInput, categories])

	const addAttribute = () => {
		setAttributes(prev => [...prev, ''])
	}

	const updateAttribute = (index: number, value: string) => {
		setAttributes(prev => prev.map((attr, i) => (i === index ? value : attr)))
	}

	const removeAttribute = (index: number) => {
		setAttributes(prev => prev.filter((_, i) => i !== index))
	}

	const onSubmit = async (data: any) => {
		setValue('attributes', attributes)
		const currentImages = watch('images') // Получаем текущие изображения из формы
		const productToSave = {
			...data,
			attributes,
			images: currentImages, // Явно добавляем images
			id: editingProduct ? editingProduct.id : `product-${Date.now()}`,
			createdAt: editingProduct ? editingProduct.createdAt : new Date(),
			updatedAt: new Date(),
		}

		try {
			if (editingProduct) {
				const res = await fetch(`/api/products/${editingProduct.id}`, {
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(productToSave),
				})
				if (!res.ok) throw new Error('Failed to update product')
			} else {
				const res = await fetch('/api/products', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(productToSave),
				})
				if (!res.ok) throw new Error('Failed to create product')
			}

			onCreate(productToSave)
			reset()
			setAttributes([])
			setSelectedFiles([])
			setPreviews([])
		} catch (error) {
			console.error('Error submitting form:', error)
		}
	}

	const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files
		if (!files) return

		const filesArray = Array.from(files)
		const previewUrls = filesArray.map(file => URL.createObjectURL(file))

		setSelectedFiles(prev => [...prev, ...filesArray])
		setPreviews(prev => [...prev, ...previewUrls])

		const formData = new FormData()
		filesArray.forEach(file => formData.append('file', file))

		try {
			const res = await fetch('/api/products/upload', {
				method: 'POST',
				body: formData,
			})

			if (!res.ok) {
				throw new Error(`File upload failed with status: ${res.status}`)
			}

			const { urls } = await res.json()
			setValue('images', [...watch('images'), ...urls])
		} catch (error) {
			console.error('Error uploading files:', error)
			setPreviews(prev => prev.slice(0, prev.length - filesArray.length))
		}
	}

	const handleRemoveImage = (index: number) => {
		setSelectedFiles(prev => prev.filter((_, i) => i !== index))
		setPreviews(prev => prev.filter((_, i) => i !== index))
		setValue(
			'images',
			watch('images').filter((_, i) => i !== index)
		)
	}

	return (
		<motion.form
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3, delay: 0.2 }}
			onSubmit={handleSubmit(onSubmit)}
			className='space-y-6 bg-white rounded-xl shadow-md p-6'
		>
			<h2 className='text-2xl mb-4'>
				{editingProduct ? 'Edit Product' : 'Create New Product'}
			</h2>

			{/* title */}
			<div>
				<label
					htmlFor='title'
					className='font-[family-name:var(--font-nunito-sans)] tracking-wider block text-sm font-medium text-gray-700'
				>
					Title
				</label>
				<input
					id='title'
					{...register('title', { required: 'Title is required' })}
					placeholder='Enter title'
					className='w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500'
				/>
				{errors.title && <p className='text-red-500'>{errors.title.message}</p>}
			</div>

			{/* description */}
			<div>
				<label
					htmlFor='description'
					className='font-[family-name:var(--font-nunito-sans)] tracking-wider block text-sm font-medium text-gray-700'
				>
					Description
				</label>
				<textarea
					id='description'
					{...register('description', { required: 'Description is required' })}
					placeholder='Enter description'
					className='w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500'
				/>
				{errors.description && (
					<p className='text-red-500'>{errors.description.message}</p>
				)}
			</div>

			<div className='grid gap-6 md:grid-cols-2 md:gap-5'>
				{/* price */}
				<div>
					<label
						htmlFor='price'
						className='font-[family-name:var(--font-nunito-sans)] tracking-wider block text-sm font-medium text-gray-700'
					>
						Price
					</label>
					<input
						id='price'
						type='number'
						{...register('price', {
							required: 'Price is required',
							valueAsNumber: true,
						})}
						placeholder='Enter price'
						className='w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500'
					/>
					{errors.price && (
						<p className='text-red-500'>{errors.price.message}</p>
					)}
				</div>

				{/* quantity */}
				<div>
					<label
						htmlFor='quantity'
						className='font-[family-name:var(--font-nunito-sans)] tracking-wider block text-sm font-medium text-gray-700'
					>
						Quantity
					</label>
					<input
						id='quantity'
						type='number'
						{...register('quantity', { required: true, valueAsNumber: true })}
						placeholder='Enter quantity'
						className='w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500'
					/>
					{errors.quantity && (
						<p className='text-red-500'>Quantity is required</p>
					)}
				</div>

				{/* type */}
				<div className='relative'>
					<label className='block text-sm font-medium text-gray-700 mb-1'>
						Product Type
					</label>
					<div
						className='w-full p-3 bg-gray-50 rounded-lg border flex justify-between items-center cursor-pointer'
						onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
					>
						<span className={watch('type') ? '' : 'text-gray-400'}>
							{PRODUCT_TYPES.find(t => t.value === watch('type'))?.label ||
								'Select type'}
						</span>
						{isTypeDropdownOpen ? (
							<ChevronUp className='w-5 h-5 text-gray-500' />
						) : (
							<ChevronDown className='w-5 h-5 text-gray-500' />
						)}
					</div>
					<motion.ul
						initial={{ opacity: 0, y: -10 }}
						animate={{
							opacity: isTypeDropdownOpen ? 1 : 0,
							y: isTypeDropdownOpen ? 0 : -10,
						}}
						className={`absolute top-14 left-0 right-0 bg-white border rounded-lg shadow-lg overflow-hidden z-20 ${
							isTypeDropdownOpen ? 'block' : 'hidden'
						}`}
					>
						{PRODUCT_TYPES.map(type => (
							<li
								key={type.value}
								className='px-4 py-2 hover:bg-gray-100 cursor-pointer'
								onClick={() => {
									setValue('type', type.value as ProductType)
									setIsTypeDropdownOpen(false)
								}}
							>
								{type.label}
							</li>
						))}
					</motion.ul>
				</div>

				{/* category */}
				<div className='relative' ref={categoryDropdownRef}>
					<label className='block text-sm font-medium text-gray-700'>
						Category
					</label>
					<div className='relative'>
						<input
							type='text'
							placeholder='Select category'
							value={categoryInput}
							onFocus={() => setIsCategoryDropdownOpen(true)}
							className='w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500'
						/>
						{isCategoryDropdownOpen && (
							<ul className='absolute left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-20 max-h-48 overflow-auto'>
								{categories
									.filter(category => category !== categoryInput)
									.map((category, index) => (
										<li
											key={index}
											className='px-4 py-2 hover:bg-gray-100 cursor-pointer'
											onClick={() => {
												setValue('category', category)
												setCategoryInput(category)
												setIsCategoryDropdownOpen(false)
											}}
										>
											{category}
										</li>
									))}
							</ul>
						)}
					</div>
				</div>

				{/* weight */}
				<div>
					<label
						htmlFor='weight'
						className='font-[family-name:var(--font-nunito-sans)] tracking-wider block text-sm font-medium text-gray-700'
					>
						Weight
					</label>
					<input
						id='weight'
						type='number'
						{...register('weight', { valueAsNumber: true })}
						placeholder='Enter weight (optional)'
						className='w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500'
					/>
				</div>

				{/* dimensions */}
				<div>
					<label
						htmlFor='dimensions'
						className='font-[family-name:var(--font-nunito-sans)] tracking-wider block text-sm font-medium text-gray-700'
					>
						Dimensions
					</label>
					<input
						id='dimensions'
						{...register('dimensions')}
						placeholder='Enter dimensions (optional, e.g. LxWxH)'
						className='w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500'
					/>
				</div>
			</div>

			{/* attributes */}
			<div>
				<div className='flex items-end gap-2 mb-2'>
					<label
						htmlFor='attributes'
						className='block text-sm font-medium text-gray-700'
					>
						Attributes
					</label>
					<button
						type='button'
						onClick={addAttribute}
						className='mt-2 text-blue-500 hover:text-blue-700 font-medium transition-colors'
					>
						<CirclePlus />
					</button>
				</div>

				<div className='grid sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-7 gap-2'>
					{attributes.map((attr, index) => (
						<div key={index} className='flex items-center gap-2'>
							<input
								type='text'
								value={attr}
								onChange={e => updateAttribute(index, e.target.value)}
								placeholder='Enter attribute'
								className='w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500'
							/>
							<button
								type='button'
								onClick={() => removeAttribute(index)}
								className='text-red-500 hover:text-red-700 transition-colors'
							>
								<CircleMinus className='w-5 h-5' />
							</button>
						</div>
					))}
				</div>
			</div>

			{/* upload image */}
			<div>
				<label className='block text-sm font-medium text-gray-700 mb-2'>
					Upload Images
				</label>
				<div className='relative flex items-center space-x-4'>
					<label
						htmlFor='images'
						className='cursor-pointer bg-blue-500 text-white py-2 px-4 rounded-lg shadow-md hover:bg-blue-600 transition'
					>
						Choose Files
					</label>
					<span className='text-gray-500 text-sm'>
						{selectedFiles.length > 0
							? `${selectedFiles.length} file(s) selected`
							: 'No file chosen'}
					</span>
					<input
						id='images'
						type='file'
						multiple
						onChange={handleImageUpload}
						className='hidden'
					/>
				</div>

				{previews.length > 0 && (
					<div className='mt-4 grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-7 gap-4'>
						{previews.map((src, index) => (
							<div key={index} className='relative group h-24 w-40'>
								<Image
									src={src}
									alt={`Preview ${index}`}
									fill
									className='w-full h-24 object-contain object-center rounded-lg border'
								/>
								{/* remove btn */}
								<button
									type='button'
									onClick={() => handleRemoveImage(index)}
									className='absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-75 hover:opacity-100 transition'
								>
									<X className='w-4 h-4' />
								</button>
							</div>
						))}
					</div>
				)}
			</div>

			{/* available Colors */}
			{watch('type') === 'Physical' && (
				<div className='relative' ref={dropdownRef}>
					<label className='block text-sm font-medium text-gray-700'>
						Available colors
					</label>
					<div className='relative max-w-52 w-full'>
						<input
							type='text'
							placeholder='Select a color'
							value={colorInput}
							onChange={e => setColorInput(e.target.value)}
							onFocus={() => setIsColorDropdownOpen(true)}
							className='w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500'
						/>
						{isColorDropdownOpen && (
							<ul className='absolute left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-20 max-h-48 overflow-auto'>
								{Object.keys(COLORS)
									.filter(color => !watch('colorsAvailable').includes(color))
									.map((color, index) => (
										<li
											key={index}
											className='flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer'
											onClick={() => {
												setValue('colorsAvailable', [
													...watch('colorsAvailable'),
													color,
												])
												setIsColorDropdownOpen(false)
											}}
										>
											<span
												className='w-4 h-4 rounded-full mr-2 border'
												style={{
													backgroundColor: COLORS[color as keyof typeof COLORS],
												}}
											></span>
											{color}
										</li>
									))}
							</ul>
						)}
					</div>

					{/* Выбранные цвета */}
					<div className='flex flex-wrap gap-2 mt-2'>
						{watch('colorsAvailable').map((color, index) => (
							<div
								key={index}
								className='flex items-center space-x-2 bg-gray-200 px-3 py-1 rounded-lg'
							>
								<span
									className='w-4 h-4 rounded-full border'
									style={{
										backgroundColor: COLORS[color as keyof typeof COLORS],
									}}
								></span>
								<span>{color}</span>
								<button
									type='button'
									onClick={() => {
										setValue(
											'colorsAvailable',
											watch('colorsAvailable').filter(c => c !== color)
										)
									}}
									className='text-red-500'
								>
									<X className='w-4 h-4' />
								</button>
							</div>
						))}
					</div>
				</div>
			)}

			<motion.button
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.3 }}
				type='submit'
				className='bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors'
			>
				{editingProduct ? 'Update Product' : 'Save Product'}
			</motion.button>
			<motion.button
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.3 }}
				type='button'
				onClick={onCancel}
				className='ml-4 bg-gray-500 hover:bg-gray-700 transition-colors text-white px-4 py-3 font-medium rounded-lg'
			>
				Cancel
			</motion.button>
		</motion.form>
	)
}

export default CreateProductForm
