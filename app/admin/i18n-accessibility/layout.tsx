'use client';

import { useState } from 'react';
import {
  Languages,
  Accessibility,
  Globe,
  Users,
  FileText,
  BarChart3,
  Settings,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  Flag,
  Eye,
  Volume2,
  Menu,
  X
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function I18nAccessibilityLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    {
      name: 'Overview',
      href: '/admin/i18n-accessibility',
      icon: BarChart3,
      current: true,
    },
    {
      name: 'Translation Management',
      href: '/admin/i18n-accessibility/translations',
      icon: Languages,
      current: false,
      children: [
        { name: 'All Translations', href: '/admin/i18n-accessibility/translations' },
        { name: 'Pending Review', href: '/admin/i18n-accessibility/translations/pending' },
        { name: 'Auto-Translation', href: '/admin/i18n-accessibility/translations/auto' },
        { name: 'Content Moderation', href: '/admin/i18n-accessibility/translations/moderation' },
      ],
    },
    {
      name: 'Language Settings',
      href: '/admin/i18n-accessibility/languages',
      icon: Globe,
      current: false,
      children: [
        { name: 'Supported Languages', href: '/admin/i18n-accessibility/languages' },
        { name: 'Regional Settings', href: '/admin/i18n-accessibility/languages/regions' },
        { name: 'Cuisine Categories', href: '/admin/i18n-accessibility/languages/cuisines' },
        { name: 'Cultural Preferences', href: '/admin/i18n-accessibility/languages/culture' },
      ],
    },
    {
      name: 'Accessibility Features',
      href: '/admin/i18n-accessibility/accessibility',
      icon: Accessibility,
      current: false,
      children: [
        { name: 'Restaurant Info', href: '/admin/i18n-accessibility/accessibility/restaurants' },
        { name: 'Feature Management', href: '/admin/i18n-accessibility/accessibility/features' },
        { name: 'User Preferences', href: '/admin/i18n-accessibility/accessibility/preferences' },
        { name: 'Compliance Check', href: '/admin/i18n-accessibility/accessibility/compliance' },
      ],
    },
    {
      name: 'User Reports',
      href: '/admin/i18n-accessibility/reports',
      icon: FileText,
      current: false,
      children: [
        { name: 'Accessibility Issues', href: '/admin/i18n-accessibility/reports/accessibility' },
        { name: 'Translation Errors', href: '/admin/i18n-accessibility/reports/translations' },
        { name: 'Content Feedback', href: '/admin/i18n-accessibility/reports/feedback' },
        { name: 'User Suggestions', href: '/admin/i18n-accessibility/reports/suggestions' },
      ],
    },
    {
      name: 'Analytics & Insights',
      href: '/admin/i18n-accessibility/analytics',
      icon: BarChart3,
      current: false,
      children: [
        { name: 'Usage Statistics', href: '/admin/i18n-accessibility/analytics/usage' },
        { name: 'Language Adoption', href: '/admin/i18n-accessibility/analytics/languages' },
        { name: 'Accessibility Metrics', href: '/admin/i18n-accessibility/analytics/accessibility' },
        { name: 'User Engagement', href: '/admin/i18n-accessibility/analytics/engagement' },
      ],
    },
    {
      name: 'Content Quality',
      href: '/admin/i18n-accessibility/quality',
      icon: CheckCircle,
      current: false,
      children: [
        { name: 'Quality Assurance', href: '/admin/i18n-accessibility/quality/qa' },
        { name: 'Cultural Review', href: '/admin/i18n-accessibility/quality/cultural' },
        { name: 'Accessibility Audit', href: '/admin/i18n-accessibility/quality/audit' },
        { name: 'Performance Impact', href: '/admin/i18n-accessibility/quality/performance' },
      ],
    },
    {
      name: 'System Settings',
      href: '/admin/i18n-accessibility/settings',
      icon: Settings,
      current: false,
      children: [
        { name: 'General Configuration', href: '/admin/i18n-accessibility/settings' },
        { name: 'API Integration', href: '/admin/i18n-accessibility/settings/api' },
        { name: 'Backup & Restore', href: '/admin/i18n-accessibility/settings/backup' },
        { name: 'Security Settings', href: '/admin/i18n-accessibility/settings/security' },
      ],
    },
  ];

  const quickStats = [
    {
      name: 'Active Languages',
      value: '12',
      icon: Globe,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      name: 'Pending Translations',
      value: '89',
      icon: Languages,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      name: 'Accessibility Reports',
      value: '23',
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      name: 'User Feedback',
      value: '156',
      icon: MessageSquare,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="relative z-50 lg:hidden">
          <div className="fixed inset-0 bg-gray-900/80" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-0 flex">
            <div className="relative mr-16 flex w-full max-w-xs flex-1">
              <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                <button type="button" className="-m-2.5 p-2.5" onClick={() => setSidebarOpen(false)}>
                  <span className="sr-only">Close sidebar</span>
                  <X className="h-6 w-6 text-white" />
                </button>
              </div>
              <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4">
                <div className="flex h-16 shrink-0 items-center">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg">
                      <Languages className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h1 className="text-sm font-semibold text-gray-900">I18n & Accessibility</h1>
                      <p className="text-xs text-gray-500">Global Platform Management</p>
                    </div>
                  </div>
                </div>
                <nav className="flex flex-1 flex-col">
                  <ul role="list" className="flex flex-1 flex-col gap-y-7">
                    <li>
                      <ul role="list" className="-mx-2 space-y-1">
                        {navigation.map((item) => (
                          <li key={item.name}>
                            <a
                              href={item.href}
                              className={`group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold ${
                                item.current
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'text-gray-700 hover:text-blue-700 hover:bg-gray-50'
                              }`}
                            >
                              <item.icon
                                className={`h-5 w-5 shrink-0 ${
                                  item.current ? 'text-blue-700' : 'text-gray-400 group-hover:text-blue-700'
                                }`}
                              />
                              {item.name}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6">
          <div className="flex h-16 shrink-0 items-center">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg">
                <Languages className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-semibold text-gray-900">I18n & Accessibility</h1>
                <p className="text-xs text-gray-500">Global Platform Management</p>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {quickStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.name} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className={`p-1 rounded ${stat.bgColor}`}>
                      <Icon className={`h-4 w-4 ${stat.color}`} />
                    </div>
                    <span className="text-lg font-semibold text-gray-900">{stat.value}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{stat.name}</p>
                </div>
              );
            })}
          </div>

          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <a
                        href={item.href}
                        className={`group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold ${
                          item.current
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-700 hover:text-blue-700 hover:bg-gray-50'
                        }`}
                      >
                        <item.icon
                          className={`h-5 w-5 shrink-0 ${
                            item.current ? 'text-blue-700' : 'text-gray-400 group-hover:text-blue-700'
                          }`}
                        />
                        {item.name}
                      </a>
                      {item.children && (
                        <ul className="mt-1 px-2">
                          {item.children.map((child) => (
                            <li key={child.name}>
                              <a
                                href={child.href}
                                className="group flex gap-x-3 rounded-md p-2 pl-8 text-sm leading-6 text-gray-600 hover:text-blue-700 hover:bg-gray-50"
                              >
                                {child.name}
                              </a>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </nav>

          {/* Quick Actions */}
          <div className="border-t border-gray-200 pt-4 pb-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <button className="w-full flex items-center gap-2 text-sm text-gray-600 hover:text-blue-700 hover:bg-gray-50 rounded-md p-2">
                <Eye className="h-4 w-4" />
                Review Content
              </button>
              <button className="w-full flex items-center gap-2 text-sm text-gray-600 hover:text-blue-700 hover:bg-gray-50 rounded-md p-2">
                <Flag className="h-4 w-4" />
                Report Issue
              </button>
              <button className="w-full flex items-center gap-2 text-sm text-gray-600 hover:text-blue-700 hover:bg-gray-50 rounded-md p-2">
                <Volume2 className="h-4 w-4" />
                Test Accessibility
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" />
          </button>

          {/* Separator */}
          <div className="h-6 w-px bg-gray-200 lg:hidden" />

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="relative flex flex-1 items-center">
              <h2 className="text-lg font-semibold text-gray-900">
                Internationalization & Accessibility Management
              </h2>
            </div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {/* Notification icon */}
              <button type="button" className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500">
                <span className="sr-only">View notifications</span>
                <AlertTriangle className="h-6 w-6" />
              </button>

              {/* Profile dropdown */}
              <div className="relative">
                <button type="button" className="-m-1.5 flex items-center p-1.5" id="user-menu-button">
                  <span className="sr-only">Open user menu</span>
                  <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                    <Users className="h-5 w-5 text-gray-600" />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        <main className="py-8">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
