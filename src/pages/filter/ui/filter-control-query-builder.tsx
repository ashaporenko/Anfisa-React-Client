import { Fragment, ReactElement, useState } from 'react'
import { toast } from 'react-toastify'
import cn from 'classnames'
import get from 'lodash/get'
import { observer } from 'mobx-react-lite'

import { FilterList } from '@declarations'
import { ActionFilterEnum } from '@core/enum/action-filter.enum'
import { t } from '@i18n'
import datasetStore from '@store/dataset'
import dtreeStore from '@store/dtree'
import filterStore from '@store/filter'
import { Button } from '@ui/button'
import { DropDown } from '@ui/dropdown'
import { Input } from '@ui/input'
import { PopperButton } from '@components/popper-button'
import { ControlPanelDivider } from '@pages/ws/ui/control-panel-divider'
import { EditFilter } from '@pages/ws/ui/control-panel-edit-filter'
import { DatasetCreationButton } from '@pages/ws/ui/dataset-creation-button'
import { DtreeModal } from './dtree-modal'
import { FilterButton } from './filter-button'

export const FilterControlQueryBuilder = observer(
  (): ReactElement => {
    const [activeTree, setActiveTree] = useState('')
    const [createTreeName, setCreateTreeName] = useState('')

    const trees: string[] = get(dtreeStore, 'dtreeList', []).map(
      (preset: FilterList) => preset.name,
    )

    const handleSelect = (value: string) => {
      setActiveTree(value)

      dtreeStore.setDtreeName(value)

      filterStore.resetActionName()
    }

    const handleCreateTree = () => {
      if (dtreeStore.dtreeCode.length < 13) {
        toast.error(t('dtree.dtreeIsEmpty'), {
          position: 'bottom-right',
          autoClose: 2000,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: 0,
        })
      } else {
        filterStore.setActionName(ActionFilterEnum.Create)
      }
    }

    const handleClick = () => {
      const body = new URLSearchParams({
        ds: datasetStore.datasetName,
        code: dtreeStore.dtreeCode,
      })

      let instruction, notification

      if (filterStore.actionName === ActionFilterEnum.Delete) {
        instruction = ['DTREE', 'DELETE', dtreeStore.currentDtreeName]
        notification = `${t('dtree.dtree')} "${
          dtreeStore.currentDtreeName
        }" ${t('dtree.hasBeenDeleted')}`
        setActiveTree('')
      }

      if (filterStore.actionName === ActionFilterEnum.Create) {
        instruction = ['DTREE', 'UPDATE', createTreeName]
        notification = `${t('dtree.dtree')} "${createTreeName}" ${t(
          'dtree.hasBeenCreated',
        )}`
        setActiveTree(createTreeName)
        dtreeStore.setDtreeName(createTreeName)

        setCreateTreeName('')
      }

      if (filterStore.actionName === ActionFilterEnum.Modify) {
        instruction = ['DTREE', 'UPDATE', dtreeStore.currentDtreeName]
        notification = `${t('dtree.dtree')} "${
          dtreeStore.currentDtreeName
        }" ${t('dtree.hasBeenModified')}`

        dtreeStore.setStartDtreeCode()
      }

      body.append('instr', JSON.stringify(instruction))

      dtreeStore.fetchDtreeSetAsync(body)

      toast.success(notification, {
        position: 'bottom-right',
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: 0,
      })

      filterStore.setActionName()
    }

    const isApplyDisabled =
      dtreeStore.currentDtreeName.startsWith('⏚') &&
      (filterStore.actionName === ActionFilterEnum.Modify ||
        filterStore.actionName === ActionFilterEnum.Delete)

    return (
      <Fragment>
        <div className="flex items-center border-black">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-grey-blue text-14 font-bold">
                {t('filter.decisionTrees')}
              </span>

              <span
                className={cn(
                  'text-blue-bright text-14 cursor-pointer hover:text-blue-light',
                )}
                onClick={handleCreateTree}
              >
                {t('filter.createPreset')}
              </span>
            </div>

            {filterStore.actionName === ActionFilterEnum.Create ? (
              <Input
                value={createTreeName}
                placeholder={t('dtree.decisionTreeName')}
                className="bg-blue-lighter text-white border-2 border-blue-bright"
                style={{ width: 209 }}
                onChange={e => setCreateTreeName(e.target.value)}
              />
            ) : (
              <DropDown
                options={trees}
                value={activeTree}
                onSelect={args => handleSelect(args.value)}
              />
            )}
          </div>

          {filterStore.actionName !== ActionFilterEnum.Create && (
            <PopperButton
              ButtonElement={FilterButton}
              ModalElement={DtreeModal}
            />
          )}

          {(createTreeName ||
            filterStore.actionName === ActionFilterEnum.Delete ||
            filterStore.actionName === ActionFilterEnum.Modify ||
            filterStore.actionName === ActionFilterEnum.Create) && (
            <Button
              text={t('general.cancel')}
              size="md"
              hasBackground={false}
              className={cn(
                'text-white mt-auto ml-2 rounded-full hover:bg-blue-bright',
              )}
              onClick={() => {
                filterStore.setActionName()
                setCreateTreeName('')
              }}
            />
          )}

          {(createTreeName ||
            filterStore.actionName === ActionFilterEnum.Delete ||
            filterStore.actionName === ActionFilterEnum.Modify) && (
            <Button
              text={t('general.apply')}
              disabled={isApplyDisabled}
              size="md"
              onClick={handleClick}
              className="text-white mt-auto ml-2"
            />
          )}
        </div>
        <ControlPanelDivider />
        <EditFilter />
        <DatasetCreationButton />
      </Fragment>
    )
  },
)
