"use client";

import React, { useState } from "react";

interface DepositSelectorProps {
  total: number;
  onSelect: (amount: number) => void;
}

export default function DepositSelector({ total, onSelect }: DepositSelectorProps) {
  const [selectedDeposit, setSelectedDeposit] = useState<number | null>(null);
  
  const depositOptions = [
    { label: "25%", percentage: 25 },
    { label: "50%", percentage: 50 },
    { label: "100%", percentage: 100 },
  ];
  
  const handleSelect = (percentage: number) => {
    const amount = (total * percentage) / 100;
    setSelectedDeposit(percentage);
    onSelect(amount);
  };
  
  return (
    <div className="border rounded-lg p-6 bg-white">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Deposit Amount</h3>
      <p className="text-sm text-gray-600 mb-4">Total: ${total.toFixed(2)}</p>
      <div className="flex gap-4">
        {depositOptions.map((option) => {
          const amount = (total * option.percentage) / 100;
          const isSelected = selectedDeposit === option.percentage;
          
          return (
            <button
              key={option.percentage}
              onClick={() => handleSelect(option.percentage)}
              className={`flex-1 border-2 rounded-lg p-4 text-center transition-colors ${
                isSelected
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="font-semibold text-gray-900">{option.label}</div>
              <div className="text-sm text-gray-600 mt-1">${amount.toFixed(2)}</div>
            </button>
          );
        })}
      </div>
      {selectedDeposit && (
        <p className="mt-4 text-sm text-gray-600">
          Remaining balance: ${(total - (total * selectedDeposit) / 100).toFixed(2)}
        </p>
      )}
    </div>
  );
}
