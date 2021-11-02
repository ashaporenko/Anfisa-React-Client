import { ReactElement, useRef } from 'react'
import cn, { Argument } from 'classnames'
import noop from 'lodash/noop'
import { toJS } from 'mobx'
import { observer } from 'mobx-react-lite'

import { ViewTypeEnum } from '@core/enum/view-type-enum'
import { useOutsideClick } from '@core/hooks/use-outside-click'
import { t } from '@i18n'
import datasetStore from '@store/dataset'
import zoneStore from '@store/filterZone'
import { Button } from '@ui/button'
import { InputSearch } from '@components/input-search'
import { ViewTypeTable } from '@components/view-type-table'
import { FilterMods } from '@pages/ws/ui/filter-mods'

interface Props {
  title?: string
  selectedAmount?: number
  searchValue: string
  searchInputPlaceholder?: string
  viewType?: ViewTypeEnum
  children: ReactElement
  onSelectAll?: () => void
  onClearAll?: () => void
  onClose?: () => void
  onApply?: () => void
  setViewType?: (viewType: ViewTypeEnum) => void
  onChange?: (value: string) => void
  isGenes?: boolean
  isGenesList?: boolean
  isSamples?: boolean
  isTags?: boolean
  className?: Argument
}

export const PopperTableModal = observer(
  ({
    title,
    selectedAmount,
    searchValue,
    searchInputPlaceholder,
    viewType,
    children,
    setViewType,
    onSelectAll,
    onClearAll,
    onClose,
    onApply,
    onChange,
    isGenes,
    isGenesList,
    isSamples,
    isTags,
    className,
  }: Props) => {
    const ref = useRef(null)

    useOutsideClick(ref, onClose ?? noop)

    const defineClearFilter = () => {
      isGenes && zoneStore.unselectAllGenes()
      isGenesList && zoneStore.unselectAllGenesList()
      isSamples && zoneStore.unselectAllSamples()
      isTags && zoneStore.unselectAllTags()
      datasetStore.fetchWsListAsync()
    }

    const defintSelectedAmount = () => {
      if (isGenes) return toJS(zoneStore.selectedGenes).length

      if (isGenesList) return toJS(zoneStore.selectedGenesList).length

      if (isSamples) return toJS(zoneStore.selectedSamples).length

      if (isTags) return toJS(zoneStore.selectedTags).length
    }

    const handleClose = () => {
      defineClearFilter()

      onClose && onClose()
    }

    return (
      <div className={cn('bg-white shadow-card rounded', className)} ref={ref}>
        <div className="px-4 pt-4">
          <p className="text-blue-dark mb-5 font-medium">{title}</p>

          <InputSearch
            value={searchValue}
            placeholder={searchInputPlaceholder}
            onChange={e => onChange && onChange(e.target.value)}
          />

          {viewType && setViewType && (
            <ViewTypeTable setViewType={setViewType} viewType={viewType} />
          )}

          <div className="flex justify-between mt-5">
            {viewType ? (
              <span className="text-14 text-grey-blue">
                {selectedAmount} Selected
              </span>
            ) : (
              <span className="text-14 text-grey-blue">
                {defintSelectedAmount() || 0} Selected
              </span>
            )}

            <span className="text-12 text-blue-bright leading-14">
              {onSelectAll && (
                <span className="cursor-pointer mr-3" onClick={onSelectAll}>
                  {t('general.selectAll')}
                </span>
              )}
              {viewType ? (
                <span className="cursor-pointer" onClick={onClearAll}>
                  {t('general.clearAll')}
                </span>
              ) : (
                <span className="cursor-pointer" onClick={handleClose}>
                  {t('general.clearAll')}
                </span>
              )}
            </span>
          </div>

          {isTags && <FilterMods />}
        </div>

        <div className="w-full pl-4">{children}</div>

        <div className="flex justify-end pb-4 px-4 mt-4">
          <Button text={t('general.cancel')} onClick={handleClose} />

          <Button
            text={t('general.apply')}
            className="ml-3"
            onClick={onApply}
          />
        </div>
      </div>
    )
  },
)
