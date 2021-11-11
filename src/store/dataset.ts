/* eslint-disable max-lines */
import cloneDeep from 'lodash/cloneDeep'
import get from 'lodash/get'
import { makeAutoObservable, runInAction } from 'mobx'

import { DsStatType, StatList, TabReportType, WsTagsType } from '@declarations'
import { FilterKindEnum } from '@core/enum/filter-kind.enum'
import { getApiUrl } from '@core/get-api-url'
import filterStore from '@store/filter'
import dirinfoStore from './dirinfo'
import operations from './operations'

const INCREASE_INDEX = 50

class DatasetStore {
  dsStat: DsStatType = {}
  variantsAmount = 0
  tabReport: TabReportType[] = []
  wsTags: WsTagsType = {}
  genes: string[] = []
  genesList: string[] = []
  tags: string[] = []
  samples: string[] = []

  wsRecords: { no: number; cl: string; dt: string; lb: string }[] = []
  offset = 0
  filteredNo: number[] = []

  datasetName = ''
  activePreset = ''
  conditions: any[] = []
  zone: any[] = []
  statAmount: number[] = []

  indexTabReport = 0
  indexFilteredNo = 0

  isXL = true
  isLoadingTabReport = false
  isFetchingMore = false
  isLoadingDsStat = false
  isFilterDisabled = false

  reportsLoaded = false

  searchField = ''

  constructor() {
    makeAutoObservable(this)
  }

  setIsXL(value: boolean) {
    this.isXL = value
  }

  setIndexTabReport(value: number): void {
    this.indexTabReport = value
  }

  setIndexFilteredNo(value: number): void {
    this.indexFilteredNo = value
  }

  setFilteredNo(value: number[]): void {
    this.filteredNo = value
  }

  setTableOffest(value: number) {
    this.offset = value
  }

  setIsFilterDisabled(value: boolean) {
    this.isFilterDisabled = value
  }

  setActivePreset(value: string) {
    this.activePreset = value
  }

  setIsLoadingTabReport(value: boolean) {
    this.isLoadingTabReport = value
  }

  setZoneIndex(zone: [string, string[]], index: number): void {
    this.zone[index] = zone
  }

  setDatasetName(datasetName: string) {
    this.datasetName = datasetName
  }

  addZone(zone: [string, string[]]) {
    if (zone[1].length === 0) {
      this.zone = this.zone.filter(item => item[0] !== zone[0])

      return
    }

    if (this.zone.length === 0) {
      this.zone = [...this.zone, zone]

      return
    }

    const indexOfExistingZone = this.zone.findIndex(elem => elem[0] === zone[0])

    indexOfExistingZone !== -1
      ? (this.zone[indexOfExistingZone] = zone)
      : (this.zone = [...this.zone, zone])
  }

  removeZone(zone: [string, string[]]) {
    this.zone.map((item, index) => {
      if (item[0] === zone[0]) {
        this.setZoneIndex(zone, index)
      }
    })

    this.zone = this.zone.filter(item => item[1].length > 0)
  }

  clearZone() {
    this.zone = []
  }

  async setConditionsAsync(conditions: any[][]) {
    if (!conditions[0]) {
      this.conditions = []
      await this.fetchDsStatAsync()
    }

    const groupCondtionsIndex = this.conditions.findIndex(
      (item: any) => item[1] === conditions[0][1],
    )

    if (groupCondtionsIndex !== -1) {
      this.conditions.splice(groupCondtionsIndex, 1)
    }

    this.conditions = this.conditions.concat(conditions)

    await this.fetchDsStatAsync()

    return Array.from({ length: this.statAmount[0] })
  }

  async removeFunctionConditionAsync(functionName: string) {
    this.conditions = this.conditions.filter(
      ([_, name]) => name !== functionName,
    )

    await this.fetchDsStatAsync()
  }

  removeCondition({
    subGroup,
    itemName,
  }: {
    subGroup: string
    itemName: string
  }) {
    const cloneConditions = cloneDeep(this.conditions)

    const subGroupIndex = cloneConditions.findIndex(
      item => item[1] === subGroup,
    )

    const conditionKind = cloneConditions.find(item => item[1] === subGroup)[0]

    if (conditionKind === FilterKindEnum.Enum) {
      const filteredItems = cloneConditions[subGroupIndex][3].filter(
        (item: string) => item !== itemName,
      )

      if (filteredItems.length === 0) {
        cloneConditions.splice(subGroupIndex, 1)
      } else {
        cloneConditions[subGroupIndex][3] = filteredItems
      }
    } else {
      cloneConditions.splice(subGroupIndex, 1)
    }

    this.conditions = cloneConditions

    this.fetchDsStatAsync()
  }

  removeConditionGroup({ subGroup }: { subGroup: string }) {
    const cloneConditions = cloneDeep(this.conditions)

    const subGroupIndex = cloneConditions.findIndex(
      item => item[1] === subGroup,
    )

    if (subGroupIndex !== -1) {
      cloneConditions.splice(subGroupIndex, 1)
    }

    this.conditions = cloneConditions

    this.fetchDsStatAsync()
  }

  resetData() {
    this.datasetName = ''
    this.zone = []
  }

  async initDatasetAsync(datasetName: string) {
    this.resetData()
    this.datasetName = datasetName

    await dirinfoStore.fetchDsinfoAsync(datasetName)
    await this.fetchDsStatAsync()
    await this.fetchWsTagsAsync()
    await this.fetchWsListAsync(this.isXL)
    this.filteredNo.length === 0
      ? await this.fetchTabReportAsync()
      : await this.fetchFilteredTabReportAsync()
  }

  get getFilterRefiner() {
    const groups: Record<string, StatList[]> = {}

    this.dsStat['stat-list'] &&
      this.dsStat['stat-list'].forEach((item: StatList) => {
        if (
          (item.title || item.name) &&
          (item.title || item.name)
            .toLocaleLowerCase()
            .includes(this.searchField.toLocaleLowerCase())
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

  async fetchDsStatAsync() {
    this.isLoadingDsStat = true
    this.setIsLoadingTabReport(true)

    const body = new URLSearchParams({
      ds: this.datasetName,
    })

    if (!this.isFilterDisabled) {
      body.append('conditions', JSON.stringify(this.conditions))
      body.append('zone', JSON.stringify(this.zone))
    }

    this.activePreset && body.append('filter', this.activePreset)

    const response = await fetch(getApiUrl(`ds_stat`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    })

    const result = await response.json()

    runInAction(() => {
      this.dsStat = result
      this.variantsAmount = result['total-counts']['0']
      this.statAmount = get(result, 'filtered-counts', [])
      this.isLoadingDsStat = false
    })
  }

  updatePresetLoad(dsStatData: any) {
    this.conditions = dsStatData.conditions
    filterStore.selectedFilters = {}

    dsStatData.conditions?.forEach((condition: any[]) => {
      const name = condition[1]

      const filterItem = dsStatData['stat-list']?.find(
        (item: any) => item.name === name,
      )

      if (condition[0] === FilterKindEnum.Enum) {
        condition[3]?.forEach((value: string) => {
          filterStore.addSelectedFilters({
            group: filterItem.vgroup,
            groupItemName: name,
            variant: [value, 0],
          })
        })
      }
    })

    this.fetchDsStatAsync()
  }

  async fetchTabReportAsync() {
    if (
      this.indexTabReport !== 0 &&
      this.indexTabReport < this.variantsAmount
    ) {
      this.isFetchingMore = true
    }

    if (this.variantsAmount > this.indexTabReport) {
      const arrayLength =
        this.variantsAmount < INCREASE_INDEX
          ? this.variantsAmount
          : INCREASE_INDEX

      const seq = Array.from(
        { length: arrayLength },
        (_, i) => i + this.indexTabReport,
      )

      await this._fetchTabReportAsync(this.datasetName, seq)

      runInAction(() => {
        this.indexTabReport += INCREASE_INDEX
      })
    }
  }

  async _fetchTabReportAsync(dsName: string, seq: number[]) {
    if (seq.length === 0) {
      this.setIsLoadingTabReport(false)
      this.isFetchingMore = false

      return
    }

    const response = await fetch(getApiUrl(`tab_report`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        ds: String(dsName),
        schema: 'xbr',
        seq: JSON.stringify(seq),
      }),
    })

    const result = await response.json()

    runInAction(() => {
      this.tabReport = [...this.tabReport, ...result]
      this.reportsLoaded = this.tabReport.length === this.variantsAmount
      this.isFetchingMore = false
    })

    this.setIsLoadingTabReport(false)
  }
  async fetchFilteredTabReportAsync() {
    const seq = this.filteredNo.slice(
      this.indexFilteredNo,
      this.indexFilteredNo + INCREASE_INDEX,
    )

    if (this.indexFilteredNo === 0) {
      this.setIsLoadingTabReport(true)
      this.tabReport = []
    } else {
      this.isFetchingMore = true
    }

    await this._fetchTabReportAsync(this.datasetName, seq)

    this.indexFilteredNo += INCREASE_INDEX
    this.isFetchingMore = false
  }

  async fetchWsTagsAsync() {
    if (this.isXL) return

    const response = await fetch(
      getApiUrl(`ws_tags?ds=${this.datasetName}&rec=${0}`),
      {
        method: 'POST',
      },
    )

    const result = await response.json()

    runInAction(() => {
      this.wsTags = result
      this.tags = [...result['op-tags'], ...result['check-tags']].filter(
        item => item !== '_note',
      )
    })
  }

  async fetchWsListAsync(isXL?: boolean) {
    const body = new URLSearchParams({
      ds: this.datasetName,
    })

    if (!this.isFilterDisabled) {
      body.append('conditions', JSON.stringify(this.conditions))
      body.append('zone', JSON.stringify(this.zone))
    }

    this.activePreset && body.append('filter', this.activePreset)

    const response = await fetch(getApiUrl(isXL ? `ds_list` : `ws_list`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    })

    const result = await response.json()

    this.indexFilteredNo = 0

    if (isXL) {
      const taskResult = await operations.getJobStatusAsync(result.task_id)

      runInAction(() => {
        this.filteredNo = taskResult?.data?.[0].samples
          ? taskResult.data[0].samples.map(
              (variant: { no: number }) => variant.no,
            )
          : []
      })
    } else {
      runInAction(() => {
        this.filteredNo = result.records
          ? result.records.map((variant: { no: number }) => variant.no)
          : []

        this.statAmount = get(result, 'filtered-counts', [])
        this.wsRecords = result.records
      })
    }

    await this.fetchFilteredTabReportAsync()

    return this.filteredNo
  }

  async fetchZoneListAsync(zone: string) {
    const body = new URLSearchParams({ ds: this.datasetName, zone })

    const response = await fetch(getApiUrl(`zone_list`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    })

    const result = await response.json()

    runInAction(() => {
      zone === 'Symbol'
        ? (this.genes = result.variants)
        : (this.genesList = result.variants)
    })
  }

  async fetchSamplesZoneAsync() {
    const body = new URLSearchParams({
      ds: this.datasetName,
      zone: 'Has_Variant',
    })

    const response = await fetch(getApiUrl(`zone_list`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    })

    const result = await response.json()

    runInAction(() => {
      this.samples = result.variants
    })
  }

  addSearchField = (item: string) => {
    this.searchField = item
  }
}

export default new DatasetStore()
