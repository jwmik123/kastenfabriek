export interface HandlePagesResult<T> {
  pages: T[][]
  initialPageIndex: number
}

export function computeHandlePages<T extends { id: string }>(
  items: T[],
  perPage: number,
  selectedId: string,
): HandlePagesResult<T> {
  if (items.length === 0 || perPage <= 0) {
    return { pages: [], initialPageIndex: 0 }
  }

  const pages: T[][] = []
  for (let i = 0; i < items.length; i += perPage) {
    pages.push(items.slice(i, i + perPage))
  }

  const selectedIndex = items.findIndex(item => item.id === selectedId)
  const initialPageIndex = selectedIndex >= 0 ? Math.floor(selectedIndex / perPage) : 0

  return { pages, initialPageIndex }
}
