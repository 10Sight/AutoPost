import React from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "../ui/alert-dialog"; // Assuming we install shadcn/ui alert-dialog or build simple one. 
// For now, I'll build a custom simple one to avoid missing shadcn dependency if not present.

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {title}
                </h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-300">
                    {message}
                </p>
                <div className="mt-4 flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;
