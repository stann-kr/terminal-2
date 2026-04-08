interface PageLayoutProps {
  children: React.ReactNode;
  center?: boolean;
}

export default function PageLayout({ children, center = false }: PageLayoutProps) {
  return (
    <div
      className="relative w-full px-4 sm:px-6 pt-14 md:pt-20 pb-14 md:pb-20 flex flex-col items-center overflow-x-hidden"
    >
      <div className="relative z-10 w-full flex flex-col items-center">
        {children}
      </div>
    </div>
  );
}
