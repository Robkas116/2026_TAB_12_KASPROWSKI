import React from 'react';

interface DeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    itemName?: string;
    isDeleting?: boolean;
}

export default function DeleteModal({ isOpen, onClose, onConfirm, itemName, isDeleting = false }: DeleteModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 transform transition-all">
                <div className="text-center">
                    <svg className="mx-auto mb-4 text-red-500 w-12 h-12" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 11V6m0 8h.01M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>

                    <h3 className="mb-5 text-lg font-normal text-gray-500">
                        Are you sure you want to delete <span className="font-bold text-gray-900">{itemName || 'this item'}</span>?
                    </h3>
                    <p className="text-sm text-gray-400 mb-6">
                        This cannot be undone.
                    </p>

                    <div className="flex justify-center gap-4">
                        <button
                            onClick={onClose}
                            disabled={isDeleting}
                            className="text-gray-500 bg-white hover:bg-gray-100 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 disabled:opacity-50"
                        >
                            No, cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isDeleting}
                            className="text-white bg-red-600 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm inline-flex items-center px-5 py-2.5 text-center disabled:opacity-50"
                        >
                            {isDeleting ? 'Deleting...' : 'Yes, I\'m sure'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}