import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  path: string;
  icon?: React.ReactNode;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  const location = useLocation();

  const defaultItems: BreadcrumbItem[] = [
    { label: 'Dashboard', path: '/dashboard', icon: <Home className="w-4 h-4" /> },
  ];

  // Auto-generate breadcrumbs based on current path if no items provided
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [defaultItems[0]];

    let currentPath = '';
    pathSegments.forEach((segment) => {
      currentPath += `/${segment}`;
      const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace('-', ' ');
      breadcrumbs.push({ label, path: currentPath });
    });

    return breadcrumbs;
  };

  const breadcrumbItems = items || generateBreadcrumbs();

  if (breadcrumbItems.length <= 1) {
    return null;
  }

  return (
    <nav className="flex items-center space-x-1 text-sm mb-4 overflow-x-auto" aria-label="Breadcrumb">
      <div className="flex items-center space-x-1 whitespace-nowrap">
        {breadcrumbItems.map((item, index) => (
          <React.Fragment key={item.path}>
            {index > 0 && (
              <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
            )}
            {index === breadcrumbItems.length - 1 ? (
              <span className="flex items-center space-x-1 text-purple-400 font-medium">
                {item.icon}
                <span className="hidden sm:inline">{item.label}</span>
              </span>
            ) : (
              <Link
                to={item.path}
                className="flex items-center space-x-1 text-gray-400 hover:text-white transition-colors"
              >
                {item.icon}
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            )}
          </React.Fragment>
        ))}
      </div>
    </nav>
  );
};