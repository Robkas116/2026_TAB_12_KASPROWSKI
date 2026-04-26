"use client";

import { useState, useEffect } from "react";
import { makeApi } from "@/lib/api/make";
import { workerApi } from "@/lib/api/worker";

interface AddModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    entityType: EntityType;
}

type EntityType = "Makes" | "Vehicles" | "Workers" | "Reservations" | "Actions";

interface FormField {
    name: string;
    label: string;
    type: string;
    placeholder: string;
}

const entityConfig: Record<string, { title: string; fields: FormField[] }> = {
    Makes: {
        title: "Add New Make",
        fields: [
            { name: "name", label: "Make Name", type: "text", placeholder: "e.g. Toyota, Ford" },
        ],
    },
    Workers: {
        title: "Add New Worker",
        fields: [
            { name: "name", label: "Full Name", type: "text", placeholder: "e.g. Jan Kowalski" },
            { name: "email", label: "Email Address", type: "email", placeholder: "jan@firma.pl" },
        ],
    },
    Vehicles: {
        title: "Add New Vehicle",
        fields: [
            { name: "state", label: "Initial State", type: "text", placeholder: "e.g. Available" },
            // Dropdown for vehmodel
        ],
    },
    // Reservations: {}
};




export default function AddModal({ isOpen, onClose, onSuccess, entityType }: AddModalProps) {
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const config = entityConfig[entityType];

    useEffect(() => {
        if (isOpen) {
            setFormData({});
            setError(null);
        }
    }, [isOpen, entityType]);

    if (!isOpen) return null;


    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.ChangeEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            switch (entityType) {
                case "Makes":
                    await makeApi.create(formData as { name: string });
                    break;
                case "Workers":
                    throw new Error("Worker creation not implemented yet.")
                case "Vehicles":
                    throw new Error("Vehicle creation not fully implemented yet.");
                default:
                    throw new Error(`Creating ${entityType} is not supported yet.`);
            }
                onSuccess(); 
                onClose();   
            } catch (err: any) {
                setError(err.message || "Failed to create Make.");
            } finally {
                setIsLoading(false);
            }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-800"> {config?.title} </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="space-y-4">
                        {config.fields.map((field) => (
                            <div key={field.name}>
                                <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 mb-1">
                                    {field.label}
                                </label>
                                <input
                                    type={field.type}
                                    id={field.name}
                                    name={field.name}
                                    value={formData[field.name] || ""}
                                    onChange={handleChange}
                                    placeholder={field.placeholder}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900"
                                    disabled={isLoading}
                                    required
                                />
                            </div>
                        ))}
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded border border-red-200">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 mt-8">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isLoading}
                            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {isLoading ? "Saving..." : "Save"}
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
}
