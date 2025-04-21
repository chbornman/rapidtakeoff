import React from "react";
import { PointEntity as PointEntityType } from "../types";

interface PointEntityProps {
  entity: PointEntityType;
  isSelected: boolean;
  onClick: () => void;
  /** Optional renderer configuration for styling */
  rendererConfig?: any;
}

const PointEntity: React.FC<PointEntityProps> = ({
  entity,
  isSelected,
  onClick,
  rendererConfig,
}) => {
  const { location } = entity;
  // Determine styling from rendererConfig
  const canvasEntityCfg = rendererConfig?.canvas?.entity;
  const defaultPointSize = canvasEntityCfg?.pointSize?.default ?? 2;
  const selectedPointSize =
    canvasEntityCfg?.pointSize?.selected ?? defaultPointSize * 2;
  const pointSize = isSelected ? selectedPointSize : defaultPointSize;
  const typeKey = entity.type.toLowerCase();
  const entityColor =
    rendererConfig?.entities?.[typeKey]?.color ||
    rendererConfig?.canvas?.colors?.default ||
    "#FFFFFF";
  const selectionColor = rendererConfig?.canvas?.colors?.selection || "#FF0000";
  const fillColor = isSelected ? selectionColor : entityColor;
  const strokeColor = fillColor;

  return (
    <circle
      cx={location[0]}
      cy={location[1]}
      r={pointSize}
      stroke={strokeColor}
      fill={fillColor}
      onClick={onClick}
      data-entity-type="POINT"
      data-entity-handle={entity.handle}
      data-layer={entity.layer}
      className="cursor-pointer transition-colors duration-150"
    />
  );
};

export default PointEntity;
