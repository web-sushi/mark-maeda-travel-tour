import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  gradient?: "tours" | "transfers" | "packages" | "default";
}

export default function PageHeader({ title, subtitle, action, gradient = "default" }: PageHeaderProps) {
  const gradients = {
    tours: "bg-gradient-to-r from-blue-50 to-indigo-50",
    transfers: "bg-gradient-to-r from-green-50 to-emerald-50",
    packages: "bg-gradient-to-r from-purple-50 to-pink-50",
    default: "bg-gray-50",
  };

  return (
    <div className={`${gradients[gradient]} border-b`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              {title}
            </h1>
            {subtitle && (
              <p className="text-lg text-gray-600">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      </div>
    </div>
  );
}
