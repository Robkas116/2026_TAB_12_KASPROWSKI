import { useEffect, useState } from "react";
import { OPTIONAL_FIELDS } from "@/lib/forms";
import type { EntityType } from "@/types";

interface AddModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (newData: any) => void;
    entityType: string;
    initialState: any;
}

export default function AddModal({
    isOpen,
    onClose,
    onSuccess,
    entityType,
    initialState,
}: AddModalProps) {
    const [formData, setFormData] = useState<any>({});

    useEffect(() => {
        if (isOpen && initialState) {
            setFormData({ ...initialState });
        }
    }, [isOpen, initialState]);

    if (!isOpen || !initialState) return null;

    const fields = Object.keys(initialState);
    const optionalFieldsForEntity = OPTIONAL_FIELDS[entityType as EntityType] || new Set();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = (e: React.ChangeEvent<HTMLFormElement>) => {
        e.preventDefault();
        const normalizedData = Object.fromEntries(
            Object.entries(formData).map(([key, value]) => {
                if (key.endsWith("_id") && value !== "") {
                    return [key, Number(value)];
                }

                return [key, value];
            }),
        );

        onSuccess(normalizedData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-800">
                        Add new {entityType.slice(0, -1)}
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

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
                                    type={field.endsWith("_id") ? "number" : "text"}
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
                            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
                        >
                            Save
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
