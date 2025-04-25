"use client";

import React from "react";
import { useWallet } from "../context/WalletContext";

export function ConnectButton() {
    const { publicKey, connectWallet, disconnectWallet, isConnecting } = useWallet();

    const formatPublicKey = (key: string) => {
        if (!key) return "";
        return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
    };

    return (
        <div className="flex items-center gap-2">
            {!publicKey ? (
                <button
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                    onClick={connectWallet}
                    disabled={isConnecting}
                >
                    {isConnecting ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Connecting...
                        </>
                    ) : (
                        <>Connect Wallet</>
                    )}
                </button>
            ) : (
                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center bg-gray-100 px-3 py-2 rounded-lg">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        <span className="text-sm text-gray-700 font-medium">{formatPublicKey(publicKey)}</span>
                    </div>
                    <button
                        className="bg-white border border-red-500 text-red-500 hover:bg-red-50 font-medium py-2 px-4 rounded-lg transition-all"
                        onClick={disconnectWallet}
                    >
                        Disconnect
                    </button>
                </div>
            )}
        </div>
    );
}