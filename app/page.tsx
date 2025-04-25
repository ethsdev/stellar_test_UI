"use client";

import React, { useState } from "react";
import { useWallet } from "./context/WalletContext";

import {
  BASE_FEE,
  Contract,
  Networks,
  rpc as StellarRpc,
  Transaction,
  TransactionBuilder,
  Operation,
  xdr,
} from "@stellar/stellar-sdk";

import { signTransaction } from "./stellar-wallet-kit";

const CONTRACT_ID = "CCGHWWNJDDTOE5T6LU6HIODI3ODMIO3G2JZV5EYR4PM34A5U4YD6LJZW";
const NETWORK_PASSPHRASE = Networks.TESTNET;
const SOROBAN_URL = "https://soroban-testnet.stellar.org:443";

interface FormData {
  component_type: string;
  production_quantity: string;
  production_date: string;
  facility_id: string;
  doc_hash: string;
}

interface TransactionResult {
  transaction_hash: string;
  batch_id: string;
}

export default function Home() {
  const { publicKey } = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [transactionResult, setTransactionResult] = useState<TransactionResult | null>(null);
  const [formData, setFormData] = useState<FormData>({
    component_type: "",
    production_quantity: "",
    production_date: "",
    facility_id: "",
    doc_hash: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (errors[name as keyof FormData]) {
      setErrors({ ...errors, [name]: undefined });
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<FormData> = {};
    let isValid = true;

    if (!formData.component_type.trim()) {
      newErrors.component_type = "Component type is required";
      isValid = false;
    } else if (formData.component_type.length > 64) {
      newErrors.component_type = "Maximum 64 bytes allowed";
      isValid = false;
    }

    if (!formData.production_quantity.trim()) {
      newErrors.production_quantity = "Production quantity is required";
      isValid = false;
    } else if (!/^\d+$/.test(formData.production_quantity)) {
      newErrors.production_quantity = "Must be a positive integer";
      isValid = false;
    }

    if (!formData.production_date.trim()) {
      newErrors.production_date = "Production date is required";
      isValid = false;
    } else if (formData.production_date.length > 20) {
      newErrors.production_date = "Maximum 20 bytes allowed";
      isValid = false;
    }

    if (!formData.facility_id.trim()) {
      newErrors.facility_id = "Facility ID is required";
      isValid = false;
    } else if (formData.facility_id.length > 64) {
      newErrors.facility_id = "Maximum 64 bytes allowed";
      isValid = false;
    }

    if (!formData.doc_hash.trim()) {
      newErrors.doc_hash = "Document hash is required";
      isValid = false;
    } else if (formData.doc_hash.length > 70) {
      newErrors.doc_hash = "Maximum 70 bytes allowed";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!publicKey) {
      alert("Please connect your wallet first");
      return;
    }

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    setTransactionResult(null);

    try {
      const server = new StellarRpc.Server(SOROBAN_URL);
      const account = await server.getAccount(publicKey);

      const operation = Operation.invokeContractFunction({
        function: "submit_data",
        contract: CONTRACT_ID,
        args: [
          xdr.ScVal.scvString(formData.component_type),
          xdr.ScVal.scvI32(Number(formData.production_quantity)),
          xdr.ScVal.scvString(formData.production_date),
          xdr.ScVal.scvString(formData.facility_id),
          xdr.ScVal.scvString(formData.doc_hash)
        ]
      });

      const tx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(operation)
        .setTimeout(30)
        .build();

      const preparedTx = await server.prepareTransaction(tx);

      const signedXdr = await signTransaction(
        preparedTx.toEnvelope().toXDR("base64"),
        {
          networkPassphrase: NETWORK_PASSPHRASE,
        },
      );

      const signedTx = TransactionBuilder.fromXDR(
        signedXdr.signedTxXdr,
        NETWORK_PASSPHRASE,
      ) as Transaction;

      const txResult = await server.sendTransaction(signedTx);

      if (txResult.status !== "PENDING") {
        throw new Error("Something went Wrong");
      }

      const hash = txResult.hash;

      let getResponse = await server.getTransaction(hash);

      while (getResponse.status === "NOT_FOUND") {
        getResponse = await server.getTransaction(hash);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      if (getResponse.status === "SUCCESS") {
        if (!getResponse.resultMetaXdr) {
          throw "Empty resultMetaXDR in getTransaction response";
        }
      } else {
        throw `Transaction failed: ${getResponse.resultXdr}`;
      }

      const returnValue = getResponse.resultMetaXdr
        .v3()
        .sorobanMeta()
        ?.returnValue();
      if (returnValue) {
        console.log('returnValue', returnValue);

        setTransactionResult({
          transaction_hash: hash,
          batch_id: returnValue.str().toString()
        });
      }
    } catch (error) {
      console.error("Transaction failed:", error);
      alert("Transaction failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-inner">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-8 border-b-2 border-indigo-600 pb-2">Section 45X Data Submission</h2>

        {!publicKey && (
          <div className="bg-amber-100 border-l-4 border-amber-500 p-5 mb-8 rounded-md shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-amber-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-base font-bold text-amber-800">
                  Please connect your wallet to submit data.
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div>
              <label htmlFor="component_type" className="block text-base font-bold text-gray-800 mb-2">
                Component Type
              </label>
              <div className="mt-1 relative">
                <input
                  type="text"
                  name="component_type"
                  id="component_type"
                  value={formData.component_type}
                  onChange={handleInputChange}
                  placeholder="e.g. SolarPanel-TypeA"
                  className={`shadow-md h-10 px-4 py-3 text-base block w-full border-1 ${errors.component_type ? "border-red-600" : "border-gray-300"
                    } rounded-lg`}
                  maxLength={64}
                  disabled={isSubmitting}
                />
                {errors.component_type && (
                  <p className="mt-2 text-sm font-semibold text-red-600">{errors.component_type}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="production_quantity" className="block text-base font-bold text-gray-800 mb-2">
                Production Quantity
              </label>
              <div className="mt-1 relative">
                <input
                  type="number"
                  name="production_quantity"
                  id="production_quantity"
                  value={formData.production_quantity}
                  onChange={handleInputChange}
                  placeholder="e.g. 1200"
                  className={`shadow-md h-10 px-4 py-3 text-base block w-full border-1 ${errors.production_quantity ? "border-red-600" : "border-gray-300"
                    } rounded-lg`}
                  min="1"
                  disabled={isSubmitting}
                />
                {errors.production_quantity && (
                  <p className="mt-2 text-sm font-semibold text-red-600">{errors.production_quantity}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="production_date" className="block text-base font-bold text-gray-800 mb-2">
                Production Date
              </label>
              <div className="mt-1 relative">
                <div className="relative">
                  <input
                    type="date"
                    name="production_date"
                    id="production_date"
                    value={formData.production_date}
                    onChange={handleInputChange}
                    className={`shadow-md h-10 pl-4 pr-4 py-3 text-base block w-full border-1 ${errors.production_date ? "border-red-600" : "border-gray-300"
                      } rounded-lg calendar-enhanced`}
                    maxLength={20}
                    disabled={isSubmitting}
                    style={{
                      colorScheme: 'light',
                    }}
                  />
                </div>
                {errors.production_date && (
                  <p className="mt-2 text-sm font-semibold text-red-600">{errors.production_date}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="facility_id" className="block text-base font-bold text-gray-800 mb-2">
                Facility ID
              </label>
              <div className="mt-1 relative">
                <input
                  type="text"
                  name="facility_id"
                  id="facility_id"
                  value={formData.facility_id}
                  onChange={handleInputChange}
                  placeholder="e.g. FACILITY-ALPHA-001"
                  className={`shadow-md h-10 px-4 py-3 text-base block w-full border-1 ${errors.facility_id ? "border-red-600" : "border-gray-300"
                    } rounded-lg`}
                  maxLength={64}
                  disabled={isSubmitting}
                />
                {errors.facility_id && (
                  <p className="mt-2 text-sm font-semibold text-red-600">{errors.facility_id}</p>
                )}
              </div>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="doc_hash" className="block text-base font-bold text-gray-800 mb-2">
                Document Hash
              </label>
              <div className="mt-1 relative">
                <input
                  type="text"
                  name="doc_hash"
                  id="doc_hash"
                  value={formData.doc_hash}
                  onChange={handleInputChange}
                  placeholder="e.g. a1b2c3d4e5f60718293a4b5c6d7e8f901234567890abcdef1234567890abcdef"
                  className={`shadow-md h-10 px-4 py-3 text-base block w-full border-1 ${errors.doc_hash ? "border-red-600" : "border-gray-300"
                    } rounded-lg font-mono`}
                  maxLength={70}
                  disabled={isSubmitting}
                />
                {errors.doc_hash && (
                  <p className="mt-2 text-sm font-semibold text-red-600">{errors.doc_hash}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              type="submit"
              disabled={isSubmitting || !publicKey}
              className={`w-full md:w-auto inline-flex justify-center py-3 px-8 border border-transparent shadow-lg text-lg font-bold rounded-lg text-white bg-indigo-700 hover:bg-indigo-800 hover:cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all ${(isSubmitting || !publicKey) ? "opacity-50 cursor-not-allowed" : ""
                }`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing Transaction...
                </>
              ) : (
                "Send Transaction"
              )}
            </button>
          </div>
        </form>

        {transactionResult && !isSubmitting && (
          <div className="mt-8 p-6 border-1 border-green-300 rounded-lg bg-green-50 shadow-md">
            <h3 className="text-xl font-bold text-green-800 mb-4 flex items-center">
              <svg className="h-6 w-6 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Transaction Successful!
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-base font-bold text-gray-800 mb-2">Batch ID:</p>
                <p className="p-3 text-base text-gray-900 font-mono bg-white rounded-lg border-1 border-gray-200 shadow-inner overflow-x-auto">
                  {transactionResult.batch_id}
                </p>
              </div>
              <div>
                <p className="text-base font-bold text-gray-800 mb-2">Transaction Hash:</p>
                <a
                  href={`https://stellar.expert/explorer/testnet/tx/${transactionResult.transaction_hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 flex items-center text-base text-indigo-700 hover:text-indigo-900 font-mono bg-white rounded-lg border-1 border-gray-200 shadow-inner overflow-x-auto w-full group"
                >
                  {transactionResult.transaction_hash}
                  <svg className="h-5 w-5 ml-2 text-indigo-600 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}