/* eslint-disable max-lines */
import { cloneDeep } from 'lodash'
import get from 'lodash/get'
import { makeAutoObservable, runInAction } from 'mobx'

import { DtreeStatType, StatList } from '@declarations'
import { getApiUrl } from '@core/get-api-url'
import { splitDtreeCode } from '@utils/splitDtreeCode'
import datasetStore from './dataset'

type IStepData = {
  step?: number
  groups?: any
  negate?: boolean
  excluded: boolean
  isActive?: boolean
  startFilterCounts: number
  finishFilterCounts: number
  difference: number
  comment?: string
}

interface IRequestData {
  operation: number
  request: {
    setCode: string
    statCode: string
  }
}

class DtreeStore {
  dtreeList: any
  dtree: any
  dtreeCode = ''

  dtreeStat: DtreeStatType = {}
  statAmount: number[] = []

  selectedGroups: any = []
  selectedFilters: string[] = []
  dtreeStepIndices: string[] = []

  isFilterContentExpanded = false
  filterChangeIndicator = 0
  isFiltersLoading = false
  isDtreeLoading = false

  isResultsContentExpanded = false
  resultsChangeIndicator = 0

  searchFieldFilterList = ''
  searchFieldResults = ''
  filteredCounts = 0

  stepData: IStepData[] = [
    {
      step: 1,
      excluded: true,
      isActive: true,
      startFilterCounts: 0,
      finishFilterCounts: 0,
      difference: 0,
    },
  ]
  stepAmout = 0

  isModalAttributeVisible = false
  isModalSelectFilterVisible = false
  isModalEditFiltersVisible = false
  isModalJoinVisible = false
  isModalEditNumbersVisible = false

  groupNameToChange = ''
  groupIndexToChange = 0

  currentStepIndex = 0

  requestData: IRequestData[] = []

  constructor() {
    makeAutoObservable(this)
  }

  async fetchDtreeListAsync() {
    const body = new URLSearchParams({
      ds: datasetStore.datasetName,
      code: 'return False',
    })

    const response = await fetch(getApiUrl(`dtree_set`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    })

    const result = await response.json()

    runInAction(() => {
      this.dtreeList = result['dtree-list']
    })
  }

  async fetchDtreeAsync(name: string) {
    const body = new URLSearchParams({
      ds: datasetStore.datasetName,
      dtree: name,
    })

    const response = await fetch(getApiUrl(`dtree_set`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    })

    const result = await response.json()

    runInAction(() => {
      this.dtree = result
      this.dtreeCode = result['code']
    })

    this.drawDecesionTree()
  }

  splitDtreeCode() {
    const stepCodes: any[] = []

    this.dtreeCode.split('return').forEach((item: string) => {
      stepCodes.push(item.trim())
    })

    const filteredData = stepCodes.filter(Boolean)

    return filteredData
  }

  drawDecesionTree() {
    const dtreeSteps = Object.values(this.dtree['cond-atoms'])

    const dtreePointCounts: number[][] = Object.values(
      this.dtree['point-counts'],
    )

    const splittedCode = this.splitDtreeCode()

    const indexOfLabel: number[] = []

    splittedCode.map((item: string, index: number) => {
      if (item.includes('label')) {
        indexOfLabel.push(index)
      }
    })

    if (indexOfLabel.length > 0) {
      indexOfLabel.map((item: number) => {
        dtreePointCounts.splice(item * 2, 1)
      })
    }

    const stepCodes = splitDtreeCode(this.dtreeCode)

    const localStepData: IStepData[] = []

    dtreeSteps.map((item: any, index: number) => {
      localStepData.push({
        step: index + 1,
        groups: item,
        excluded: !stepCodes[index].result,
        isActive: false,
        startFilterCounts: dtreePointCounts[index * 2][1],
        finishFilterCounts: dtreePointCounts[index * 2 + 2][1],
        difference:
          index === 0
            ? dtreePointCounts[index + 1][0]
            : dtreePointCounts[index * 2 + 1][0],
        comment: stepCodes[index].comment,
      })
    })
    localStepData.map((step: IStepData, index: number) => {
      if (step.groups.length > 1) {
        step.groups.map((group: any[], currNo: number) => {
          currNo !== 0 &&
            group.splice(-1, 0, stepCodes[index].types[currNo - 1])
        })
      }
    })

    localStepData.map((step: IStepData) => {
      step.groups.map((group: any[], index: number) => {
        step.groups[index] = group.filter((elem: any[]) => elem)
      })
    })

    runInAction(() => {
      this.stepData = [...localStepData]
      this.dtreeStepIndices = Object.keys(this.dtree['cond-atoms'])
    })
  }

  async fetchDtreeStatAsync(code = 'return False', no = '0') {
    const body = new URLSearchParams({
      ds: datasetStore.datasetName,
      no,
      code,
    })

    const response = await fetch(getApiUrl(`dtree_stat`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    })

    const result = await response.json()

    runInAction(() => {
      this.dtreeStat = result
      this.statAmount = get(result, 'filtered-counts', [])
      this.filteredCounts = this.statAmount[1]
    })
    this.resetIsFiltersLoading()
  }

  get getQueryBuilder() {
    const groups: Record<string, StatList[]> = {}

    this.dtreeStat['stat-list'] &&
      this.dtreeStat['stat-list'].forEach((item: StatList) => {
        if (
          (item.title || item.name) &&
          (item.title || item.name)
            .toLocaleLowerCase()
            .includes(this.searchFieldFilterList.toLocaleLowerCase())
        ) {
          if (groups[item.vgroup]) {
            groups[item.vgroup] = [...groups[item.vgroup], item]
          } else {
            groups[item.vgroup] = [item]
          }
        }
      })

    return groups
  }

  getLastStepIndexForApi = () => {
    const lastIndexValue = Number(
      this.dtreeStepIndices[this.currentStepIndex - 1],
    )

    const currentIndex = lastIndexValue + 2

    return currentIndex
  }

  async fetchDtreeSetAsync(subGroupName: string) {
    this.setIsFiltersLoading()

    const currentCode = this.dtreeCode || 'return False'

    const body = new URLSearchParams({
      ds: datasetStore.datasetName,
      code: currentCode,
    })

    const currentIndex = this.getLastStepIndexForApi()

    body.append(
      'instr',
      JSON.stringify([
        'POINT',
        'INSERT',
        currentIndex,
        ['enum', subGroupName, '', this.selectedFilters],
      ]),
    )

    const response = await fetch(getApiUrl(`dtree_set`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    })

    const result = await response.json()

    const newCode = result.code

    runInAction(() => {
      this.dtree = result
      this.dtreeCode = newCode
    })

    this.drawDecesionTree()
  }

  addSelectedGroup(group: any) {
    this.selectedGroups = []
    this.selectedGroups = group
  }

  addSelectedFilter(filter: string) {
    this.selectedFilters = [...this.selectedFilters, filter]
  }

  removeSelectedFilter(filter: string) {
    this.selectedFilters = this.selectedFilters.filter(item => item !== filter)
  }

  addStepData(subGroupName: string, typeOfAttr: string) {
    const currentStep = this.stepData[this.currentStepIndex]

    if (!currentStep.groups || currentStep.groups.length === 0) {
      currentStep.groups = [[typeOfAttr, this.selectedGroups[1]]]
    } else if (!currentStep.groups.join().includes(this.selectedGroups[1])) {
      currentStep.groups = [...currentStep.groups, this.selectedGroups]
    }

    currentStep.groups.map((item: string, index: number) => {
      if (item[1] === subGroupName) {
        currentStep.groups[index][2] = this.selectedFilters
      }
    })

    this.selectedFilters = []
  }

  joinStepData(typeOfJoin: string, typeOfAttr: string) {
    const currentStep = this.stepData[this.currentStepIndex]

    currentStep.groups = [
      ...currentStep.groups,
      [typeOfAttr, this.selectedGroups[1], typeOfJoin, this.selectedFilters],
    ]

    this.selectedFilters = []
  }

  removeStepData(indexOfCurrentGroup: number) {
    this.stepData[this.currentStepIndex].groups.splice(indexOfCurrentGroup, 1)
    this.isModalEditFiltersVisible = false

    if (this.stepData[0].groups[0] && this.stepData[0].groups[0][3]) {
      this.stepData[0].groups[0].pop()
    }
  }

  updateStepData(indexOfCurrentGroup: number) {
    const currentGroupLength = this.stepData[this.currentStepIndex].groups[
      indexOfCurrentGroup
    ].length

    this.stepData[this.currentStepIndex].groups[indexOfCurrentGroup][
      currentGroupLength - 1
    ] = this.selectedFilters
  }

  replaceStepData(subGroupName: string, typeOfAttr: string) {
    this.stepData[this.currentStepIndex].groups = []
    this.addStepData(subGroupName, typeOfAttr)
  }

  resetSelectedFilters() {
    this.selectedFilters = []
  }

  openModalAttribute(index: number) {
    this.isModalAttributeVisible = true

    this.currentStepIndex = index
  }

  closeModalAttribute() {
    this.isModalAttributeVisible = false
  }

  openModalSelectFilter() {
    this.isModalSelectFilterVisible = true
  }

  closeModalSelectFilter() {
    this.isModalSelectFilterVisible = false
  }

  openModalEditFilters(
    groupName: string,
    stepIndex: number,
    groupIndex: number,
  ) {
    this.isModalEditFiltersVisible = true
    this.groupNameToChange = groupName
    this.groupIndexToChange = groupIndex

    this.currentStepIndex = stepIndex
  }

  closeModalEditFilters() {
    this.isModalEditFiltersVisible = false
    this.selectedFilters = []
  }

  openModalJoin() {
    this.isModalJoinVisible = true
  }

  closeModalJoin() {
    this.isModalJoinVisible = false
  }

  openModalEditNumbers(
    groupName: string,
    stepIndex: number,
    groupIndex: number,
  ) {
    this.isModalEditNumbersVisible = true
    this.groupNameToChange = groupName
    this.groupIndexToChange = groupIndex

    this.currentStepIndex = stepIndex
  }

  closeModalEditNumbers() {
    this.isModalEditNumbersVisible = false
  }

  addStep(index: number) {
    if (this.stepData.length === 0) {
      this.stepData = [
        {
          step: 1,
          excluded: true,
          isActive: true,
          startFilterCounts: 0,
          finishFilterCounts: 0,
          difference: 0,
        },
      ]
    } else {
      this.currentStepIndex = index + 1

      const startFilterCounts = this.stepData[index].finishFilterCounts

      this.stepData = [
        ...this.stepData,
        {
          step: this.stepData.length + 1,
          excluded: true,
          isActive: true,
          startFilterCounts,
          finishFilterCounts: startFilterCounts,
          difference: 0,
        },
      ]
    }
  }

  insertStep(type: string, index: number) {
    if (type === 'BEFORE') {
      this.stepData.splice(index, 0, {
        step: index,
        excluded: true,
        isActive: true,
        startFilterCounts: 0,
        finishFilterCounts: 0,
        difference: 0,
      })
    } else {
      this.stepData.splice(index + 1, 0, {
        step: index,
        excluded: true,
        isActive: true,
        startFilterCounts: 0,
        finishFilterCounts: 0,
        difference: 0,
      })
    }

    this.stepData.map((item, currNo: number) => {
      item.step = currNo + 1
    })
  }

  duplicateStep(index: number) {
    const clonedStep = cloneDeep(this.stepData[index])

    this.stepData.splice(index + 1, 0, clonedStep)

    this.stepData.map((item, currNo: number) => {
      item.step = currNo + 1
    })
  }

  removeStep(index: number) {
    this.stepData.splice(index, 1)

    this.stepData.map((item, currNo: number) => {
      item.step = currNo + 1
    })
  }

  negateStep(index: number) {
    if (!this.stepData[index].negate) {
      this.stepData[index].negate = true
    } else {
      this.stepData[index].negate = !this.stepData[index].negate
    }
  }

  expandFilterContent() {
    this.isFilterContentExpanded = true
    this.filterChangeIndicator++
  }

  collapseFilterContent() {
    this.isFilterContentExpanded = false
    this.filterChangeIndicator--
  }

  resetFilterChangeIndicator() {
    this.filterChangeIndicator = 0
  }

  expandResultsContent() {
    this.isResultsContentExpanded = true
    this.resultsChangeIndicator++
  }

  collapseResultsContent() {
    this.isResultsContentExpanded = false
    this.resultsChangeIndicator--
  }

  resetResultsChangeIndicator() {
    this.resultsChangeIndicator = 0
  }

  addSearchFieldFilterList(item: string) {
    this.searchFieldFilterList = item
  }

  addSearchFieldResults(item: string) {
    this.searchFieldResults = item
  }

  setIsFiltersLoading() {
    this.isFiltersLoading = true
  }

  resetIsFiltersLoading() {
    this.isFiltersLoading = false
  }

  toggleIsExcluded(index: number) {
    this.stepData[index].excluded = !this.stepData[index].excluded

    // this.stepData[index].excluded && this.updateStatListAsync(index, '2')
    // !this.stepData[index].excluded && this.updateStatListAsync(index, '1')
  }
}
export default new DtreeStore()
