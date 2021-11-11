import { useEffect, useRef, useState } from 'react'
import classNames from 'classnames'
import get from 'lodash/get'
import isBoolean from 'lodash/isBoolean'
import { observer } from 'mobx-react-lite'

import { useOutsideClick } from '@core/hooks/use-outside-click'
import { t } from '@i18n'
import datasetStore from '@store/dataset'
import filterStore from '@store/filterZone'
import variantStore from '@store/variant'
import { Button } from '@ui/button'
import { Icon } from '@ui/icon'
import { PopperButton } from '@components/popper-button'

const DrawerNoteButton = observer(({ refEl, onClick }: any) => {
  return (
    <Button
      refEl={refEl}
      text={variantStore.noteText ? undefined : '+ Add'}
      className={classNames('text-white hover:bg-blue-bright', {
        'bg-blue-bright': !!variantStore.noteText,
      })}
      size="xs"
      icon={variantStore.noteText ? <Icon name="File" /> : undefined}
      hasBackground={false}
      onClick={onClick}
    />
  )
})

const DrawerNoteModal = observer(({ close }: any) => {
  const genInfo = get(variantStore, 'variant[0].rows[0].cells[0][0]', '')
  const hg19 = get(variantStore, 'variant[0].rows[1].cells[0][0]', '')
  const [value, setValue] = useState('')

  const ref = useRef(null)

  useOutsideClick(ref, () => close())

  useEffect(() => {
    setValue(variantStore.noteText)
  }, [])

  const sendTagsWithNotesRequest = () => {
    let params = ''

    Object.entries(variantStore.tagsWithNotes).map((tagData, index) => {
      params += `"${tagData[0]}":${
        isBoolean(tagData[1]) ? tagData[1] : `"${tagData[1]}"`
      }`

      if (Object.entries(variantStore.tagsWithNotes)[index + 1]) {
        params += `,`
      }
    })

    variantStore.fetchSelectedTagsAsync(params)
    filterStore.fetchTagSelectAsync()
    datasetStore.fetchWsTagsAsync()
    datasetStore.fetchWsListAsync()
  }

  const handleSaveNoteAsync = async () => {
    variantStore.updateTagsWithNotes(['_note', value])

    variantStore.setNoteText(value)

    sendTagsWithNotesRequest()
    close()
  }

  const deleteNoteAsync = async () => {
    variantStore.updateTagsWithNotes(['_note', true], 'remove')
    variantStore.setNoteText('')
    setValue('')
    sendTagsWithNotesRequest()
    close()
  }

  return (
    <div ref={ref} className="bg-blue-light flex flex-col py-5 px-4 rounded-xl">
      <span className="w-full">
        <span>{t('variant.notesFor')} </span>

        <span className="text-blue-bright">
          {`[${genInfo}] `}

          <span dangerouslySetInnerHTML={{ __html: hg19 }} />
        </span>
      </span>

      <textarea
        placeholder="Enter text"
        className="w-96 mt-5 p-3 h-80 rounded-lg resize-none mx-auto"
        rows={15}
        value={value}
        onChange={(e: any) => setValue(e.target.value)}
      />

      <div className="flex justify-between mt-4">
        <div>
          {variantStore.noteText && (
            <Button
              text={t('general.delete')}
              onClick={deleteNoteAsync}
              hasBackground={false}
              className="text-black border-red-secondary hover:text-white hover:bg-red-secondary"
            />
          )}
        </div>

        <div className="flex items-center">
          <Button
            text={t('general.cancel')}
            onClick={close}
            hasBackground={false}
            className="ml-4 text-black hover:bg-blue-bright hover:text-white"
          />

          <Button
            text="Save note"
            disabled={!value || !value.trim()}
            hasBackground={false}
            className="ml-4 text-black hover:bg-blue-bright hover:text-white"
            onClick={handleSaveNoteAsync}
          />
        </div>
      </div>
    </div>
  )
})

export const DrawerNote = observer(() => {
  return (
    <div className="flex border-l-2 border-blue-lighter ml-3 items-center">
      <span className="text-14 text-white px-3">{t('variant.notes')}</span>

      <PopperButton
        ButtonElement={DrawerNoteButton}
        ModalElement={DrawerNoteModal}
      />
    </div>
  )
})
