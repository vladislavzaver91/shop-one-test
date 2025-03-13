import { PrismaClient } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

const UserSchema = z.object({
	email: z.string().email(),
	password: z.string().min(8, 'Password must be at least 8 characters'),
})

export async function POST(request: NextRequest) {
	try {
		// Читаем тело запроса один раз
		const body = await request.json()
		console.log('Login request body:', body)

		// Парсим тело с помощью Zod
		const { email, password } = UserSchema.parse(body)
		console.log('Parsed email:', email)

		const existingUser = await prisma.user.findUnique({ where: { email } })
		console.log('Found user:', existingUser)
		if (!existingUser) {
			return NextResponse.json(
				{ error: 'User does not exist' },
				{ status: 400 }
			)
		}

		console.log('User password from DB:', existingUser.password)
		const isPasswordValid = await bcrypt.compare(
			password,
			existingUser.password
		)
		console.log('Password valid:', isPasswordValid)
		if (!isPasswordValid) {
			return NextResponse.json(
				{ error: 'Invalid email or password' },
				{ status: 401 }
			)
		}

		const accessToken = jwt.sign(
			{ userId: existingUser.id },
			process.env.JWT_SECRET!,
			{ expiresIn: '15m' }
		)
		const refreshToken = jwt.sign(
			{ userId: existingUser.id },
			process.env.JWT_SECRET!,
			{ expiresIn: '7d' }
		)

		console.log('Generated tokens:', { accessToken, refreshToken })

		await prisma.user.update({
			where: { id: existingUser.id },
			data: { accessToken, refreshToken },
		})

		return NextResponse.json(
			{
				user: {
					id: existingUser.id,
					email: existingUser.email,
					name: existingUser.name,
					shopId: existingUser.shopId,
				},
				accessToken,
				refreshToken,
			},
			{ status: 200 }
		)
	} catch (error) {
		console.error('Error logging in user:', error)
		return NextResponse.json(
			{ error: 'Failed to login user', details: error },
			{ status: 500 }
		)
	} finally {
		await prisma.$disconnect()
	}
}
