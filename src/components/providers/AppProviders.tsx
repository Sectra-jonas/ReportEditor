"use client";

import type { ReactNode } from 'react';
import { ReportProvider } from './ReportProvider';
import { TemplateProvider } from './TemplateProvider';

export const AppProviders = ({ children }: { children: ReactNode }) => {
  return (
    <ReportProvider>
      <TemplateProvider>
        {children}
      </TemplateProvider>
    </ReportProvider>
  );
};
