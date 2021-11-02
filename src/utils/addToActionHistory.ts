import dtreeStore from '@store/dtree'

export const addToActionHistory = (body: URLSearchParams) => {
  const actionHistory = [...dtreeStore.actionHistory]
  const nextIndex = dtreeStore.actionHistoryIndex + 1

  if (dtreeStore.actionHistoryIndex > -1) {
    actionHistory.length = nextIndex
  }

  actionHistory.push(body)
  dtreeStore.setActionHistory(actionHistory)
  dtreeStore.setActionHistoryIndex(nextIndex)
}
