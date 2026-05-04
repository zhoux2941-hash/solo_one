import React, { useState, useCallback } from 'react';

const EQUIPMENT_SLOTS_CONFIG = [
  { key: 'helmet', name: '头盔', symbol: '^', order: 0 },
  { key: 'amulet', name: '护符', symbol: '"', order: 1 },
  { key: 'weapon', name: '武器', symbol: '/', order: 2 },
  { key: 'armor', name: '护甲', symbol: '[', order: 3 },
  { key: 'shield', name: '盾牌', symbol: ')', order: 4 },
  { key: 'gloves', name: '手套', symbol: '{', order: 5 },
  { key: 'ring1', name: '戒指', symbol: '=', order: 6 },
  { key: 'ring2', name: '戒指', symbol: '=', order: 7 },
  { key: 'boots', name: '靴子', symbol: '~', order: 8 }
];

const RARITY_COLORS = {
  common: '#808080',
  uncommon: '#44ff44',
  rare: '#4488ff',
  epic: '#aa44ff',
  legendary: '#ffaa00'
};

const ITEM_TYPES = {
  EQUIPMENT: 'equipment'
};

function EquipmentPanel({ 
  equipment, 
  playerStats, 
  bonuses,
  dragState, 
  onDragStart, 
  onDragEnd, 
  onDrop,
  onItemClick
}) {
  const [hoveredSlot, setHoveredSlot] = useState(null);

  const handleMouseDown = useCallback((e, item, slot) => {
    e.preventDefault();
    if (item) {
      onDragStart(item, 'equipment', slot, null);
    }
  }, [onDragStart]);

  const handleMouseUp = useCallback((e, slot) => {
    e.preventDefault();
    if (dragState.isDragging) {
      onDrop('equipment', slot, null);
    }
  }, [dragState, onDrop]);

  const handleMouseEnter = useCallback((slot) => {
    setHoveredSlot(slot);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredSlot(null);
  }, []);

  const canEquipToSlot = useCallback((item, slot) => {
    if (!item || item.type !== ITEM_TYPES.EQUIPMENT) return false;
    const validSlots = [item.slot, ...(item.alternateSlots || [])];
    return validSlots.includes(slot);
  }, []);

  const getItemTooltip = (item) => {
    if (!item) return null;
    
    const lines = [];
    lines.push(`<strong style="color: ${RARITY_COLORS[item.rarity] || '#ffffff'}">${item.name}</strong>`);
    
    if (item.description) {
      lines.push(`<span style="color: #888;">${item.description}</span>`);
    }
    
    lines.push('');
    if (item.baseAttack) {
      lines.push(`<span style="color: #44ff44;">+${item.baseAttack} 攻击力</span>`);
    }
    if (item.baseDefense) {
      lines.push(`<span style="color: #44ff44;">+${item.baseDefense} 防御力</span>`);
    }
    if (item.baseMaxHp) {
      lines.push(`<span style="color: #44ff44;">+${item.baseMaxHp} 最大生命</span>`);
    }
    
    lines.push('');
    lines.push('<span style="color: #666;">点击卸下 | 拖拽交换</span>');
    
    return lines.join('<br/>');
  };

  const getEmptySlotTooltip = (slotConfig) => {
    const lines = [];
    lines.push(`<strong style="color: #666;">${slotConfig.name}</strong>`);
    lines.push(`<span style="color: #444;">空槽位</span>`);
    lines.push('');
    if (dragState.isDragging && dragState.draggedItem) {
      const canEquip = canEquipToSlot(dragState.draggedItem, slotConfig.key);
      if (canEquip) {
        lines.push(`<span style="color: #44ff44;">松开鼠标装备到该槽位</span>`);
      } else {
        lines.push(`<span style="color: #ff4444;">该物品不能装备到这个槽位</span>`);
      }
    }
    return lines.join('<br/>');
  };

  const hoveredItem = hoveredSlot ? equipment?.[hoveredSlot] : null;
  const hoveredSlotConfig = hoveredSlot ? EQUIPMENT_SLOTS_CONFIG.find(s => s.key === hoveredSlot) : null;

  return (
    <div className="equipment-panel">
      <div className="equipment-grid">
        {EQUIPMENT_SLOTS_CONFIG.map((slotConfig) => {
          const item = equipment?.[slotConfig.key];
          const isHovered = hoveredSlot === slotConfig.key;
          const isDropTarget = dragState.isDragging && isHovered;
          const isValidDropTarget = isDropTarget && dragState.draggedItem && 
            canEquipToSlot(dragState.draggedItem, slotConfig.key);
          const isBeingDragged = dragState.isDragging && 
            dragState.sourceType === 'equipment' && 
            dragState.sourceSlot === slotConfig.key;
          
          return (
            <div
              key={slotConfig.key}
              className={`equipment-slot ${item ? 'has-item' : ''} ${isDropTarget ? (isValidDropTarget ? 'valid-drop' : 'invalid-drop') : ''} ${isBeingDragged ? 'dragging' : ''}`}
              onMouseDown={(e) => handleMouseDown(e, item, slotConfig.key)}
              onMouseUp={(e) => handleMouseUp(e, slotConfig.key)}
              onMouseEnter={() => handleMouseEnter(slotConfig.key)}
              onMouseLeave={handleMouseLeave}
            >
              <div className="equipment-slot-label">{slotConfig.name}</div>
              
              {item ? (
                <div 
                  className="equipment-item"
                  onClick={() => onItemClick(item, 'equipment', slotConfig.key, null)}
                  style={{ color: item.color }}
                >
                  <span className="item-symbol">{item.symbol}</span>
                  <div 
                    className="item-rarity-border"
                    style={{ borderColor: RARITY_COLORS[item.rarity] || 'transparent' }}
                  />
                </div>
              ) : (
                <div className="equipment-empty" style={{ color: '#444' }}>
                  <span className="item-symbol">{slotConfig.symbol}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {(hoveredSlot || (dragState.isDragging && hoveredSlot)) && (
        <div 
          className="item-tooltip equipment-tooltip"
          style={{
            position: 'fixed',
            left: '10px',
            top: 'auto',
            bottom: '10px'
          }}
          dangerouslySetInnerHTML={{ 
            __html: hoveredItem 
              ? getItemTooltip(hoveredItem) 
              : getEmptySlotTooltip(hoveredSlotConfig)
          }}
        />
      )}

      <div className="equipment-stats">
        <div className="equipment-stat-row">
          <span className="stat-label">装备加成:</span>
        </div>
        {bonuses.attackBonus > 0 && (
          <div className="equipment-stat-row">
            <span className="stat-value positive">+{bonuses.attackBonus} 攻击力</span>
          </div>
        )}
        {bonuses.defenseBonus > 0 && (
          <div className="equipment-stat-row">
            <span className="stat-value positive">+{bonuses.defenseBonus} 防御力</span>
          </div>
        )}
        {bonuses.attackBonus === 0 && bonuses.defenseBonus === 0 && (
          <div className="equipment-stat-row">
            <span className="stat-value neutral">无加成</span>
          </div>
        )}
      </div>

      {dragState.isDragging && (
        <div className="drag-ghost">
          <span style={{ color: dragState.draggedItem?.color }}>
            {dragState.draggedItem?.symbol}
          </span>
        </div>
      )}
    </div>
  );
}

export default EquipmentPanel;
