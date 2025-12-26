import React, { useState, useRef, useEffect } from "react";
import {
  Card,
  CardBody,
  Typography,
} from "@material-tailwind/react";

// ===== Статические данные (семейное дерево) с позициями =====
const STATIC_FAMILY_DATA = [
  {
    id: "1",
    name: "Иван Иванов",
    role: "Основатель семьи",
    birthYear: "1945",
    photo: "https://static.vecteezy.com/system/resources/thumbnails/028/569/170/small/single-man-icon-people-icon-user-profile-symbol-person-symbol-businessman-stock-vector.jpg",
    children: ["2", "3"],
    spouse: null,
    position: { x: 400, y: 50 },
    width: 200,
    height: 180
  },
  {
    id: "2",
    name: "Петр Иванов",
    role: "Старший сын",
    birthYear: "1970",
    photo: "https://static.vecteezy.com/system/resources/thumbnails/028/569/170/small/single-man-icon-people-icon-user-profile-symbol-person-symbol-businessman-stock-vector.jpg",
    children: ["4", "5"],
    spouse: "7",
    position: { x: 200, y: 300 },
    width: 200,
    height: 180
  },
  {
    id: "3",
    name: "Мария Иванова",
    role: "Дочь",
    birthYear: "1973",
    photo: "https://static.vecteezy.com/system/resources/thumbnails/028/569/170/small/single-man-icon-people-icon-user-profile-symbol-person-symbol-businessman-stock-vector.jpg",
    children: ["6"],
    spouse: "8",
    position: { x: 1000, y: 300 },
    width: 200,
    height: 180
  },
  {
    id: "4",
    name: "Алексей Петров",
    role: "Внук",
    birthYear: "1995",
    photo: "https://static.vecteezy.com/system/resources/thumbnails/028/569/170/small/single-man-icon-people-icon-user-profile-symbol-person-symbol-businessman-stock-vector.jpg",
    children: [],
    spouse: null,
    position: { x: 320, y: 550 },
    width: 200,
    height: 180
  },
  {
    id: "5",
    name: "Елена Петрова",
    role: "Внучка",
    birthYear: "1998",
    photo: "https://static.vecteezy.com/system/resources/thumbnails/028/569/170/small/single-man-icon-people-icon-user-profile-symbol-person-symbol-businessman-stock-vector.jpg",
    children: [],
    spouse: null,
    position: { x: 600, y: 550 },
    width: 200,
    height: 180
  },
  {
    id: "6",
    name: "Дмитрий Смирнов",
    role: "Внук",
    birthYear: "2000",
    photo: "https://static.vecteezy.com/system/resources/thumbnails/028/569/170/small/single-man-icon-people-icon-user-profile-symbol-person-symbol-businessman-stock-vector.jpg",
    children: [],
    spouse: null,
    position: { x: 1125, y: 550 },
    width: 200,
    height: 180
  },
  {
    id: "7",
    name: "Анна Петрова",
    role: "Жена Петра",
    birthYear: "1972",
    photo: "https://static.vecteezy.com/system/resources/thumbnails/028/569/170/small/single-man-icon-people-icon-user-profile-symbol-person-symbol-businessman-stock-vector.jpg",
    children: ["4", "5"],
    spouse: "2",
    position: { x: 600, y: 300 },
    width: 200,
    height: 180
  },
  {
    id: "8",
    name: "Сергей Смирнов",
    role: "Муж Марии",
    birthYear: "1970",
    photo: "https://static.vecteezy.com/system/resources/thumbnails/028/569/170/small/single-man-icon-people-icon-user-profile-symbol-person-symbol-businessman-stock-vector.jpg",
    children: ["6"],
    spouse: "3",
    position: { x: 1250, y: 300 },
    width: 200,
    height: 180
  }
];

// ===== Константы =====
const CARD_WIDTH = 200;
const CARD_HEIGHT = 180;
const WORLD_W = 1500;
const WORLD_H = 800;

const DashboardFamilyTree = () => {
  // ===== Состояния =====
  const [familyData, setFamilyData] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [expandedNodes, setExpandedNodes] = useState(new Set(["1"])); // Только основатель открыт по умолчанию
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768
  });
  const [draggingNode, setDraggingNode] = useState(null);
  const [showPositions, setShowPositions] = useState(false);

  // ===== Зум/Пан =====
  const [zoom, setZoom] = useState(0.8);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const lastTouchTime = useRef(0);

  // ===== Отслеживание размера экрана =====
  useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight
      });

      if (window.innerWidth < 768) {
        setZoom(0.5);
        setPosition({ x: -200, y: -100 });
      } else {
        setZoom(0.8);
        setPosition({ x: 0, y: 0 });
      }
    };

    if (typeof window !== 'undefined') {
      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // ===== Инициализация данных =====
  useEffect(() => {
    setFamilyData(STATIC_FAMILY_DATA);
  }, []);

  // ===== Расчет позиций дерева =====
  useEffect(() => {
    if (familyData.length === 0) return;

    const getVisibleNodes = () => {
      const visibleNodes = [];
      const queue = ["1"]; // Начинаем с корневого узла

      while (queue.length > 0) {
        const nodeId = queue.shift();
        const node = familyData.find(n => n.id === nodeId);

        if (node && !visibleNodes.find(n => n.id === nodeId)) {
          visibleNodes.push(node);

          // Если узел раскрыт, добавляем его детей в очередь
          if (expandedNodes.has(nodeId)) {
            if (node.children && node.children.length > 0) {
              queue.push(...node.children);
            }
            // Супругов всегда показываем рядом (не зависит от раскрытия)
            if (node.spouse && !visibleNodes.find(n => n.id === node.spouse)) {
              const spouseNode = familyData.find(n => n.id === node.spouse);
              if (spouseNode) {
                visibleNodes.push(spouseNode);
              }
            }
          }
        }
      }

      // Добавляем всех супругов, чьи партнеры видны
      familyData.forEach(node => {
        if (node.spouse && !visibleNodes.find(n => n.id === node.id)) {
          const spouseNode = visibleNodes.find(n => n.id === node.spouse);
          if (spouseNode) {
            visibleNodes.push(node);
          }
        }
      });

      return visibleNodes;
    };

    const calculatePositions = (visibleNodes) => {
      return visibleNodes.map(node => {
        // Используем позицию из данных
        return {
          ...node,
          position: { ...node.position }
        };
      });
    };

    const createConnections = (positionedNodes) => {
      const conns = [];

      positionedNodes.forEach(node => {
        // Брачные связи - только если оба супруга видны
        if (node.spouse) {
          const spouseNode = positionedNodes.find(n => n.id === node.spouse);
          if (spouseNode) {
            conns.push({
              id: `marriage-${node.id}-${spouseNode.id}`,
              from: {
                x: node.position.x + CARD_WIDTH / 2,
                y: node.position.y + CARD_HEIGHT / 2
              },
              to: {
                x: spouseNode.position.x + CARD_WIDTH / 2,
                y: spouseNode.position.y + CARD_HEIGHT / 2
              },
              type: "marriage",
              color: "#ef4444"
            });
          }
        }

        // Родительские связи - только если родитель раскрыт
        if (expandedNodes.has(node.id) && node.children && node.children.length > 0) {
          node.children.forEach(childId => {
            const childNode = positionedNodes.find(n => n.id === childId);
            if (childNode) {
              conns.push({
                id: `parent-${node.id}-${childId}`,
                from: {
                  x: node.position.x + CARD_WIDTH / 2,
                  y: node.position.y + CARD_HEIGHT
                },
                to: {
                  x: childNode.position.x + CARD_WIDTH / 2,
                  y: childNode.position.y
                },
                type: "parent",
                color: "#3b82f6"
              });
            }
          });
        }
      });

      return conns;
    };

    const visibleNodes = getVisibleNodes();
    const positionedNodes = calculatePositions(visibleNodes);
    const conns = createConnections(positionedNodes);

    setNodes(positionedNodes);
    setConnections(conns);
  }, [familyData, expandedNodes]);

  // ===== Обработка клика по карточке =====
  const handleCardClick = (nodeId, e) => {
    e.stopPropagation();

    const node = familyData.find(n => n.id === nodeId);
    if (!node) return;

    // Для супругов не делаем раскрытие/скрытие
    if (node.role.includes('Жена') || node.role.includes('Муж') || node.role.includes('супруг')) {
      return;
    }

    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
        // Закрываем всех детей рекурсивно
        const closeChildren = (id) => {
          const childNode = familyData.find(n => n.id === id);
          if (childNode) {
            newSet.delete(id);
            if (childNode.children) {
              childNode.children.forEach(childId => closeChildren(childId));
            }
          }
        };
        if (node.children) {
          node.children.forEach(childId => closeChildren(childId));
        }
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  // ===== Начало перетаскивания карточки =====
  const handleDragStart = (nodeId, e) => {
    e.stopPropagation();
    e.preventDefault();

    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    setDraggingNode(nodeId);
    dragStartPos.current = {
      x: (e.clientX || (e.touches && e.touches[0].clientX)) / zoom - node.position.x,
      y: (e.clientY || (e.touches && e.touches[0].clientY)) / zoom - node.position.y
    };

    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
    document.addEventListener('touchmove', handleDragMove, { passive: false });
    document.addEventListener('touchend', handleDragEnd);
  };

  // ===== Перетаскивание карточки =====
  const handleDragMove = (e) => {
    if (!draggingNode) return;

    e.preventDefault();

    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);

    if (!clientX || !clientY) return;

    const newX = clientX / zoom - dragStartPos.current.x;
    const newY = clientY / zoom - dragStartPos.current.y;

    setFamilyData(prev => prev.map(node => {
      if (node.id === draggingNode) {
        return {
          ...node,
          position: { x: newX, y: newY }
        };
      }
      return node;
    }));
  };

  // ===== Конец перетаскивания карточки =====
  const handleDragEnd = () => {
    setDraggingNode(null);
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
    document.removeEventListener('touchmove', handleDragMove);
    document.removeEventListener('touchend', handleDragEnd);
  };

  // ===== Сброс позиций к исходным =====
  const resetPositions = () => {
    setFamilyData(STATIC_FAMILY_DATA.map(node => ({
      ...node,
      position: { ...STATIC_FAMILY_DATA.find(n => n.id === node.id)?.position || { x: 0, y: 0 } }
    })));
  };

  // ===== Зум колесиком мыши =====
  useEffect(() => {
    let zoomTimeout;

    const wheel = (e) => {
      if (e.ctrlKey && containerRef.current?.contains(e.target)) {
        e.preventDefault();
        e.stopPropagation();

        clearTimeout(zoomTimeout);
        zoomTimeout = setTimeout(() => {
          const delta = -e.deltaY * 0.001;
          setZoom(z => Math.max(0.3, Math.min(2, z + delta)));
        }, 16);
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener("wheel", wheel, { passive: false });
      return () => {
        document.removeEventListener("wheel", wheel);
        clearTimeout(zoomTimeout);
      };
    }
  }, []);

  // ===== Функции панорамирования для мыши =====
  const panDown = (e) => {
    // Если это карточка - не панорамируем
    if (e.target.closest('[data-card="true"]')) {
      return;
    }

    if (e.button !== 0 || e.ctrlKey || draggingNode) return;
    setIsPanning(true);
    setPanStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });

    document.addEventListener('mousemove', panMoveMouse);
    document.addEventListener('mouseup', panUp);
  };

  const panMoveMouse = (e) => {
    if (isPanning) {
      setPosition({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }
  };

  const panUp = () => {
    setIsPanning(false);
    document.removeEventListener('mousemove', panMoveMouse);
    document.removeEventListener('mouseup', panUp);
  };

  // ===== Функции панорамирования для тач-устройств =====
  const handleTouchStart = (e) => {
    // Если это карточка - не панорамируем (это будет перетаскивание карточки)
    if (e.target.closest('[data-card="true"]')) {
      return;
    }

    if (e.touches.length === 1 && !draggingNode) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y
      });
      lastTouchTime.current = Date.now();
    }
  };

  const handleTouchMove = (e) => {
    if (isPanning && e.touches.length === 1) {
      e.preventDefault();
      setPosition({
        x: e.touches[0].clientX - panStart.x,
        y: e.touches[0].clientY - panStart.y
      });
    }
  };

  const handleTouchEnd = (e) => {
    // Если был короткий тап на пустом месте - ничего не делаем
    const touchDuration = Date.now() - lastTouchTime.current;
    if (touchDuration < 200 && !e.target.closest('[data-card="true"]')) {
      // Это был короткий тап на пустом месте, игнорируем
    }
    setIsPanning(false);
  };

  // ===== Зум для тач-устройств (pinch-to-zoom) =====
  useEffect(() => {
    let initialDistance = 0;
    let initialZoom = zoom;

    const handleTouchStartForZoom = (e) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        initialDistance = Math.sqrt(dx * dx + dy * dy);
        initialZoom = zoom;
      }
    };

    const handleTouchMoveForZoom = (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const currentDistance = Math.sqrt(dx * dx + dy * dy);

        if (initialDistance > 0) {
          const scale = currentDistance / initialDistance;
          const newZoom = initialZoom * scale;
          setZoom(Math.max(0.3, Math.min(2, newZoom)));
        }
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('touchstart', handleTouchStartForZoom, { passive: true });
      container.addEventListener('touchmove', handleTouchMoveForZoom, { passive: false });

      return () => {
        container.removeEventListener('touchstart', handleTouchStartForZoom);
        container.removeEventListener('touchmove', handleTouchMoveForZoom);
      };
    }
  }, [zoom]);

  // ===== Обработка кликов на пустом месте =====
  const handleBackgroundClick = (e) => {
    // Если кликнули на пустое место - ничего не делаем
    if (!e.target.closest('[data-card="true"]')) {
      return;
    }
  };

  return (
    <div className="w-full h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50 overflow-hidden">
      <div
        ref={containerRef}
        className="w-full h-full relative touch-none select-none"
        onMouseDown={panDown}
        onMouseUp={panUp}
        onMouseLeave={panUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleBackgroundClick}
        style={{
          cursor: isPanning ? "grabbing" : draggingNode ? "grabbing" : "grab",
          userSelect: 'none',
          WebkitUserSelect: 'none',
          msUserSelect: 'none',
        }}
      >
        <div
          className="absolute top-0 left-0"
          style={{
            width: WORLD_W,
            height: WORLD_H,
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
            touchAction: 'none',
          }}
        >
          {/* SVG линии связей */}
          <svg
            width={WORLD_W}
            height={WORLD_H}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              overflow: "visible",
              pointerEvents: "none",
              zIndex: 0,
            }}
          >
            {connections.map((conn) => (
              <g key={conn.id}>
                {/* Основная линия */}
                <path
                  d={`M ${conn.from.x} ${conn.from.y} L ${conn.to.x} ${conn.to.y}`}
                  stroke={conn.color}
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray={conn.type === "marriage" ? "5,5" : "none"}
                />

                {/* Стрелка для родительских связей */}
                {conn.type === "parent" && (
                  <circle
                    cx={conn.to.x}
                    cy={conn.to.y}
                    r="4"
                    fill="#3b82f6"
                  />
                )}

                {/* Сердечко для брачных связей */}
                {conn.type === "marriage" && (
                  <text
                    x={(conn.from.x + conn.to.x) / 2}
                    y={(conn.from.y + conn.to.y) / 2 - 5}
                    textAnchor="middle"
                    fill="#ef4444"
                    fontSize="14"
                    fontWeight="bold"
                  >
                    
                  </text>
                )}
              </g>
            ))}
          </svg>

          {/* Карточки членов семьи */}
          {nodes.map((node) => {
            const isExpanded = expandedNodes.has(node.id);
            const hasChildren = node.children && node.children.length > 0;
            const hasSpouse = node.spouse !== null;
            const isSpouse = node.role.includes('Жена') || node.role.includes('Муж') || node.role.includes('супруг');
            const isDragging = draggingNode === node.id;

            return (
              <div
                key={node.id}
                className="absolute transition-all duration-100"
                style={{
                  left: node.position.x,
                  top: node.position.y,
                  width: CARD_WIDTH,
                  zIndex: isDragging ? 10 : 1,
                  transform: isDragging ? 'scale(1.05)' : 'scale(1)',
                  opacity: isDragging ? 0.9 : 1,
                  touchAction: 'none',
                }}
                data-card="true"
                onMouseDown={(e) => handleDragStart(node.id, e)}
                onTouchStart={(e) => handleDragStart(node.id, e)}
                onClick={(e) => !isSpouse && handleCardClick(node.id, e)}
              >
                <Card className={`
                  shadow-lg border-2 bg-white/95 hover:shadow-xl transition-all duration-200
                  ${isExpanded ? 'border-blue-500' : 'border-gray-200'}
                  ${hasChildren && !isSpouse ? 'hover:border-blue-400 cursor-pointer' : 'hover:border-gray-300 cursor-move'}
                  ${isSpouse ? 'border-red-200 cursor-move' : ''}
                  ${isDragging ? 'shadow-2xl border-yellow-500' : ''}
                  touch-none select-none
                `}>
                  <CardBody className="p-3">
                    <div className="flex flex-col items-center text-center">
                      {/* Фото */}
                      <div className="mb-2 w-14 h-14 rounded-full overflow-hidden border-2 border-indigo-100 shadow-sm">
                        <img
                          src={node.photo}
                          alt={node.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          draggable="false"
                        />
                      </div>

                      {/* Имя */}
                      <Typography
                        variant="small"
                        className="font-bold text-gray-800 mb-1 text-sm leading-tight select-none"
                      >
                        {node.name}
                      </Typography>

                      {/* Роль */}
                      <Typography
                        variant="small"
                        className={`text-xs px-2 py-1 rounded-full mb-1 ${isSpouse
                          ? 'bg-red-50 text-red-600'
                          : 'bg-blue-50 text-blue-600'
                          } select-none`}
                      >
                        {node.role}
                      </Typography>

                      {/* Год рождения */}
                      <Typography
                        variant="small"
                        className="text-gray-500 text-xs mb-1 select-none"
                      >
                        {node.birthYear} г.р.
                      </Typography>

                      {/* Индикаторы */}
                      <div className="flex items-center justify-center gap-2 mt-1">
                        {hasChildren && !isSpouse && (
                          <div className="flex items-center text-xs select-none">
                            <span className={`mr-1 ${isExpanded ? 'text-green-600' : 'text-gray-500'}`}>
                              {node.children.length} дет.
                            </span>
                            <span className={isExpanded ? 'text-green-600' : 'text-gray-400'}>
                              {isExpanded ? '▼' : '▶'}
                            </span>
                          </div>
                        )}

                        <div className="text-xs text-gray-400 select-none"
                          title={isSpouse ? "Перетаскивайте" : "Клик - показать детей, перетаскивание - переместить"}>
                          {isSpouse ? '🖱️' : ''}
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </div>
            );
          })}
        </div>


        {/* Индикатор масштаба */}
        <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg shadow px-3 py-2 border border-gray-200">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium text-gray-700 select-none">
              {Math.round(zoom * 100)}%
            </span>
          </div>
        </div>




      </div>
    </div>
  );
};

export default DashboardFamilyTree;