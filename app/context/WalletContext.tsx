"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getPublicKey, connect, disconnect } from "../stellar-wallet-kit";

interface WalletContextType {
    publicKey: string | null;
    connectWallet: () => Promise<void>;
    disconnectWallet: () => Promise<void>;
    isConnecting: boolean;
}

const WalletContext = createContext<WalletContextType>({
    publicKey: null,
    connectWallet: async () => { },
    disconnectWallet: async () => { },
    isConnecting: false,
});

export const useWallet = () => useContext(WalletContext);

interface WalletProviderProps {
    children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
    const [publicKey, setPublicKey] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState<boolean>(false);

    useEffect(() => {
        const checkExistingConnection = async () => {
            try {
                const pubKey = await getPublicKey();
                if (pubKey) {
                    setPublicKey(pubKey);
                }
            } catch (error) {
                console.error("Failed to check existing wallet connection:", error);
            }
        };

        checkExistingConnection();
    }, []);

    const connectWallet = async () => {
        setIsConnecting(true);
        try {
            await connect(async () => {
                const pubKey = await getPublicKey();
                setPublicKey(pubKey);
            });
        } catch (error) {
            console.error("Failed to connect wallet:", error);
        } finally {
            setIsConnecting(false);
        }
    };

    const disconnectWallet = async () => {
        try {
            await disconnect(async () => {
                setPublicKey(null);
            });
        } catch (error) {
            console.error("Failed to disconnect wallet:", error);
        }
    };

    return (
        <WalletContext.Provider
            value={{ publicKey, connectWallet, disconnectWallet, isConnecting }}
        >
            {children}
        </WalletContext.Provider>
    );
};