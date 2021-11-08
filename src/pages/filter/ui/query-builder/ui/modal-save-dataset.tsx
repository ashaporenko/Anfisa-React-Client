import { useRef, useState } from 'react'
import { useHistory } from 'react-router-dom'
import { toast } from 'react-toastify'
import { observer } from 'mobx-react-lite'

import { PatnNameEnum } from '@core/enum/path-name-enum'
import { t } from '@i18n'
import datasetStore from '@store/dataset'
import dtreeStore from '@store/dtree'
import operations from '@store/operations'
import { Routes } from '@router/routes.enum'
import { Button } from '@ui/button'
import { Attention } from '@ui/icons/attention'
import { Input } from '@ui/input'
import { HeaderModal } from './header-modal'
import { ModalBase } from './modal-base'

export const ModalSaveDataset = observer(() => {
  const ref = useRef<any>(null)
  const history = useHistory()
  const [value, setValue] = useState<string>('')
  const [error, setError] = useState<string>('')

  const pathName = history.location.pathname

  const isDone = operations.savingStatus[1] === 'Done'

  const handleClickAsync = async () => {
    const result = await operations.saveDatasetAsync(value, pathName)

    if (!result.ok && result.message) {
      setError(result.message)

      return
    }

    isDone && history.push(`${Routes.WS}?ds=${value}`)
  }

  const handleClose = () => {
    if (!value) {
      dtreeStore.closeModalSaveDataset()
      operations.resetSavingStatus()

      return
    }

    if (operations.isCreationOver) {
      dtreeStore.closeModalSaveDataset()

      if (pathName === PatnNameEnum.Ws) {
        datasetStore.initDatasetAsync(value)
      }

      operations.resetSavingStatus()
    } else {
      toast.warning(t('general.creaitionIsInProcess'), {
        position: 'bottom-right',
        autoClose: 2000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: 0,
      })
    }
  }

  const handleOpenDataset = () => {
    isDone && history.push(`${Routes.WS}?ds=${value}`)
    dtreeStore.closeModalSaveDataset()
    datasetStore.initDatasetAsync(value)

    operations.resetSavingStatus()
  }

  return (
    <ModalBase refer={ref} minHeight={200} width="520px">
      <HeaderModal
        groupName={t('dsCreation.addDatasetTitle')}
        handleClose={handleClose}
      />

      <div className="flex flex-col mt-4" ref={ref}>
        <div className="">
          <span className="text-14">{t('dsCreation.label')}</span>

          <Input
            value={value}
            onChange={e => setValue(e.target.value)}
            className="mt-1"
          />

          <span className="text-red-secondary mt-2">{error}</span>
        </div>

        <p className="mt-5 flex items-center">
          <Attention className="mr-2" />

          <span>{t('dsCreation.attention')}</span>
        </p>

        <span className="mt-2">
          {operations.savingStatus[1]}

          {isDone && (
            <span
              className="ml-2 text-blue-bright cursor-pointer"
              onClick={handleOpenDataset}
            >
              Open It
            </span>
          )}
        </span>

        <div className="flex ml-auto mt-6">
          <Button
            text={t('general.cancel')}
            hasBackground={false}
            className="text-black border-grey-light hover:bg-grey-light"
            onClick={handleClose}
          />

          <Button
            text={t('dsCreation.addDataset')}
            className="ml-4 text-black hover:bg-blue-bright hover:text-white"
            disabled={!value.trim()}
            hasBackground={false}
            onClick={handleClickAsync}
          />
        </div>
      </div>
    </ModalBase>
  )
})
