import { Fragment, ReactElement, useEffect, useRef, useState } from 'react'
import { useHistory } from 'react-router'
import cn, { Argument } from 'classnames'
import get from 'lodash/get'
import { observer } from 'mobx-react-lite'
import Tooltip from 'rc-tooltip'

import { DsDistItem } from '@declarations'
import { formatDate } from '@core/format-date'
import { useParams } from '@core/hooks/use-params'
import dirinfoStore from '@store/dirinfo'
import { Routes } from '@router/routes.enum'
import { DatasetType } from './dataset-type'
interface Props {
  item: DsDistItem
  isSubItems?: boolean
}

interface DsNameProps {
  dsName: any
  kind: string | null
  isActive: boolean
  isActiveParent: boolean
  isChildrenVisible?: boolean
  isChild?: boolean
  className?: Argument
}

const DatasetName = ({
  dsName,
  kind,
  isActiveParent,
  isChildrenVisible,
  isChild = false,
  className,
}: DsNameProps): ReactElement => {
  const datasetRef = useRef<any>(null)

  const isTooltip =
    datasetRef?.current?.getBoundingClientRect().width +
      datasetRef?.current?.getBoundingClientRect().x >
    235

  return (
    <Tooltip overlay={dsName} trigger={isTooltip ? ['hover'] : []}>
      <div
        ref={datasetRef}
        className={cn(
          kind === null ? 'text-grey-blue' : 'text-white',
          'text-sm leading-18px hover:text-blue-bright',
          {
            'font-bold': isActiveParent,
            truncate: !isChildrenVisible,
            'py-2': !kind,
          },
          isChild ? 'absolute top-0 left-0' : 'relative ml-2 pr-7',
          className,
        )}
      >
        {dsName}
      </div>
    </Tooltip>
  )
}

export const DatasetsListItem = observer(
  ({ item, isSubItems }: Props): ReactElement => {
    const history = useHistory()
    const params = useParams()
    const isActive = item.name === dirinfoStore.selectedDirinfoName
    const [isOpenFolder, setIsOpenFolder] = useState(isActive)
    const isNullKind = item.kind === null
    const secondaryKeys: string[] = get(item, 'secondary', [])
    const hasChildren = secondaryKeys.length > 0

    const isActiveParent =
      hasChildren && secondaryKeys.includes(dirinfoStore.selectedDirinfoName)

    useEffect(() => {
      setIsOpenFolder(secondaryKeys.includes(params.get('ds') || ''))
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleClick = () => {
      if (isNullKind && !hasChildren) return

      if (hasChildren) {
        setIsOpenFolder(prev => !prev)
        dirinfoStore.setDsInfo(item as DsDistItem)
      }

      dirinfoStore.setInfoFrameLink('')
      dirinfoStore.setActiveInfoName('')

      history.replace(`${Routes.Root}?ds=${isNullKind ? '' : item.name}`)
    }

    return (
      <Fragment>
        <div
          key={item.name}
          onClick={handleClick}
          className={cn('flex items-center relative w-full', {
            'cursor-pointer': hasChildren || !isNullKind,
            'pl-5': isSubItems,
            'bg-blue-bright bg-opacity-10': isActive,
          })}
        >
          <DatasetType
            hasChildren={hasChildren}
            isActive={isActive || isActiveParent}
          />

          <DatasetName
            dsName={item.name}
            kind={item.kind}
            isActive={isActive}
            isActiveParent={isActiveParent}
          />

          <div className="ml-auto text-10 leading-18px text-grey-blue whitespace-nowrap bg-blue-lighter">
            <div
              className={cn('py-2 pr-4', {
                'bg-blue-bright bg-opacity-10': isActive,
              })}
            >
              {formatDate(item['create-time'])}
            </div>
          </div>
        </div>

        {isOpenFolder && hasChildren && (
          <div>
            {secondaryKeys.map((secondaryKey: string) => {
              const secondaryItem: DsDistItem =
                dirinfoStore.dirinfo['ds-dict'][secondaryKey]

              return (
                <DatasetsListItem
                  item={secondaryItem}
                  key={secondaryItem.name}
                  isSubItems
                />
              )
            })}
          </div>
        )}
      </Fragment>
    )
  },
)
