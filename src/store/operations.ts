import { makeAutoObservable, runInAction } from 'mobx'

import { ExportTypeEnum } from '@core/enum/export-type.enum'
import { getApiUrl } from '@core/get-api-url'
import dtreeStore from '@store/dtree'
import datasetStore from './dataset'
import dirinfoStore from './dirinfo'

class OperationsStore {
  savingStatus: [boolean, string] = [false, '']
  isCreationOver = true

  constructor() {
    makeAutoObservable(this)
  }

  async macroTaggingAsync({ tag, off }: { tag: string; off?: boolean }) {
    const body = new URLSearchParams({
      ds: datasetStore.datasetName,
      tag,
      conditions: JSON.stringify(datasetStore.conditions),
      filter: datasetStore.activePreset,
    })

    off && body.append('off', String(off))

    const response = await fetch(
      getApiUrl(`macro_tagging?ds=${datasetStore.datasetName}&tag=${tag}`),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      },
    )

    await response.json()

    datasetStore.initDatasetAsync(datasetStore.datasetName)
    dirinfoStore.fetchDsinfoAsync(datasetStore.datasetName)
  }

  async exportReportAsync(exportType?: ExportTypeEnum) {
    const body = new URLSearchParams({
      ds: datasetStore.datasetName,
    })

    if (datasetStore.activePreset) {
      body.append('filter', datasetStore.activePreset)
    } else {
      body.append('conditions', `[]`)
    }

    if (datasetStore.zone.length > 0) {
      const zoneParams = datasetStore.zone.map(
        item =>
          `["${item[0]}",["${item[1].toString().split(',').join('","')}"]]`,
      )

      const zone = `[${zoneParams}]`

      body.append('zone', zone)
    }

    if (exportType === ExportTypeEnum.Excel) {
      const response = await fetch(getApiUrl(`export`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      })

      const result = await response.json()
      const responseFile = await fetch(getApiUrl(result.fname))

      await responseFile.blob().then(blob => {
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')

        a.href = url
        a.download = `${datasetStore.datasetName}.xlsx`
        a.click()

        return
      })
    }

    if (exportType === ExportTypeEnum.CSV) {
      body.append('schema', 'xbr')

      const response = await fetch(getApiUrl(`csv_export`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      })

      await response.blob().then(blob => {
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')

        a.href = url
        a.download = `${datasetStore.datasetName}.csv`
        a.click()

        return
      })
    }
  }

  async saveDatasetAsync(
    wsName: string,
  ): Promise<{ ok: boolean; message?: string }> {
    this.resetIsCreationOver()

    const body = new URLSearchParams({
      ds: datasetStore.datasetName,
      ws: wsName,
      code: dtreeStore.dtreeCode,
    })

    const compareValue = dtreeStore.acceptedVariants

    if (!(compareValue > 0 && compareValue < 9000)) {
      this.setIsCreationOver()

      return {
        ok: false,
        message: 'Too many variants',
      }
    }

    datasetStore.setIsLoadingTabReport(true)

    const response = await fetch(getApiUrl(`ds2ws`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    })

    const result = await response.json()

    const jobStatusResponse = await this.getJobStatusAsync(result.task_id)

    if (!jobStatusResponse.ok) {
      return { ok: false, message: jobStatusResponse?.message }
    }

    this.setIsCreationOver()

    datasetStore.setIsLoadingTabReport(false)

    return { ok: true }
  }

  async getJobStatusAsync(taskId: string): Promise<any> {
    const response = await fetch(getApiUrl(`job_status?task=${taskId}`))

    const result = await response.json()

    if (result[0] === null) {
      this.setIsCreationOver()

      return { ok: false, message: result[1] }
    }

    runInAction(() => {
      this.savingStatus = result

      if (this.savingStatus[1] === 'Done') this.setIsCreationOver()
    })

    return !result[0]
      ? setTimeout(async () => await this.getJobStatusAsync(taskId), 1000)
      : { ok: true, data: result }
  }

  setIsCreationOver() {
    this.isCreationOver = true
  }

  resetIsCreationOver() {
    this.isCreationOver = false
  }

  resetSavingStatus() {
    this.savingStatus = [false, '']
  }
}

export default new OperationsStore()
