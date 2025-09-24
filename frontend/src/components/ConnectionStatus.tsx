import React from "react";

interface ConnectionStatusProps {
  status: "connecting" | "connected" | "disconnected" | "error";
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ status }) => {
  const getStatusText = () => {
    switch (status) {
      case "connecting":
        return "verbinden…";
      case "connected":
        return "live ✅";
      case "disconnected":
        return "verbinding verbroken, opnieuw proberen…";
      case "error":
        return "verbindingsfout, opnieuw proberen…";
      default:
        return "onbekende status";
    }
  };

  const getStatusStyles = () => {
    switch (status) {
      case "connected":
        return {
          color: "var(--status-open)",
          fontWeight: "bold",
        };
      case "connecting":
        return {
          color: "var(--status-progress)",
          fontWeight: "normal",
        };
      case "disconnected":
      case "error":
        return {
          color: "var(--status-closed)",
          fontWeight: "normal",
        };
      default:
        return {
          color: "var(--text-secondary)",
          fontWeight: "normal",
        };
    }
  };

  return (
    <div className="text-sm opacity-70" style={getStatusStyles()}>
      {getStatusText()}
    </div>
  );
};

export default ConnectionStatus;
