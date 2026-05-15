import type React from "react";
import { useEffect, useState } from "react";
import { OPTIONAL_FIELDS } from "@/lib/forms";
import type { EntityType } from "@/types";

interface EditModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: (updatedData: any) => void;
	entityType: string;
	initialData: any;
}

export default function EditModal({
	isOpen,
	onClose,
	onSuccess,
	entityType,
	initialData,
}: EditModalProps) {
	const [formData, setFormData] = useState<any>({});

	useEffect(() => {
		if (initialData) {
			setFormData({ ...initialData });
		}
	}, [initialData]);

	if (!isOpen || !initialData) return null;

	const fields = Object.keys(initialData).filter((key) => key !== "id"); // Exclude ID from editable fields
	const optionalFieldsForEntity = OPTIONAL_FIELDS[entityType as EntityType] || new Set();

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFormData({
			...formData,
			[e.target.name]: e.target.value,
		});
	};

	const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
		e.preventDefault();
		onSuccess(formData);
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
			<div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
				<div className="flex justify-between items-center mb-5 border-b pb-3">
					<h3 className="text-xl font-bold text-gray-800">
						Edit {entityType.slice(0, -1)}
					</h3>
					<button
						type="button"
						onClick={onClose}
						className="text-gray-400 hover:text-gray-600 transition-colors"
					>
						<svg
							className="w-6 h-6"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					{fields.map((field) => {
						const isOptional = optionalFieldsForEntity.has(field);
						return (
							<div key={field}>
								<label
									htmlFor={field}
									className="block text-sm font-medium text-gray-700 capitalize mb-1"
								>
									{field.replace("_", " ")}
									{isOptional && <span className="text-gray-400 text-xs ml-1">(optional)</span>}
								</label>
								<input
									id={field}
									type="text"
									name={field}
									value={formData[field] || ""}
									onChange={handleChange}
									className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
									required={!isOptional}
								/>
							</div>
						);
					})}
					<div className="flex justify-end gap-3 pt-4 border-t mt-6">
						<button
							type="button"
							onClick={onClose}
							className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
						>
							Cancel
						</button>
						<button
							type="submit"
							className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
						>
							Save Changes
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
