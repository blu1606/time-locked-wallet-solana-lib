import React from 'react';
import { classNames } from '../utils/classNames';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
  hover?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  padding = 'md',
  className,
  hover = false,
}) => {
  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={classNames(
        'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm',
        hover && 'hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200',
        paddingStyles[padding],
        className
      )}
    >
      {(title || subtitle) && (
        <div className="mb-4">
          {title && (
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;
