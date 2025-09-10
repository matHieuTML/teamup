import React from 'react'

interface IconProps {
  size?: number
  className?: string
  color?: string
}

const PlacesIcon = ({ size = 24, className = '', color = 'currentColor' }: IconProps) => {
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
        d="M20 6H4C3.44772 6 3 6.44772 3 7V17C3 17.5523 3.44772 18 4 18H20C20.5523 18 21 17.5523 21 17V7C21 6.44772 20.5523 6 20 6Z" 
        stroke={color} 
        strokeWidth="2"
        fill="none"
      />
      <path 
        d="M9 6V18" 
        stroke={color} 
        strokeWidth="2"
        strokeDasharray="2 2"
      />
      <circle 
        cx="6" 
        cy="9" 
        r="1" 
        fill={color}
      />
      <circle 
        cx="6" 
        cy="12" 
        r="1" 
        fill={color}
      />
      <circle 
        cx="6" 
        cy="15" 
        r="1" 
        fill={color}
      />
      <path 
        d="M12 10H18" 
        stroke={color} 
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path 
        d="M12 14H16" 
        stroke={color} 
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default PlacesIcon