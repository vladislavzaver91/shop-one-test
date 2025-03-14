'use client'

import {
	Dialog,
	DialogPanel,
	DialogTitle,
	Transition,
	TransitionChild,
} from '@headlessui/react'
import { Fragment, ReactNode } from 'react'

interface ModalProps {
	isOpen: boolean
	close: (isOpen: boolean) => void
	title: string
	children: ReactNode
	actions?: ReactNode
	className?: string
}

const Modal = ({
	isOpen,
	close,
	title,
	children,
	actions,
	className,
}: ModalProps) => {
	return (
		<Transition show={isOpen} as={Fragment}>
			<Dialog as='div' className='relative z-10' onClose={() => close(false)}>
				backdrop
				<TransitionChild
					as={Fragment}
					enter='ease-out duration-300'
					enterFrom='opacity-0'
					enterTo='opacity-100'
					leave='ease-in duration-200'
					leaveFrom='opacity-100'
					leaveTo='opacity-0'
				>
					<div className='fixed inset-0 bg-black bg-opacity-50' />
				</TransitionChild>
				<div className='fixed inset-0 z-10 flex items-center justify-center p-6'>
					<TransitionChild
						as={Fragment}
						enter='ease-out duration-300'
						enterFrom='opacity-0 scale-95'
						enterTo='opacity-100 scale-100'
						leave='ease-in duration-200'
						leaveFrom='opacity-100 scale-100'
						leaveTo='opacity-0 scale-95'
					>
						<DialogPanel
							className={`w-full ${className} rounded-xl bg-white p-6 shadow-xl transition-all`}
						>
							<DialogTitle
								as='h3'
								className='text-lg font-medium text-gray-900'
							>
								{title}
							</DialogTitle>
							<div className='mt-4'>{children}</div>
							<div className='mt-6 flex justify-end space-x-4'>{actions}</div>
						</DialogPanel>
					</TransitionChild>
				</div>
			</Dialog>
		</Transition>
	)
}

export default Modal
