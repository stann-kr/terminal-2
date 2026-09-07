const NODE_KEY = 'terminal_node_id';
let memoryNodeId: string | undefined;
let isStorageUnavailable = false;

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // O/0, I/1, L 제외

function generateNodeId(): string {
  const result = Array.from({ length: 5 }, () => (
    CHARS[Math.floor(Math.random() * CHARS.length)]
  )).join('');
  return `NODE-${result}`;
}

export function getNodeId(): string {
  if (typeof window === 'undefined') return '';
  if (!isStorageUnavailable) {
    try {
      const stored = window.localStorage.getItem(NODE_KEY);
      if (stored !== null) {
        memoryNodeId = stored;
        return stored;
      }
    } catch {
      isStorageUnavailable = true;
    }
  }
  if (memoryNodeId === undefined) setNodeId(generateNodeId());
  return memoryNodeId ?? '';
}

export function setNodeId(id: string): void {
  if (typeof window === 'undefined') return;
  memoryNodeId = id;
  if (isStorageUnavailable) return;
  try {
    window.localStorage.setItem(NODE_KEY, id);
  } catch {
    isStorageUnavailable = true;
  }
}
