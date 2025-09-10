import React from 'react'

interface IconProps {
  size?: number
  className?: string
  color?: string
}

const EventsIcon = ({ size = 24, className = '', color = 'currentColor' }: IconProps) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path 
        d="M8 2V5M16 2V5M3 10H21M5 4H19C20.1046 4 21 4.89543 21 6V20C21 21.1046 20.1046 22 19 22H5C3.89543 22 3 21.1046 3 20V6C3 4.89543 3.89543 4 5 4Z" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <circle cx="9" cy="15" r="1.5" fill={color}/>
      <circle cx="15" cy="15" r="1.5" fill={color}/>
    </svg>
  )
}

export default EventsIcon