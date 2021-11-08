import Checkbox from 'react-three-state-checkbox'
import { observer } from 'mobx-react-lite'

import datasetStore from '@store/dataset'
import zoneStore from '@store/filterZone'

interface Props {
  items: string[]
  isGenes?: boolean
  isGenesList?: boolean
  isSamples?: boolean
  isTags?: boolean
}

export const FilterItemList = observer(
  ({ items, isGenes, isGenesList, isSamples, isTags }: Props) => {
    const handleCheck = (checked: boolean, name: string) => {
      if (checked) {
        isGenes && zoneStore.addGene(name)
        isGenesList && zoneStore.addGenesList(name)
        isSamples && zoneStore.addSample(name)
        isTags && zoneStore.addTag(name)
      } else {
        isGenes && zoneStore.removeGene(name)
        isGenesList && zoneStore.removeGenesList(name)
        isSamples && zoneStore.removeSample(name)
        isTags && zoneStore.removeTag(name)
        datasetStore.fetchWsListAsync()
      }
    }

    return (
      <div className="mt-5 h-60 overflow-y-scroll">
        {items.map(item => (
          <div key={item} className="flex items-center mb-4">
            {isGenes && (
              <Checkbox
                checked={zoneStore.selectedGenes.includes(item)}
                className="w-4 h-4"
                onChange={e => handleCheck(e.target.checked, item)}
              />
            )}
            {isGenesList && (
              <Checkbox
                checked={zoneStore.selectedGenesList.includes(item)}
                className="w-4 h-4"
                onChange={e => handleCheck(e.target.checked, item)}
              />
            )}
            {isSamples && (
              <Checkbox
                checked={zoneStore.selectedSamples.includes(item)}
                className="w-4 h-4"
                onChange={e => handleCheck(e.target.checked, item)}
              />
            )}
            {isTags && (
              <Checkbox
                checked={zoneStore.selectedTags.includes(item)}
                className="w-4 h-4"
                onChange={e => handleCheck(e.target.checked, item)}
              />
            )}

            <span className="text-12 ml-1">{item}</span>
          </div>
        ))}
      </div>
    )
  },
)
