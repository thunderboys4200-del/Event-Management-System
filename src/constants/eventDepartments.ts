export const MAIN_EVENT_DEPARTMENTS = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'Other'] as const;

export type MainEventDepartment = (typeof MAIN_EVENT_DEPARTMENTS)[number];

export const DIRECT_EVENT_DEPARTMENTS = ['ECE', 'EEE', 'MECH', 'CIVIL'] as const;

export const CSE_BRANCHES = ['AI&DS', 'AI&ML', 'IT', 'CS', 'CSE'] as const;

export type CseBranch = (typeof CSE_BRANCHES)[number];

export const OTHER_EVENT_DEPARTMENTS = [
  'Fine Arts & Student Council',
  'Placement & Training',
  'Physical Education & Athletics',
  'Humanities & Social Sciences',
  ' Management',
] as const;

export type OtherEventDepartment = (typeof OTHER_EVENT_DEPARTMENTS)[number];

export interface EventDepartmentOption {
  value: string;
  label: string;
}

export interface EventDepartmentGroup {
  label: string;
  options: EventDepartmentOption[];
}

/**
 * Event records keep their host stream in the existing `department` field.
 * `Other` is a browsing group only, so it is intentionally not an option for
 * creating an event.
 */
export const EVENT_DEPARTMENT_GROUPS: EventDepartmentGroup[] = [
  {
    label: 'CSE branches',
    options: CSE_BRANCHES.map((branch) => ({
      value: branch,
      label: `CSE — ${branch}`,
    })),
  },
  {
    label: 'Main departments',
    options: DIRECT_EVENT_DEPARTMENTS.map((department) => ({
      value: department,
      label: department,
    })),
  },
  {
    label: 'Other departments',
    options: OTHER_EVENT_DEPARTMENTS.map((department) => ({
      value: department,
      label: department,
    })),
  },
];

type SelectableEventDepartment = (typeof DIRECT_EVENT_DEPARTMENTS)[number] | CseBranch | OtherEventDepartment;

const normalizedDepartmentAliases: Record<SelectableEventDepartment, string[]> = {
  CSE: ['cse', 'computerscienceengineering', 'computerscienceandengineering'],
  ECE: ['ece', 'electronicscommunicationengineering', 'electronicsandcommunicationengineering'],
  EEE: ['eee', 'electricalelectronicsengineering', 'electricalandelectronicsengineering'],
  MECH: ['mech', 'mechanicalengineering', 'mechanicalroboticsengineering'],
  CIVIL: ['civil', 'civilengineering'],
  'AI&DS': ['aids', 'artificialintelligencedatascience', 'artificialintelligenceanddatascience'],
  'AI&ML': ['aiml', 'artificialintelligencemachinelearning', 'artificialintelligenceandmachinelearning'],
  IT: ['it', 'informationtechnology'],
  CS: ['cs', 'computerscience'],
  'Fine Arts & Student Council': ['fineartsstudentcouncil', 'studentaffairscampusactivities'],
  // Support the spelling used by existing records while presenting the corrected name in the UI.
  'Placement & Training': ['placementtraining', 'placementtrainning', 'trainingplacement', 'trainingandplacement'],
  'Physical Education & Athletics': ['physicaleducationathletics'],
  'Humanities & Social Sciences': ['humanitiessocialsciences'],
  ' Management': ['management'],
};

const normalizeDepartment = (department: string) => department.toLowerCase().replace(/[^a-z0-9]/g, '');

export const isKnownEventDepartment = (department: string) =>
  EVENT_DEPARTMENT_GROUPS.some((group) => group.options.some((option) => option.value === department));

/**
 * Matches a selection against the event data returned by the existing API.
 * Aliases keep older long-form department values visible in the new hierarchy.
 */
export const matchesDepartmentSelection = (
  eventDepartment: string,
  selectedDepartment: MainEventDepartment | null,
  selectedBranch: CseBranch | null,
  selectedOtherDepartment: OtherEventDepartment | null,
) => {
  let selection: SelectableEventDepartment | null = null;

  if (selectedDepartment === 'CSE') {
    selection = selectedBranch;
  } else if (selectedDepartment === 'Other') {
    selection = selectedOtherDepartment;
  } else if (selectedDepartment) {
    selection = selectedDepartment;
  }

  return Boolean(selection && normalizedDepartmentAliases[selection].includes(normalizeDepartment(eventDepartment)));
};

export const getDepartmentSelectionLabel = (
  selectedDepartment: MainEventDepartment,
  selectedBranch: CseBranch | null,
  selectedOtherDepartment: OtherEventDepartment | null,
) => {
  if (selectedDepartment === 'CSE') {
    return `CSE · ${selectedBranch}`;
  }

  if (selectedDepartment === 'Other') {
    return `Other · ${selectedOtherDepartment}`;
  }

  return selectedDepartment;
};
