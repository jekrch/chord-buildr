import React from "react"
import { faGuitar, faMusic } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { useAppContext } from "../components/context/AppContext"

interface InlineConfigProps {
  className?: string
}

// inline configuration component for instrument selection
const InlineConfig: React.FC<InlineConfigProps> = ({ className = "" }) => {
  const { state, dispatch } = useAppContext()

  const handleFormatChange = (format: string) => {
    dispatch({
      type: 'UPDATE_UX_FORMAT',
      format: format
    })
  }

  const getButtonClass = (format: string) => `
    inline-flex items-center justify-center rounded-md text-sm font-medium 
    ring-offset-background transition-colors focus-visible:outline-none 
    focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 
    disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 mx-2
    ${state.format === format ? 'ring-2 ring-blue-500' : ''}
  `

  return (
    <div className={`flex justify-center space-x-4 mb-6 mt-12 text-slate-400 ${className}`}>
      <button
        onClick={() => handleFormatChange('p')}
        className={getButtonClass('p')}
        aria-label="Select Piano"
      >
        <FontAwesomeIcon icon={faMusic} className="h-6 w-6" />
        <span className="ml-2">Piano</span>
      </button>
      
      <button
        onClick={() => handleFormatChange('g')}
        className={getButtonClass('g')}
        aria-label="Select Guitar"
      >
        <FontAwesomeIcon icon={faGuitar} className="h-6 w-6" />
        <span className="ml-2">Guitar</span>
      </button>
      
      <button
        onClick={() => handleFormatChange('u')}
        className={getButtonClass('u')}
        aria-label="Select Ukulele"
      >
        <FontAwesomeIcon icon={faGuitar} className="h-6 w-6 transform scale-75" />
        <span className="ml-2">Ukulele</span>
      </button>
    </div>
  )
}

export default InlineConfig