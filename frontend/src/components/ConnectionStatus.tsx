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

  const getStatusColor = () => {
    switch (status) {
      case "connected":
        return "#28a745";
      case "connecting":
        return "#ffc107";
      case "disconnected":
      case "error":
        return "#dc3545";
      default:
        return "#6c757d";
    }
  };

  return (
    <div
      style={{
        fontSize: "0.9rem",
        opacity: 0.7,
        color: getStatusColor(),
        fontWeight: status === "connected" ? "bold" : "normal",
      }}
    >
      {getStatusText()}
    </div>
  );
};

export default ConnectionStatus;
