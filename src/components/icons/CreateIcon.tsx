import React from 'react'

interface IconProps {
  size?: number
  className?: string
  color?: string
}

const CreateIcon = ({ size = 24, className = '', color = 'currentColor' }: IconProps) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle 
        cx="12" 
        cy="12" 
        r="10" 
        stroke={color} 
        strokeWidth="2"
      />
      <path 
        d="M12 8V16M8 12H16" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default CreateIcon