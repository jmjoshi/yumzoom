import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Analytics Dashboard',
  description: 'View your family\'s dining insights and patterns',
};

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
