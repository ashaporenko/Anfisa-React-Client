import { Fragment, ReactElement } from 'react'
import get from 'lodash/get'

import { CellI, PredicationI } from './cell-interfaces'
import { PredictionItem } from './prediction-item'

export const CellInSilico = ({ cell }: CellI): ReactElement => {
  const predictions = get(cell, 'value', []) as PredicationI[]

  return (
    <Fragment>
      {predictions.map((prediction: PredicationI) => (
        <PredictionItem key={prediction.name} {...prediction} />
      ))}
    </Fragment>
  )
}
