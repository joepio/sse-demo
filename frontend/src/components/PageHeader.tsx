import React from "react";
import NotificationBell from "./NotificationBell";
import { Link } from "react-router-dom";

interface PageHeaderProps {
  currentZaakId?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ currentZaakId }) => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Logo/Title area */}
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <h1
                className="text-xl font-bold"
                style={{ color: "var(--ro-lintblauw)" }}
              >
                <Link
                  to="/"
                  style={{ color: "inherit", textDecoration: "none" }}
                >
                  MijnZaken
                </Link>
              </h1>
            </div>
            <div className="hidden md:block">
              <div className="text-sm text-gray-500">
                Real-time zaakbehandeling
              </div>
            </div>
          </div>

          {/* Right side - Navigation and notifications */}
          <div className="flex items-center space-x-4">
            <Link
              to="/api-docs"
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              📋 API Docs
            </Link>
            <NotificationBell currentZaakId={currentZaakId} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default PageHeader;
