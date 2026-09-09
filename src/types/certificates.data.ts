// src/types/certificates.data.ts

export interface Certificate {
  id: number;
  title: string;
  organization: string;
  year: string;
  credentialUrl?: string;
  verifyUrl?: string;
  pdfUrl?: string;
  description: string;
  skills: string[];
  topics: string[];
  featured: boolean;
  tags: string[];
  // Optional fields for future use
  month?: string;
  credentialId?: string;
  image?: string;
  modules?: number;
  hours?: number;
}

export const certificatesData: Certificate[] = [
  {
    id: 1,
    title: 'Python Essentials 1',
    organization: 'Cisco Networking Academy',
    year: '2026',
    credentialUrl: 'https://www.credly.com/badges/0ed0ab6d-ccaf-4974-b463-ee9ad7a7b66b',
    verifyUrl: 'https://www.credly.com/badges/0ed0ab6d-ccaf-4974-b463-ee9ad7a7b66b',
    pdfUrl: '/certificates/Python_Essentials_1.pdf',
    description:
      'Foundational Python programming covering core concepts, functions, collections, exceptions, and problem-solving.',
    skills: ['Python', 'Functions', 'Data Structures', 'Exception Handling', 'Problem Solving'],
    topics: [
      'Python Programming',
      'Control Flow',
      'Functions',
      'Data Structures',
      'Programming Fundamentals',
    ],
    featured: true,
    tags: ['Python', 'Programming', 'Cisco'],
  },
  {
    id: 2,
    title: 'Cyber Threat Management',
    organization: 'Cisco Networking Academy',
    year: '2026',
    credentialUrl: 'https://www.credly.com/badges/e78f993d-d7e0-4de8-94a2-76383f0971b0',
    verifyUrl: 'https://www.credly.com/badges/e78f993d-d7e0-4de8-94a2-76383f0971b0',
    pdfUrl: '/certificates/Cyber_Threat_Management.pdf',
    description:
      'Modern cyber threat operations including attack techniques, threat analysis, security operations, and risk management.',
    skills: [
      'Cybersecurity',
      'Threat Analysis',
      'Risk Management',
      'Network Security',
      'Incident Response',
    ],
    topics: [
      'Cyber Threats',
      'Security Operations',
      'Risk Assessment',
      'Threat Intelligence',
      'Network Defense',
    ],
    featured: true,
    tags: ['Cybersecurity', 'Cisco', 'Security'],
  },
  {
    id: 3,
    title: 'Introduction to Cybersecurity',
    organization: 'Cisco Networking Academy',
    year: '2026',
    credentialUrl: 'https://www.credly.com/badges/049d9f03-cf86-46f6-924d-685a20ce5487',
    verifyUrl: 'https://www.credly.com/badges/049d9f03-cf86-46f6-924d-685a20ce5487',
    pdfUrl: '/certificates/Introduction_to_Cybersecurity.pdf',
    description:
      'Cybersecurity fundamentals including digital privacy, common threats, and protecting systems, networks, and personal information.',
    skills: ['Cybersecurity', 'Network Fundamentals', 'Digital Privacy', 'Security Awareness'],
    topics: [
      'Cybersecurity Fundamentals',
      'Digital Privacy',
      'Cyber Threats',
      'Security Best Practices',
    ],
    featured: false,
    tags: ['Cybersecurity', 'Cisco'],
  },
];
