import { ReactElement } from 'react'
import { Option } from 'react-dropdown'
import get from 'lodash/get'
import { observer } from 'mobx-react-lite'

import { FilterList } from '@declarations'
import { t } from '@i18n'
import datasetStore from '@store/dataset'
import filterPresetStore from '@store/filterPreset'
import { DropDown } from '@ui/dropdown'
import { ControlPanelTitle } from './control-panel-title'

export const Preset = observer(
  (): ReactElement => {
    const presets: string[] = get(datasetStore, 'dsStat.filter-list', []).map(
      (preset: FilterList) => preset.name,
    )

    const onSelectAsync = async (arg: Option) => {
      filterPresetStore.loadPresetAsync(arg.value)
      datasetStore.setActivePreset(arg.value)

      datasetStore.fetchWsListAsync(false)
      datasetStore.setIsLoadingTabReport(true)
    }

    return (
      <div>
        <div className="flex items-center justify-between">
          <ControlPanelTitle title={t('ds.preset')} />

          {datasetStore.activePreset && (
            <span
              onClick={() => onSelectAsync({ value: '', label: '' } as Option)}
              className="text-14 text-blue-bright cursor-pointer"
            >
              {t('general.clear')}
            </span>
          )}
        </div>

        <DropDown
          options={presets}
          value={datasetStore.activePreset}
          onSelect={onSelectAsync}
          placeholder={t('general.selectAnOption')}
        />
      </div>
    )
  },
)
