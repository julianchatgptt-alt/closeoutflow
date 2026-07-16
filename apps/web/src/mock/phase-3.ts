export const mockNotice =
  "Static sample data for Phase 3 design review. It is not connected to an API.";

export const projects = [
  {
    id: "riverside-medical-office",
    name: "Riverside Medical Office",
    type: "Medical office",
    status: "Closeout In Progress",
    target: "2026-09-15",
    risk: "Medium",
    pm: "Jordan Lee"
  },
  {
    id: "eastgate-retail-buildout",
    name: "Eastgate Retail Buildout",
    type: "Retail",
    status: "Active",
    target: "2026-11-01",
    risk: "Low",
    pm: "Morgan Chen"
  },
  {
    id: "grace-community-church",
    name: "Grace Community Church",
    type: "Religious",
    status: "Owner Review",
    target: "2026-08-20",
    risk: "High",
    pm: "Avery Patel"
  }
] as const;

export const requirements = [
  {
    id: "req-01",
    name: "HVAC O&M Manual",
    trade: "HVAC",
    company: "Ace Mechanical",
    status: "Under review",
    due: "2026-07-12",
    flag: "Overdue"
  },
  {
    id: "req-02",
    name: "Roofing Warranty",
    trade: "Roofing",
    company: "Summit Roofing",
    status: "Requested",
    due: "2026-08-05",
    flag: "Missing"
  },
  {
    id: "req-03",
    name: "Fire Alarm Test Report",
    trade: "Electrical",
    company: "Brightline Electric",
    status: "Approved",
    due: "2026-07-30",
    flag: "—"
  },
  {
    id: "req-04",
    name: "As-built Drawings",
    trade: "General",
    company: "Internal team",
    status: "Processing",
    due: "2026-08-10",
    flag: "—"
  },
  {
    id: "req-05",
    name: "Elevator Certificate",
    trade: "Conveying",
    company: "Vertical Systems",
    status: "Not assigned",
    due: "2026-08-15",
    flag: "—"
  },
  {
    id: "req-06",
    name: "Final Cleaning Record",
    trade: "General",
    company: "Internal team",
    status: "Waived",
    due: "2026-07-28",
    flag: "—"
  }
] as const;

export const documents = [
  {
    id: "doc-01",
    file: "HVAC_O&M_Manual.pdf",
    size: "8.4 MB",
    requirement: "HVAC O&M Manual",
    version: "v2",
    status: "Under review",
    uploader: "Sam Rivera",
    date: "2026-07-14"
  },
  {
    id: "doc-02",
    file: "Roof_Warranty.pdf",
    size: "1.1 MB",
    requirement: "Roofing Warranty",
    version: "v1",
    status: "Available",
    uploader: "Kim Brooks",
    date: "2026-07-13"
  },
  {
    id: "doc-03",
    file: "Fire_Alarm_Report.pdf",
    size: "2.7 MB",
    requirement: "Fire Alarm Test Report",
    version: "v1",
    status: "Approved",
    uploader: "Taylor Reed",
    date: "2026-07-11"
  },
  {
    id: "doc-04",
    file: "As_Builts_Set_A.pdf",
    size: "42 MB",
    requirement: "As-built Drawings",
    version: "v3",
    status: "Superseded",
    uploader: "Jordan Lee",
    date: "2026-07-09"
  },
  {
    id: "doc-05",
    file: "Unknown_Attachment.exe",
    size: "430 KB",
    requirement: "Unclassified",
    version: "v1",
    status: "Quarantined",
    uploader: "Sample uploader",
    date: "2026-07-08"
  }
] as const;

export const reviews = [
  {
    id: "review-01",
    item: "HVAC O&M Manual",
    stage: "PM review · 2 of 3",
    reviewer: "Jordan Lee",
    status: "In progress",
    updated: "2026-07-15"
  },
  {
    id: "review-02",
    item: "Fire Alarm Test Report",
    stage: "Final · 3 of 3",
    reviewer: "Avery Patel",
    status: "Approved",
    updated: "2026-07-14"
  },
  {
    id: "review-03",
    item: "Roofing Warranty",
    stage: "Coordinator · 1 of 2",
    reviewer: "Morgan Chen",
    status: "Rejected",
    updated: "2026-07-12"
  }
] as const;

export const equipment = [
  {
    id: "eq-01",
    name: "AHU-1",
    manufacturer: "Trane",
    model: "TCH120",
    location: "Roof",
    warranty: "5 year",
    docs: "3"
  },
  {
    id: "eq-02",
    name: "Boiler B-1",
    manufacturer: "Lochinvar",
    model: "FBN1001",
    location: "Mechanical 102",
    warranty: "1 year",
    docs: "2"
  },
  {
    id: "eq-03",
    name: "Fire Alarm Panel",
    manufacturer: "Notifier",
    model: "NFS2-3030",
    location: "Electrical 101",
    warranty: "2 year",
    docs: "4"
  }
] as const;

export const warranties = [
  {
    id: "war-01",
    name: "Roof membrane",
    type: "Manufacturer",
    coverage: "20 years",
    start: "2026-08-01",
    end: "2046-08-01",
    party: "Summit Roofing"
  },
  {
    id: "war-02",
    name: "HVAC equipment",
    type: "Manufacturer",
    coverage: "5 years",
    start: "2026-07-01",
    end: "2031-07-01",
    party: "Ace Mechanical"
  }
] as const;

export const companies = [
  {
    id: "co-01",
    name: "Ace Mechanical",
    trades: "HVAC · Plumbing",
    contacts: "4",
    projects: "3",
    primary: "Sam Rivera"
  },
  {
    id: "co-02",
    name: "Brightline Electric",
    trades: "Electrical",
    contacts: "2",
    projects: "2",
    primary: "Taylor Reed"
  },
  {
    id: "co-03",
    name: "Summit Roofing",
    trades: "Roofing",
    contacts: "2",
    projects: "1",
    primary: "Kim Brooks"
  },
  {
    id: "co-04",
    name: "Vertical Systems",
    trades: "Conveying",
    contacts: "1",
    projects: "1",
    primary: "Dana Wells"
  }
] as const;

export const team = [
  {
    id: "team-01",
    name: "Jordan Lee",
    email: "j•••••@example.com",
    role: "Project Manager",
    status: "Active",
    last: "Today"
  },
  {
    id: "team-02",
    name: "Morgan Chen",
    email: "m•••••@example.com",
    role: "Closeout Coordinator",
    status: "Active",
    last: "Yesterday"
  },
  {
    id: "team-03",
    name: "Avery Patel",
    email: "a•••••@example.com",
    role: "Internal Reviewer",
    status: "Invited",
    last: "Not yet"
  }
] as const;

export const templates = [
  {
    id: "tmp-01",
    name: "Medical Office Closeout",
    type: "Medical office",
    items: "42",
    version: "v3"
  },
  { id: "tmp-02", name: "Retail Buildout", type: "Retail", items: "28", version: "v2" },
  { id: "tmp-03", name: "General Commercial", type: "General", items: "34", version: "v1" }
] as const;
