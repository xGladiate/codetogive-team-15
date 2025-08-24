import React from 'react';
import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';

interface DonationButtonProps {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children?: React.ReactNode;
  redirectTo?: string; // Custom donation page route
}

const DonationButton: React.FC<DonationButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  redirectTo = '/donate' // Default donation page route
}) => {
  const router = useRouter();

  const handleDonateClick = () => {
    router.push("/donate");
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-blue-600 text-white hover:bg-blue-700 border-blue-600';
      case 'secondary':
        return 'bg-gray-600 text-white hover:bg-gray-700 border-gray-600';
      case 'outline':
        return 'bg-transparent text-blue-600 hover:bg-blue-50 border-blue-600 border-2';
      default:
        return 'bg-blue-600 text-white hover:bg-blue-700 border-blue-600';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'px-4 py-2 text-sm';
      case 'md':
        return 'px-6 py-3 text-base';
      case 'lg':
        return 'px-8 py-4 text-lg';
      default:
        return 'px-6 py-3 text-base';
    }
  };

  return (
    <button
      className={`
        inline-flex items-center justify-center
        rounded-lg font-medium transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${getVariantStyles()}
        ${getSizeStyles()}
        ${className}
      `}
      onClick={handleDonateClick}
      type="button"
    >
      <Heart size={18} className="mr-2" />
      {children || 'Make a Donation'}
    </button>
  );
};

export default DonationButton;