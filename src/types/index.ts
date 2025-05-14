export interface Report {
  id: string;
  name: string;
  content: any; // TipTap content is JSON
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportTemplate {
  id: string;
  name: string;
  content: any; // TipTap content is JSON
  createdAt: Date;
  updatedAt: Date;
}

// Represents a field parsed from a template, to be rendered in the report
export interface TemplateField {
  type: 'basic' | 'multi-option';
  name: string; // e.g., "Patient Name" or "Severity"
  defaultValue?: string; // For basic fields, e.g., "Patient Name"
  options?: string[]; // For multi-option fields, e.g., ["Mild", "Moderate", "Severe"]
  currentValue: string; // The actual value in the report
}
