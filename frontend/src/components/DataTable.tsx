import React from 'react';

interface DataTableProps {
    items: any[];
    onEdit: (item: any) => void;
    onDelete: (item: any) => void;
}

export default function DataTable({ items, onEdit, onDelete }: DataTableProps) {
    if (!items || items.length === 0) {
        return <p className="text-gray-500 py-4 text-center">No data found.</p>;
    }

    const columns = Object.keys(items[0]);

    return (
        <div className="overflow-x-auto bg-blue-200 rounded-lg border border-gray-200">
            <table className="min-w-full text-left text-sm whitespace-nowrap">
                <thead className="uppercase tracking-wider border-b-2 border-gray-200 text-gray-600" >
                    <tr>
                        {columns.map((col) => (
                            <th key={col} scope="col" className="px-6 py-4 border-r border-gray-200 font-semibold text-center ">
                                {col}
                            </th>
                        ))}
                        <th scope="col" className="px-6 py-4 border-gray-200 font-semibold text-center">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, index) => {
                        const rowKey = item.id ? `row-${item.id}` : `row-index-${index}`;
                        return (
                            <tr key={rowKey} className="text-center border-b border-gray-200 hover:bg-blue-300 transition-colors">
                                {columns.map((col) => (
                                    <td key={`${rowKey}-${col}`} className="border-b border-gray-200 text-gray-800">
                                        {/* String conversion */}
                                        {String(item[col] ?? '')}
                                    </td>

                                ))}
                                <td className="px-6 py-4 border-x border-gray-200 text-center space-x-2">
                                    <button
                                        onClick={() => onEdit(item)}
                                        className="inline-flex items-center justify-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => onDelete(item.id)}
                                        className="inline-flex items-center justify-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
