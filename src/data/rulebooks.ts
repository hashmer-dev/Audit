import { Rulebook } from '../types/audit';

export const OFFICIAL_RULEBOOKS: Rulebook[] = [
  {
    id: 'rule-ppra-2004',
    title: 'Public Procurement Rules, 2004 (PPRA Rules)',
    shortCode: 'PPRA 2004',
    authority: 'Public Procurement Regulatory Authority, Cabinet Division, Government of Pakistan',
    year: '2004 (Amended 2022)',
    clausesCount: 51,
    summary: 'Statutory regulation governing all public procurements of goods, services, and works by federal ministries, autonomous bodies, and public sector enterprises.',
    content: 'Full statutory text covering procurement planning, methods of procurement (Rule 36), splitting of tenders (Rule 12), and evaluation criteria.',
    sections: [
      {
        sectionNumber: 'Rule 12',
        title: 'Limitation on Splitting or Regrouping of Proposed Procurement',
        text: 'A procuring agency shall not divide a procurement into separate lots with the intention of avoiding financial limits prescribed for bidding methods or to evade open competitive advertisement on PPRA website or in national daily newspapers.',
      },
      {
        sectionNumber: 'Rule 36(b)',
        title: 'Single Stage Two Envelop Bidding Procedure',
        text: 'The bid shall comprise a single package containing two separate envelopes. Each envelope shall contain separately the financial proposal and the technical proposal. The financial proposals of bids found technically non-responsive shall be returned un-opened.',
      },
      {
        sectionNumber: 'Rule 13',
        title: 'Response Time for Bidders',
        text: 'The procuring agency shall provide fifteen (15) days for national competitive bidding and thirty (30) days for international competitive bidding from date of publication of advertisement.',
      },
      {
        sectionNumber: 'Rule 38',
        title: 'Acceptance of Bids & Lowest Evaluated Bid',
        text: 'The bidder with the lowest evaluated bid, but not necessarily the lowest submitted price, shall be awarded the procurement contract.',
      },
      {
        sectionNumber: 'Rule 39',
        title: 'Performance Guarantee',
        text: 'The procuring agency may require the successful bidder to submit a performance guarantee from a Scheduled Bank in Pakistan not exceeding 10% of the contract value prior to contract execution.',
      },
    ],
  },
  {
    id: 'rule-gfr-vol-1',
    title: 'General Financial Rules (GFR Vol-I & II)',
    shortCode: 'GFR Vol-I',
    authority: 'Ministry of Finance, Government of Pakistan',
    year: 'Federal Edition',
    clausesCount: 340,
    summary: 'Fundamental principles of public financial management, delegation of financial powers, sanctions, and advance disbursements.',
    content: 'Comprehensive code for public financial expenditure, sanction of expenditure, public works, and maintenance of accounts.',
    sections: [
      {
        sectionNumber: 'Rule 11',
        title: 'Standards of Financial Propriety',
        text: 'Every government officer is expected to exercise the same vigilance in respect of expenditure incurred from public moneys as a person of ordinary prudence would exercise in respect of expenditure of his own money.',
      },
      {
        sectionNumber: 'Rule 12',
        title: 'Sanction Beyond Competence and Delegation of Powers',
        text: 'No authority shall incur any expenditure or enter into any liability involving expenditure from government funds until the expenditure has been sanctioned by a competent authority and funds have been provided.',
      },
      {
        sectionNumber: 'Rule 148',
        title: 'Advances to Contractors & Mobilization Advances',
        text: 'Advances to contractors are as a rule prohibited. Where mobilization advances are unavoidable in exceptional capital projects, they must be fully covered by an unconditional irrevocable Bank Guarantee from an AA-rated Scheduled Bank.',
      },
      {
        sectionNumber: 'Rule 23',
        title: 'Prompt Detection and Reporting of Losses',
        text: 'All losses of public funds, fraudulent disbursements, or theft must immediately be reported to the Principal Accounting Officer and the Auditor General of Pakistan.',
      },
    ],
  },
  {
    id: 'rule-ito-2001',
    title: 'Income Tax Ordinance, 2001 & Withholding Provisions',
    shortCode: 'ITO 2001',
    authority: 'Federal Board of Revenue (FBR), Government of Pakistan',
    year: '2001 (Updated Statutory)',
    clausesCount: 240,
    summary: 'Regulates statutory tax deductions at source (WHT) for supplies, contracts, and commercial services rendered to government entities.',
    content: 'Prescribes mandatory withholding tax deduction rates (u/s 153) and penalties for non-withholding by designated withholding agents.',
    sections: [
      {
        sectionNumber: 'Section 153(1)(a)',
        title: 'Payments for Supply of Goods',
        text: 'Every prescribed person making a payment in full or in part for the sale or supply of goods shall deduct advance tax at the rate specified in Division III of Part III of the First Schedule.',
      },
      {
        sectionNumber: 'Section 153(1)(c)',
        title: 'Execution of Contracts & Sub-Contracts',
        text: 'Every prescribed withholding agent shall deduct tax at specified rates from gross payments made for execution of contracts, engineering services, or turnkey works.',
      },
      {
        sectionNumber: 'Section 161',
        title: 'Failure to Pay Withheld Tax or Deduct Tax',
        text: 'Where a person fails to collect or deduct tax, the person shall be personally liable to pay the amount of tax to the Federal Treasury along with default surcharge @ 12% per annum.',
      },
    ],
  },
  {
    id: 'rule-audit-code',
    title: 'Federal Audit Manual & AGP Audit Code',
    shortCode: 'Audit Code',
    authority: 'Department of the Auditor General of Pakistan (AGP)',
    year: 'Official Edition',
    clausesCount: 180,
    summary: 'Guidelines for preparing Departmental Audit Committee (DAC) and Public Accounts Committee (PAC) Draft Audit Paras.',
    content: 'Prescribes standards for Draft Paras (DP), Proposed Audit Observations (PAO), evidence referencing, and statement of facts.',
    sections: [
      {
        sectionNumber: 'Chapter 8 Para 14',
        title: 'Formulation of Audit Observations (PAO / DP)',
        text: 'An audit observation must state the Title, Criteria (Rule Violated), Condition (Statement of Facts), Cause, Effect (Financial Loss/Irregularity in PKR), and Recommendation for corrective action or fixation of responsibility.',
      },
    ],
  },
];
