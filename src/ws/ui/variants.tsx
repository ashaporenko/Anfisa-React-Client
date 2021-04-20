import { observer } from 'mobx-react-lite'
import { ReactElement } from 'react'
import styled from 'styled-components'
import { t } from '../../i18n/i18n'
import { theme } from '../../theme/theme'
import { Box } from '../../ui/box'
import { Text } from '../../ui/text'
import dsStore from '../../store/dataset'
import get from 'lodash/get'

const Root = styled(Box)`
    width: 100%;
    display: flex;
    align-items: center;
    border-bottom: 1px solid #E3E5E6;
`

const VariantsStyled = styled(Text)`
    font-family: 'Work Sans', sans-serif;
    font-style: normal;
    font-weight: normal;
    font-size: 14px;
    line-height: 20px;
    color: ${theme('colors.grey.0')};
`

const AmountVariants = styled(VariantsStyled)`
    color: ${theme('colors.black')};
    margin-left: 8px;
`

export const Variants = observer((): ReactElement => {
	return (
		<Root>
			<VariantsStyled>{t('ds.variants')}</VariantsStyled>
			<AmountVariants>{get(dsStore, 'dsStat.total-counts.0', 0)}</AmountVariants>
		</Root>
	)
})