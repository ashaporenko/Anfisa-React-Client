import cn from 'classnames'
import styled from 'styled-components'

const ModalView = styled.div`
  display: flex;
  position: fixed;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.8);
`

const ModalContent = styled.div<{
  minHeight: number | string
  maxHeight: number | string
  width: number | string
}>`
  width: ${props => props.width};
  height: auto;
  min-height: ${props => props.minHeight};
  max-height: ${props => props.maxHeight};
`

interface IProps {
  minHeight: number | string
  maxHeight?: number | string
  refer: any
  width?: number | string
  children: any
  theme?: string
}

export const ModalBase = ({
  minHeight,
  maxHeight = '580px',
  refer,
  width = '580px',
  theme = 'light',
  children,
}: IProps) => (
  <ModalView className="bg-grey-blue">
    <ModalContent
      ref={refer}
      className={cn(
        'flex flex-col justify-between py-4 px-4 rounded-lg',
        theme === 'light' ? 'bg-white' : 'bg-black',
      )}
      minHeight={minHeight}
      maxHeight={maxHeight}
      width={width}
    >
      {children}
    </ModalContent>
  </ModalView>
)
