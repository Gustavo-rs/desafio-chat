import React from "react";
import { MessageSquare } from "lucide-react";

interface EmptyStateProps {
  message: string;
  subtitle: string;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  message,
  subtitle,
  icon = <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />,
}) => {
  return (
    <div className="flex items-center justify-center h-full bg-white rounded-lg">
      <div className="text-center text-gray-500">
        {icon}
        <p className="text-lg font-medium mb-2">{message}</p>
        <p className="text-sm">{subtitle}</p>
      </div>
    </div>
  );
}; 