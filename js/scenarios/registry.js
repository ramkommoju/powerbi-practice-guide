/* ============================================
   Scenario Registry — Manifest of all scenarios
   Add new scenarios here + create a matching JS file
   ============================================ */

window.ScenarioRegistry = [
  {
    id: 'retail-sales',
    title: 'Retail Sales Analytics',
    subtitle: 'FreshMart Grocery Chain',
    description: 'Build a complete sales analytics dashboard for a multi-store grocery chain. Practice data cleaning, star schema modelling, time intelligence, and interactive reports.',
    difficulty: 'Beginner to Intermediate',
    tags: ['Star Schema', 'Time Intelligence', 'CALCULATE', 'Power Query', 'KPIs'],
    icon: '\ud83d\uded2',
    iconBg: '#DCFCE7',
    estimatedTime: '6\u20138 hours',
    sections: ['requirements', 'data', 'transformation', 'data-model', 'reports', 'dax', 'practice', 'sql-load', 'sql-practice'],
    sectionDefs: [
      { id: 'requirements', label: 'Business Requirements', icon: '\ud83c\udfaf' },
      { id: 'data', label: 'Source Data', icon: '\ud83d\uddc4' },
      { id: 'transformation', label: 'Data Transformation', icon: '\ud83d\udd27' },
      { id: 'data-model', label: 'Data Model', icon: '\ud83d\uddc2' },
      { id: 'reports', label: 'Reports', icon: '\ud83d\udcca' },
      { id: 'dax', label: 'DAX Measures', icon: '\ud83e\uddee' },
      { id: 'practice', label: 'DAX Practice', icon: '\ud83e\udde9' },
      { id: 'sql-load', label: 'SQL Load', icon: '\ud83d\uddc3' },
      { id: 'sql-practice', label: 'SQL Practice', icon: '\ud83d\udee0' }
    ]
  }
];
