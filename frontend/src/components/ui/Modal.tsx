import React, { ReactNode } from "react";

interface ModalProps {
  title: string;
  description: string;
  children: ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  title,
  description,
  children,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-[600px] p-8">
        <p className="text-sm text-right text-[#555555] -mt-2 mb-3">
          <span className="text-red-500">*</span> Indicates required field
        </p>
        <h2 className="text-2xl font-semibold text-center text-gray-900 mb-2">
          {title}
        </h2>
        <p className="text-sm text-center text-gray-600 mb-8">{description}</p>
        {children}
      </div>
    </div>
  );
};
