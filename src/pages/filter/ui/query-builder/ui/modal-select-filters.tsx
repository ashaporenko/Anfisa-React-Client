import { ReactElement, useRef, useState } from 'react'
import Checkbox from 'react-three-state-checkbox'
import { observer } from 'mobx-react-lite'

import { ActionType } from '@declarations'
import { t } from '@i18n'
import dtreeStore from '@store/dtree'
import { addAttributeToStep } from '@utils/addAttributeToStep'
import { QueryBuilderSearch } from '../query-builder-search'
import { HeaderModal } from './header-modal'
import { ModalBase } from './modal-base'
import { ModsDivider } from './mods-divider'
import { SelectModalButtons } from './select-modal-buttons'

export const ModalSelectFilters = observer(
  (): ReactElement => {
    const ref = useRef(null)

    const index = dtreeStore.currentStepIndex
    const currentGroup = dtreeStore.stepData[index].groups
    const groupName = dtreeStore.groupNameToChange

    const handleCheckGroupItem = (checked: boolean, name: string) => {
      if (checked) {
        dtreeStore.addSelectedFilter(name)
      } else {
        dtreeStore.removeSelectedFilter(name)
      }
    }

    const handleAddAttribute = (action: ActionType) => {
      addAttributeToStep(action, 'enum')

      dtreeStore.resetSelectedFilters()
      dtreeStore.closeModalSelectFilter()
    }

    const handleClose = () => {
      dtreeStore.closeModalSelectFilter()
      dtreeStore.resetSelectedFilters()
    }

    const handleModals = () => {
      dtreeStore.closeModalSelectFilter()
      dtreeStore.openModalAttribute(index)
      dtreeStore.resetSelectedFilters()
    }

    const handleModalJoin = () => {
      dtreeStore.openModalJoin()
    }

    const [searchValue, setSearchValue] = useState('')

    const handleChange = (value: string) => {
      setSearchValue(value)
    }

    return (
      <ModalBase refer={ref} minHeight={260}>
        <HeaderModal groupName={groupName} handleClose={handleClose} />

        {dtreeStore.selectedGroups[2].length > 15 && (
          <div className="flex mt-3">
            <QueryBuilderSearch
              value={searchValue}
              onChange={handleChange}
              isSubgroupItemSearch
            />
          </div>
        )}

        <div className="flex justify-between w-full mt-4 text-14">
          <div className="text-grey-blue">
            {dtreeStore.selectedFilters.length} selected
          </div>

          <div className="flex">
            <div className="flex items-center">
              <Checkbox checked={false} className="mr-1 cursor-pointer" />
              <div className="font-normal">{t('ds.notMode')}</div>
            </div>

            <ModsDivider />

            <div className="text-blue-bright">{t('general.selectAll')}</div>

            <ModsDivider />

            <div className="text-blue-bright">{t('general.clearAll')}</div>
          </div>
        </div>

        <div className="flex-1 mt-4 overflow-y-auto">
          {dtreeStore.selectedGroups[2] ? (
            dtreeStore.selectedGroups[2]
              .filter((variant: [string, number]) =>
                variant[0]
                  .toLocaleLowerCase()
                  .startsWith(searchValue.toLocaleLowerCase()),
              )
              .map(
                (variant: [string, number]) =>
                  variant[1] !== 0 && (
                    <div
                      key={Math.random()}
                      className="flex items-center mb-2 text-14"
                    >
                      <Checkbox
                        checked={dtreeStore.selectedFilters.includes(
                          variant[0],
                        )}
                        className="-mt-0.5 mr-1 cursor-pointer"
                        onChange={e =>
                          handleCheckGroupItem(e.target.checked, variant[0])
                        }
                      />

                      <span className="text-black">{variant[0]}</span>

                      <span className="text-grey-blue ml-2">
                        {variant[1]} {t('dtree.variants')}
                      </span>
                    </div>
                  ),
              )
          ) : (
            <div className="flex justify-center items-center text-14 text-grey-blue">
              {t('dtree.noFilters')}
            </div>
          )}
        </div>

        <SelectModalButtons
          handleClose={handleClose}
          handleModals={handleModals}
          handleModalJoin={handleModalJoin}
          disabled={dtreeStore.selectedFilters.length === 0}
          currentGroup={currentGroup}
          handleAddAttribute={handleAddAttribute}
        />
      </ModalBase>
    )
  },
)
