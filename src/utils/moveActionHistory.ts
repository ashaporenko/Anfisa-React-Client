import dtreeStore from '@store/dtree'

export const moveActionHistory = (value: 1 | -1) => {
  const updatedIndex = dtreeStore.actionHistoryIndex + value

  dtreeStore.setActionHistoryIndex(updatedIndex)

  const body = dtreeStore.actionHistory[updatedIndex]

  dtreeStore.fetchDtreeSetAsync(body, false)
}
