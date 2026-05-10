import clsx from 'clsx';

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export default function PageWrapper({ children, className }: PageWrapperProps) {
  return (
    <div className={clsx('mx-auto max-w-7xl px-4 py-6', className)}>
      {children}
    </div>
  );
}
