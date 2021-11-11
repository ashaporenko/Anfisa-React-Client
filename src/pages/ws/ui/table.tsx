import { ReactElement, useCallback, useEffect, useState } from 'react'
import { useBlockLayout, useTable } from 'react-table'
import { FixedSizeList } from 'react-window'
import cn from 'classnames'
import debounce from 'lodash/debounce'
import { toJS } from 'mobx'
import { observer } from 'mobx-react-lite'

import { ViewTypeEnum } from '@core/enum/view-type-enum'
import { useParams } from '@core/hooks/use-params'
import { tableColumnMap } from '@core/table-column-map'
import datasetStore from '@store/dataset'
import variantStore from '@store/variant'
import columnsStore from '@store/wsColumns'
import { NoResultsFound } from '@components/no-results-found'

interface Props {
  columns: any[]
  data: any[]
}

interface PropsRow {
  index: number
}

const offsetSize = 2800
const offsetSizeToLoad = (offsetSize / 100) * 60
const filteredNo = toJS(datasetStore.filteredNo)

export const isRowSelected = (
  rowIndex: number,
  activeIndex: number,
): boolean => {
  return filteredNo[rowIndex] === activeIndex
}

export const Table = observer(
  ({ columns, data }: Props): ReactElement => {
    const params = useParams()
    const [ref, setRef] = useState<any>(null)
    const tabReport = toJS(datasetStore.tabReport)

    const defaultColumn = {
      width: variantStore.drawerVisible
        ? 190
        : (window.innerWidth ||
            document.documentElement.clientWidth ||
            document.body.clientWidth) / 8,
    }

    useEffect(() => {
      ref?.scrollToItem(variantStore.index)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ref, variantStore.index])

    useEffect(() => {
      const handleResize = debounce(() => {
        datasetStore.setIsLoadingTabReport(true)

        setTimeout(() => {
          datasetStore.setIsLoadingTabReport(false)
        }, 500)
      }, 500)

      window.addEventListener('resize', handleResize)

      return () => {
        window.removeEventListener('resize', handleResize)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const {
      getTableProps,
      getTableBodyProps,
      headerGroups,
      totalColumnsWidth,
      rows,
      prepareRow,
    } = useTable(
      {
        columns,
        data,
        defaultColumn,
      },
      useBlockLayout,
    )

    const handleOpenVariant = useCallback(({ index }: PropsRow) => {
      if (window.getSelection()?.toString() || datasetStore.isXL) return

      const idx = filteredNo.length === 0 ? index : filteredNo[index]

      if (!variantStore.drawerVisible) {
        columnsStore.setColumns(['Gene', 'Variant'])
        columnsStore.showColumns()
        variantStore.setDsName(params.get('ds') ?? '')
      }

      variantStore.setIndex(idx)

      variantStore.setIsActiveVariant()

      variantStore.fetchVarinatInfoAsync()

      if (!variantStore.drawerVisible) {
        variantStore.setDrawerVisible(true)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
      variantStore.isActiveVariant &&
        handleOpenVariant({
          index: 0,
        })
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const RenderRow = useCallback(
      ({ index, style }) => {
        const row = rows[index]

        prepareRow(row)

        return (
          <div
            {...row.getRowProps({
              style,
            })}
            className={cn(
              'cursor-pointer flex items-center tr',
              variantStore.drawerVisible &&
                isRowSelected(row.index, variantStore.index)
                ? 'bg-blue-bright text-white'
                : 'text-black hover:bg-blue-light',
            )}
            onClick={() => handleOpenVariant(row)}
          >
            {row.cells.map((cell: any) => {
              return (
                <div
                  {...cell.getCellProps()}
                  key={Math.random()}
                  className={cn('td overflow-hidden', {
                    'py-1':
                      cell.column.Header !== tableColumnMap.samples &&
                      columnsStore.viewType === ViewTypeEnum.Compact,
                    'py-4':
                      cell.column.Header !== tableColumnMap.samples &&
                      columnsStore.viewType !== ViewTypeEnum.Compact,
                    'h-full':
                      cell.column.Header === tableColumnMap.samples &&
                      columnsStore.viewType !== ViewTypeEnum.Compact,
                    'px-4': cell.column.Header !== tableColumnMap.samples,
                  })}
                >
                  {cell.render('Cell')}
                </div>
              )
            })}
          </div>
        )
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [handleOpenVariant, prepareRow, rows, variantStore.index],
    )

    const handleScrollAsync = async () => {
      if (
        filteredNo.length > 0 &&
        datasetStore.indexFilteredNo < filteredNo.length
      ) {
        await datasetStore.fetchFilteredTabReportAsync()

        return
      }

      if (!datasetStore.reportsLoaded) {
        await datasetStore.fetchTabReportAsync()
      }
    }

    return (
      <div
        {...getTableProps()}
        style={{ width: totalColumnsWidth }}
        className="table h-full"
      >
        <div className="thead">
          {headerGroups.map(headerGroup => {
            const stylesHead = { ...headerGroup.getHeaderGroupProps().style }

            stylesHead.width = Number.parseFloat(stylesHead.width as string) - 8

            return (
              <div
                {...headerGroup.getHeaderGroupProps()}
                key={Math.random()}
                className="tr"
                style={stylesHead}
              >
                {headerGroup.headers.map((column: any) => {
                  return (
                    <div
                      {...column.getHeaderProps()}
                      key={Math.random()}
                      className="th"
                    >
                      {column.HeaderComponent
                        ? column.render('HeaderComponent')
                        : column.render('Header')}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>

        {tabReport.length === 0 && <NoResultsFound />}

        {tabReport.length > 0 && (
          <div {...getTableBodyProps()} className="text-12 tbody">
            <FixedSizeList
              ref={setRef}
              height={
                (window.innerHeight ||
                  document.documentElement.clientHeight ||
                  document.body.clientHeight) - 200
              }
              itemCount={rows.length}
              initialScrollOffset={datasetStore.offset}
              itemSize={
                columnsStore.viewType === ViewTypeEnum.Compact ? 60 : 80
              }
              onScroll={debounce(props => {
                if (
                  props.scrollOffset >
                  datasetStore.offset + offsetSizeToLoad
                ) {
                  datasetStore.setTableOffest(props.scrollOffset)
                  handleScrollAsync()
                }
              }, 100)}
              width={totalColumnsWidth}
            >
              {RenderRow}
            </FixedSizeList>
          </div>
        )}
      </div>
    )
  },
)
