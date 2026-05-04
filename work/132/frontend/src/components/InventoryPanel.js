import React, { useState, useCallback, useRef } from 'react';

const ITEM_TYPES = {
  CONSUMABLE: 'consumable',
  EQUIPMENT: 'equipment',
  GOLD: 'gold'
};

const RARITY_COLORS = {
  common: '#808080',
  uncommon: '#44ff44',
  rare: '#4488ff',
  epic: '#aa44ff',
  legendary: '#ffaa00'
};

function InventoryPanel({ 
  inventory, 
  dragState, 
  onDragStart, 
  onDragEnd, 
  onDrop,
  onItemClick,
  onDropItem
}) {
  const [hoveredItem, setHoveredItem] = useState(null);
  const [hoveredSlot, setHoveredSlot] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const panelRef = useRef(null);

  const inventorySlots = inventory || new Array(20).fill(null);

  const handleMouseDown = useCallback((e, item, index) => {
    e.preventDefault();
    if (item) {
      onDragStart(item, 'inventory', null, index);
    }
  }, [onDragStart]);

  const handleMouseUp = useCallback((e, index) => {
    e.preventDefault();
    if (dragState.isDragging) {
      onDrop('inventory', null, index);
    }
  }, [dragState, onDrop]);

  const handleMouseEnter = useCallback((item, index) => {
    setHoveredItem(item);
    setHoveredSlot(index);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredItem(null);
    setHoveredSlot(null);
  }, []);

  const handleContextMenu = useCallback((e, item, index) => {
    e.preventDefault();
    if (item) {
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        item,
        index
      });
    }
  }, []);

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleUseItem = useCallback(() => {
    if (contextMenu) {
      onItemClick(contextMenu.item, 'inventory', null, contextMenu.index);
    }
    handleCloseContextMenu();
  }, [contextMenu, onItemClick, handleCloseContextMenu]);

  const handleDropItem = useCallback(() => {
    if (contextMenu) {
      onDropItem(contextMenu.index);
    }
    handleCloseContextMenu();
  }, [contextMenu, onDropItem, handleCloseContextMenu]);

  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (contextMenu) {
        handleCloseContextMenu();
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [contextMenu, handleCloseContextMenu]);

  const getItemTooltip = (item) => {
    const lines = [];
    lines.push(`<strong style="color: ${RARITY_COLORS[item.rarity] || '#ffffff'}">${item.name}</strong>`);
    
    if (item.description) {
      lines.push(`<span style="color: #888;">${item.description}</span>`);
    }
    
    if (item.baseAttack || item.baseDefense || item.baseMaxHp) {
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
    }
    
    if (item.effect) {
      if (item.effect.hp) {
        lines.push(`<span style="color: #ff4444;">恢复 ${item.effect.hp} 生命值</span>`);
      }
      if (item.effect.tempAttack) {
        lines.push(`<span style="color: #ffaa00;">临时 +${item.effect.tempAttack} 攻击力 (${item.effect.duration || 10} 回合)</span>`);
      }
    }
    
    if (item.quantity > 1) {
      lines.push('');
      lines.push(`<span style="color: #aaa;">数量: ${item.quantity}</span>`);
    }
    
    lines.push('');
    if (item.type === ITEM_TYPES.CONSUMABLE) {
      lines.push('<span style="color: #666;">点击使用 | 右键更多选项</span>');
    } else if (item.type === ITEM_TYPES.EQUIPMENT) {
      lines.push('<span style="color: #666;">点击装备 | 拖拽交换</span>');
    }
    
    return lines.join('<br/>');
  };

  return (
    <div className="inventory-panel" ref={panelRef}>
      <div className="inventory-grid">
        {inventorySlots.map((item, index) => {
          const isHovered = hoveredSlot === index;
          const isDropTarget = dragState.isDragging && hoveredSlot === index;
          const isBeingDragged = dragState.isDragging && 
            dragState.sourceType === 'inventory' && 
            dragState.sourceIndex === index;
          
          return (
            <div
              key={index}
              className={`inventory-slot ${item ? 'has-item' : ''} ${isDropTarget ? 'drop-target' : ''} ${isBeingDragged ? 'dragging' : ''}`}
              onMouseDown={(e) => handleMouseDown(e, item, index)}
              onMouseUp={(e) => handleMouseUp(e, index)}
              onMouseEnter={() => handleMouseEnter(item, index)}
              onMouseLeave={handleMouseLeave}
              onContextMenu={(e) => handleContextMenu(e, item, index)}
            >
              {item && (
                <div 
                  className="inventory-item"
                  onClick={() => onItemClick(item, 'inventory', null, index)}
                  style={{ color: item.color }}
                >
                  <span className="item-symbol">{item.symbol}</span>
                  {item.quantity > 1 && (
                    <span className="item-quantity">{item.quantity}</span>
                  )}
                  <div 
                    className="item-rarity-border"
                    style={{ borderColor: RARITY_COLORS[item.rarity] || 'transparent' }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {hoveredItem && !dragState.isDragging && (
        <div 
          className="item-tooltip"
          style={{
            position: 'fixed',
            left: 'auto',
            right: '10px',
            top: 'auto',
            bottom: '10px'
          }}
          dangerouslySetInnerHTML={{ __html: getItemTooltip(hoveredItem) }}
        />
      )}

      {contextMenu && (
        <div 
          className="context-menu"
          style={{
            position: 'fixed',
            left: contextMenu.x,
            top: contextMenu.y,
            zIndex: 1000
          }}
        >
          <div className="context-menu-item" onClick={handleUseItem}>
            {contextMenu.item.type === ITEM_TYPES.CONSUMABLE ? '使用' : '装备'}
          </div>
          <div className="context-menu-item" onClick={handleDropItem}>
            丢弃
          </div>
        </div>
      )}

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

export default InventoryPanel;
