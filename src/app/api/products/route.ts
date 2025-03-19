import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
	try {
		const data = await request.json()
		console.log('Received data:', data) // Логируем входящие данные

		const product = await prisma.product.create({
			data: {
				...data,
				attributes: data.attributes || [],
			},
		})
		console.log('Product created:', product) // Логируем сохранённый продукт

		return NextResponse.json(product, { status: 201 })
	} catch (error) {
		console.error('Error creating product:', error)
		return NextResponse.json(
			{ error: 'Failed to create product' },
			{ status: 500 }
		)
	} finally {
		await prisma.$disconnect()
	}
}

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url)
		const page = parseInt(searchParams.get('page') || '1')
		const limit = parseInt(searchParams.get('limit') || '999999999')
		const category = searchParams.get('category')
		const minPrice = parseFloat(searchParams.get('minPrice') || '0')
		const maxPrice = parseFloat(searchParams.get('maxPrice') || '999999999')
		const sortBy = searchParams.get('sortBy') || 'createdAt'

		const skip = (page - 1) * limit

		const where = {
			category: category ? { equals: category } : undefined,
			price: { gte: minPrice, lte: maxPrice },
		}

		const [products, totalCount] = await Promise.all([
			prisma.product.findMany({
				where,
				skip,
				take: limit,
				orderBy: { [sortBy]: 'asc' },
			}),
			prisma.product.count({ where }),
		])

		if (products.length === 0) {
			return NextResponse.json(
				{ message: 'No products found' },
				{ status: 404 }
			)
		}

		const totalPages = Math.ceil(totalCount / limit)
		console.log(products)

		return NextResponse.json({
			products,
			meta: {
				currentPage: page,
				totalPages,
				totalCount,
				limit,
			},
		})
	} catch (error) {
		console.error('Error fetching products:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch products' },
			{ status: 500 }
		)
	} finally {
		await prisma.$disconnect()
	}
}
