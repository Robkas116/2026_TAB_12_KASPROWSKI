"use client";

import { useEffect, useState } from "react";
import { actionApi } from "@/lib/api/action";
import { equipmentApi } from "@/lib/api/equipment";
import { makeApi } from "@/lib/api/make";
import { setofequipmentApi } from "@/lib/api/set_of_equipment";
import { vehmodelApi } from "@/lib/api/vehmodel";
import { versionApi } from "@/lib/api/version";
import { INITIAL_STATES } from "@/lib/forms";
import type { EntityType } from "@/types";
import DataTable from "./DataTable";
import AddModal from "./modals/AddModal";
import DeleteModal from "./modals/DeleteModal";
import EditModal from "./modals/EditModal";

export default function Dashboard() {
    const [activeTab, setActiveTab] = useState<EntityType>("Makes");
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [itemToEdit, setItemToEdit] = useState<any>(null);

    // Loading data depending on the active tab
    const loadData = async (entity: EntityType) => {
        setLoading(true);
        setError(null);
        setData(null);

        try {
            let result: any;
            switch (entity) {
                case "Makes":
                    result = await makeApi.getAll();
                    break;
                case "Models":
                    result = await vehmodelApi.getAll();
                    break;
                case "Actions":
                    result = await actionApi.getAll();
                    break;
                case "Equipments":
                    result = await equipmentApi.getAll();
                    break;
                case "SetOfEquipments":
                    result = await setofequipmentApi.getAll();
                    break;
                case "Versions":
                    result = await versionApi.getAll();
                    break;
                default:
                    result = { message: `Data for ${entity} not implemented yet.` };
            }
            setData(result);
        } catch (err: any) {
            setError(err.message || "Failed to fetch data.");
        } finally {
            setLoading(false);
        }
    };

    const updateData = async (
        entity: EntityType,
        id: number,
        updatedData: any,
    ) => {
        setLoading(true);
        setError(null);
        try {
            let result: any;
            switch (entity) {
                case "Makes":
                    result = await makeApi.update(id, updatedData);
                    break;
                case "Models":
                    result = await vehmodelApi.update(id, updatedData);
                    break;
                case "Actions":
                    result = await actionApi.update(id, updatedData);
                    break;
                case "Equipments":
                    result = await equipmentApi.update(id, updatedData);
                    break;
                case "SetOfEquipments":
                    result = await setofequipmentApi.update(id, updatedData);
                    break;
                case "Versions":
                    result = await versionApi.update(id, updatedData);
                    break;
                default:
                    alert(`Updating ${entity} is not implemented yet.`);
                    return;
            }
            setIsEditModalOpen(false);
            setItemToEdit(null);
            loadData(activeTab);
        } catch (err: any) {
            alert(`Error updating item: ${err.message}`);
        }
    };

    const addData = async (entity: EntityType, newData: any) => {
        try {
            switch (entity) {
                case "Makes":
                    await makeApi.create(newData);
                    break;
                case "Models":
                    await vehmodelApi.create(newData);
                    break;
                case "Actions":
                    await actionApi.create(newData);
                    break;
                case "Equipments":
                    await equipmentApi.create(newData);
                    break;
                case "SetOfEquipments":
                    await setofequipmentApi.create(newData);
                    break;
                case "Versions":
                    await versionApi.create(newData);
                    break;
                default:
                    alert(`Adding ${entity} is not implemented yet.`);
                    return;
            }
            setIsAddModalOpen(false);
            loadData(activeTab);
        } catch (err: any) {
            alert(`Error adding item: ${err.message}`);
        }
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;

        setIsDeleting(true);
        try {
            await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API delay
            switch (activeTab) {
                case "Makes":
                    await makeApi.delete(itemToDelete.id);
                    break;
                case "Models":
                    await vehmodelApi.delete(itemToDelete.id);
                    break;
                case "Actions":
                    await actionApi.delete(itemToDelete.id);
                    break;
                case "Equipments":
                    await equipmentApi.delete(itemToDelete.id);
                    break;
                case "SetOfEquipments":
                    await setofequipmentApi.delete(itemToDelete.id);
                    break;
                case "Versions":
                    await versionApi.delete(itemToDelete.id);
                    break;
                default:
                    alert(`Deleting ${activeTab} is not implemented yet.`);
                    setIsDeleting(false);
                    setIsDeleteModalOpen(false);
                    return;
            }

            setIsDeleteModalOpen(false);
            setItemToDelete(null);
            loadData(activeTab);
        } catch (err: any) {
            alert(`Error deleting item: ${err.message}`);
        } finally {
            setIsDeleting(false);
        }
    };

    // changing active tab
    useEffect(() => {
        loadData(activeTab);
    }, [activeTab]);

    const tabs: EntityType[] = [
        "Makes",
        "Vehicles",
        "Workers",
        "Reservations",
        "Actions",
        "Models",
        "Equipments",
        "SetOfEquipments",
        "Versions",
    ];

    const handleEditClick = (item: any) => {
        setItemToEdit(item);
        setIsEditModalOpen(true);
    };

    const handleDeleteClick = (id: number) => {
        const items = Array.isArray(data) ? data : data?.items || data?.data || [];
        const item = items.find((i: any) => i.id === id);
        setItemToDelete(item);
        setIsDeleteModalOpen(true);
    };

    const handleAddNewClick = () => {
        switch (activeTab) {
            case "Makes":
            case "Models":
            case "Actions":
            case "Equipments":
            case "SetOfEquipments":
            case "Versions":
                setIsAddModalOpen(true);
                break;
            default:
                alert(`Adding new ${activeTab.slice(0, -1)} is not implemented yet.`);
        }
    };

    return (
        <div className="max-w-5xl">
            <h2 className="text-3xl font-bold mb-6">Fleet Data Manager</h2>

            {/* Tab Navigation */}
            <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-200 pb-4">
                {tabs.map((tab) => (
                    <button
                        type="button"
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-2 rounded-t-lg font-semibold transition-colors ${activeTab === tab
                                ? "bg-blue-600 text-white border-b-4 border-blue-800"
                                : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Showing Results */}
            <div className="bg-gray-300 p-6 rounded-lg shadow-md border border-gray-200 min-h-75">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-800">
                        Viewing: <span className="text-blue-600">{activeTab}</span>
                    </h3>

                    <button
                        type="button"
                        onClick={handleAddNewClick}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium"
                    >
                        + Add New {activeTab.slice(0, -1)}
                    </button>
                </div>

                {loading && (
                    <div className="flex items-center gap-2 text-blue-500">
                        <div className="w-5 h-5 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
                        Loading data...
                    </div>
                )}

                {error && (
                    <div className="p-4 bg-red-50 text-red-600 rounded border border-red-200">
                        <strong>Error:</strong> {error}
                    </div>
                )}

                {!loading && !error && data && (
                    <div className="space-y-4">
                        {/* Showing results */}
                        {data.total !== undefined && (
                            <p className="text-sm text-gray-500 font-medium">
                                Total records: {data.total}
                            </p>
                        )}
                        <DataTable
                            items={Array.isArray(data) ? data : data.items || data.data || []}
                            onEdit={handleEditClick}
                            onDelete={handleDeleteClick}
                        ></DataTable>
                    </div>
                )}
            </div>
            <AddModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                entityType={activeTab}
                onSuccess={(newData) => addData(activeTab, newData)}
                initialState={INITIAL_STATES[activeTab]}
            />
            <DeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setItemToDelete(null);
                }}
                onConfirm={confirmDelete}
                itemName={itemToDelete?.name}
                isDeleting={isDeleting}
            />
            <EditModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setItemToEdit(null);
                }}
                onSuccess={(updatedData) => {
                    updateData(activeTab, itemToEdit.id, updatedData);
                }}
                entityType={activeTab}
                initialData={itemToEdit}
            />
        </div>
    );
}
