import { useRef, useState } from 'react'
import get from 'lodash/get'
import { toJS } from 'mobx'
import { observer } from 'mobx-react-lite'

import { t } from '@i18n'
import variantStore from '@store/variant'
import { Button } from '@ui/button'
import { HeaderModal } from '../../filter/ui/query-builder/ui/header-modal'
import { ModalBase } from '../../filter/ui/query-builder/ui/modal-base'

export const ModalNotes = observer(() => {
  const ref = useRef<any>(null)

  const handleClose = () => {
    variantStore.hideModalNotes()
  }

  const genInfo = get(variantStore, 'variant[0].rows[0].cells[0][0]', '')
  const hg19 = get(variantStore, 'variant[0].rows[1].cells[0][0]', '')
  const tagsWithNotes = variantStore.tagsWithNotes

  const currentTag = variantStore.currentTag

  const currentText = get(toJS(tagsWithNotes), currentTag)

  const [value, setValue] = useState(currentText)

  const handleSaveNote = () => {
    variantStore.updateTagsWithNotes([currentTag, value])
    handleClose()
  }

  return (
    <ModalBase refer={ref} minHeight={200} width="500px">
      <HeaderModal
        groupName={`${t('variant.notesFor')} [${genInfo}] ${hg19}`}
        handleClose={handleClose}
      />

      <div ref={ref} className="flex flex-col mt-4">
        <div>{currentTag}</div>

        <textarea
          placeholder="Enter text"
          className="w-full mt-1 p-3 h-80 rounded-lg resize-none mx-auto shadow-dark"
          rows={15}
          value={value}
          onChange={(e: any) => setValue(e.target.value)}
        />

        <div className="w-full flex justify-end ml-auto mt-6">
          <div className="flex items-center">
            <Button
              text={t('general.cancel')}
              hasBackground={false}
              className="text-black border-grey-light hover:bg-grey-light"
              onClick={handleClose}
            />

            <Button
              text={t('variant.saveNote')}
              className="ml-4 text-black hover:bg-blue-bright hover:text-white"
              hasBackground={false}
              onClick={handleSaveNote}
            />
          </div>
        </div>
      </div>
    </ModalBase>
  )
})
