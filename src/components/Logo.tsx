"use client"

import Image from 'next/image';
import React from 'react';
import logo from "../../public/logo.png";

interface LogoProps {
  className?: string;
}

const Logo = ({ className }: LogoProps) => {
  return (
    <div className={`cursor-pointer m-2 flex items-center justify-center ${className}`} onClick={() => {console.log('Logo clicked')}}>
        <Image src={logo} alt="1Cell Logo"  />
    </div>
  )
}

export default Logo