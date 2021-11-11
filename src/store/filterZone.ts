import { difference } from 'lodash'
import { makeAutoObservable } from 'mobx'

import { getApiUrl } from '@core/get-api-url'
import zoneStore from '@store/filterZone'
import datasetStore from './dataset'

const ADD = true

class ZoneStore {
  selectedGenes: string[] = []
  selectedGenesList: string[] = []
  selectedSamples: string[] = []
  selectedTags: string[] = []

  isFather: boolean | undefined = false
  isMother: boolean | undefined = false
  isProband: boolean | undefined = false

  isModeNOT = false
  isModeWithNotes = false

  constructor() {
    makeAutoObservable(this)
  }

  addGene(gene: string) {
    this.selectedGenes = [...this.selectedGenes, gene]
  }

  removeGene(geneName: string) {
    this.selectedGenes = this.selectedGenes.filter(gene => geneName !== gene)

    datasetStore.removeZone(['Symbol', this.selectedGenes])
  }

  unselectAllGenes() {
    this.selectedGenes = []
    datasetStore.addZone(['Symbol', zoneStore.selectedGenes])
  }

  addGenesList(gene: string) {
    this.selectedGenesList = [...this.selectedGenesList, gene]
  }

  removeGenesList(geneName: string) {
    this.selectedGenesList = this.selectedGenesList.filter(
      genesList => geneName !== genesList,
    )

    datasetStore.removeZone(['Panels', this.selectedGenesList])
  }

  unselectAllGenesList() {
    this.selectedGenesList = []
    datasetStore.addZone(['Panels', zoneStore.selectedGenesList])
  }

  addSample(sample: string) {
    this.selectedSamples = [...this.selectedSamples, sample]
  }

  removeSample(sample: string) {
    this.selectedSamples = this.selectedSamples.filter(
      sampleItem => sampleItem !== sample,
    )

    datasetStore.removeZone(['Has_Variant', this.selectedSamples])
  }

  paintSelectedSamples() {
    this.selectedSamples.map(sample => this.checkSampleType(sample, ADD))
  }

  checkSampleType(sample: string, isAdding = false) {
    const type = sample.slice(0, 7).trim()

    if (type === 'father') {
      this.isFather = isAdding
    } else if (type === 'mother') {
      this.isMother = isAdding
    } else if (type === 'proband') {
      this.isProband = isAdding
    }
  }

  unselectAllSamples = () => {
    this.selectedSamples = []
    this.isFather = false
    this.isMother = false
    this.isProband = false
    datasetStore.addZone(['Has_Variant', zoneStore.selectedSamples])
  }

  addTag(tagName: string) {
    this.selectedTags = [...this.selectedTags, tagName]
  }

  removeTag(tagName: string) {
    this.selectedTags = this.selectedTags.filter(tag => tag !== tagName)

    tagName === '_note' && this.resetModeWithNotes()

    datasetStore.removeZone(['_tags', this.selectedTags])
  }

  unselectAllTags() {
    this.selectedTags = []
    this.resetModeNOT()
    this.resetModeWithNotes()
    this.fetchTagSelectAsync()
  }

  resetAllSelectedItems() {
    this.selectedGenes = []
    this.selectedGenesList = []
    this.selectedSamples = []
    this.selectedTags = []
    this.isFather = false
    this.isMother = false
    this.isProband = false
  }

  async fetchTagSelectAsync() {
    if (this.selectedTags.length === 0 && !this.isModeWithNotes) {
      datasetStore.indexTabReport = 0
      await datasetStore.fetchTabReportAsync()

      return
    }

    this.isModeWithNotes && this.selectedTags.push('_note')

    if (!this.isModeWithNotes && this.selectedTags.includes('_note')) {
      this.selectedTags = this.selectedTags.filter(item => item !== '_note')
    }

    const filteredData = await Promise.all(
      (this.isModeNOT
        ? difference(datasetStore.tags, this.selectedTags)
        : this.selectedTags
      ).map(async tag => {
        const response = await fetch(
          getApiUrl(`tag_select?ds=${datasetStore.datasetName}&tag=${tag}`),
        )

        const result = await response.json()
        const currentNo = result['tag-rec-list']

        return currentNo
      }),
    )

    const uniqueNo = Array.from(new Set(filteredData.flat()))

    datasetStore.indexFilteredNo = 0
    datasetStore.filteredNo = uniqueNo

    await datasetStore.fetchFilteredTabReportAsync()
  }

  setModeNOT() {
    this.isModeNOT = true
  }

  resetModeNOT() {
    this.isModeNOT = false
  }

  setModeWithNotes() {
    this.isModeWithNotes = true
  }

  resetModeWithNotes() {
    this.isModeWithNotes = false
  }
}

export default new ZoneStore()
