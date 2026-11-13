/**
 * tableGridNavigation.js
 * 
 * High-productivity Excel & Google Sheets style keyboard navigation for data-entry tables.
 * Supports:
 * - Enter / Shift+Enter (Move down / up in same column, auto-adds row at end)
 * - ArrowUp / ArrowDown (Move up / down in same column)
 * - ArrowLeft / ArrowRight (Move left / right between columns)
 * - Auto-select on focus for instant overwrite without backspace
 * - Cross-row wrapping: Right-arrow at end of row wraps to next row col 0
 */

export const focusGridCell = (grid, row, col) => {
  if (typeof document === "undefined") return;
  const selector = `[data-grid="${grid}"][data-row="${row}"][data-col="${col}"]`;
  const el = document.querySelector(selector);
  if (el) {
    el.focus();
    if (typeof el.select === "function" && el.type !== "button") {
      try {
        el.select();
      } catch {
        // ignore
      }
    }
  }
};

export const handleTableGridKeyDown = (
  e,
  { grid, row, col, maxRows, maxCols, onEnterLastRow }
) => {
  const { key, shiftKey, target } = e;

  // 1. Enter Key: Excel model (Move Down, or Shift+Enter to Move Up)
  if (key === "Enter") {
    e.preventDefault();
    if (shiftKey) {
      const nextRow = Math.max(0, row - 1);
      focusGridCell(grid, nextRow, col);
    } else {
      const nextRow = row + 1;
      if (nextRow < maxRows) {
        focusGridCell(grid, nextRow, col);
      } else if (typeof onEnterLastRow === "function") {
        onEnterLastRow();
        setTimeout(() => focusGridCell(grid, nextRow, col), 80);
      }
    }
    return;
  }

  // 2. Down Arrow (↓): Move to same column in the row below
  if (key === "ArrowDown") {
    e.preventDefault();
    const nextRow = Math.min(maxRows - 1, row + 1);
    focusGridCell(grid, nextRow, col);
    return;
  }

  // 3. Up Arrow (↑): Move to same column in the row above
  if (key === "ArrowUp") {
    e.preventDefault();
    const nextRow = Math.max(0, row - 1);
    focusGridCell(grid, nextRow, col);
    return;
  }

  // Safe cursor edge detection for horizontal navigation
  let isAtEnd = true;
  let isAtStart = true;
  try {
    if (target && target.type !== "number" && typeof target.selectionStart === "number") {
      const len = (target.value || "").length;
      isAtEnd = target.selectionStart === target.selectionEnd && target.selectionEnd === len;
      isAtStart = target.selectionStart === target.selectionEnd && target.selectionStart === 0;
    }
  } catch {
    isAtEnd = true;
    isAtStart = true;
  }

  // 4. Right Arrow (→): Move to adjacent column on the right
  if (key === "ArrowRight" && isAtEnd) {
    e.preventDefault();
    if (col + 1 < maxCols) {
      focusGridCell(grid, row, col + 1);
    } else if (row + 1 < maxRows) {
      // Wrap to start of next row
      focusGridCell(grid, row + 1, 0);
    }
    return;
  }

  // 5. Left Arrow (←): Move to adjacent column on the left
  if (key === "ArrowLeft" && isAtStart) {
    e.preventDefault();
    if (col - 1 >= 0) {
      focusGridCell(grid, row, col - 1);
    } else if (row - 1 >= 0) {
      // Wrap to end of previous row
      focusGridCell(grid, row - 1, maxCols - 1);
    }
    return;
  }
};
