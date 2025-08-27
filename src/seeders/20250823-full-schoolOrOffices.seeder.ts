import { SchoolOrOffice } from "../models";
import { SchoolOrOfficeCreationAttributes } from "../models/SchoolOrOffice";

export const schoolOfficeDepartentUnits = [
  {
    name: "Provost's office",
    financeCode: "FCES/P/001",
    departments: [
      { name: "College Farm", financeCode: "FCES/P/001/001" },
      { name: "Didpanc", financeCode: "FCES/P/001/002" },
      {
        name: "Directorate National Resource Centre For The Disabled",
        financeCode: "FCES/P/001/003",
      },
      {
        name: "Directorate Of Academic Planning",
        financeCode: "FCES/P/001/004",
      },
      {
        name: "Directorate Of Information And Public Relations",
        financeCode: "FCES/P/001/005",
      },
      {
        name: "Directorate Of Internal Quality Assurance And Control",
        financeCode: "FCES/P/001/006",
      },
      {
        name: "Management Information System",
        financeCode: "FCES/P/001/007",
      },
      {
        name: "Directorate Of Research And Publications",
        financeCode: "FCES/P/001/008",
      },
      {
        name: "Technical/Ict Facilities Maintenance Unit",
        financeCode: "FCES/P/001/009",
      },
    ],
  },
  { name: "Deputy provost's office", financeCode: "FCES/DP/001" },
  {
    name: "College medical centre",
    financeCode: "FCES/M/001",
    departments: [
      { name: "Consultant", financeCode: "FCES/M/001/001" },
      { name: "Nursing", financeCode: "FCES/M/001/002" },
      { name: "Medical Laboratory", financeCode: "FCES/M/001/003" },
      { name: "Pharmacy", financeCode: "FCES/M/001/004" },
      { name: "Record", financeCode: "FCES/M/001/005" },
      { name: "Finance Officer", financeCode: "FCES/M/001/006" },
    ],
  },
  { name: "Directorate of internal audit", financeCode: "FCES/A/001" },
  {
    name: "Directorate of procurement",
    financeCode: "FCES/PR/001",
    departments: [
      { name: "Capital", financeCode: "FCES/PR/001/001" },
      { name: "Recurrent", financeCode: "FCES/PR/001/002" },
    ],
  },
  {
    name: "Registrar's office",
    financeCode: "FCES/R/001",
    departments: [
      {
        name: "Admissions And Academic Board Division",
        financeCode: "FCES/R/001/001",
      },
      {
        name: "Certification, Verification And Statistics Unit",
        financeCode: "FCES/R/001/002",
      },
      {
        name: "Council & Management Affairs",
        financeCode: "FCES/R/001/003",
      },
      { name: "Examinations And Records", financeCode: "FCES/R/001/004" },
      {
        name: "General Administration Division",
        financeCode: "FCES/R/001/005",
        units: [
          {
            name: "Freedom of Information Unit",
            financeCode: "FCES/R/001/005/001",
          },
          {
            name: "Servicom Unit",
            financeCode: "FCES/R/001/005/002",
          },
          {
            name: "Staff Training and Development Unit",
            financeCode: "FCES/R/001/005/003",
          },
        ],
      },
      {
        name: "Pension And Staff Welfare",
        financeCode: "FCES/R/001/006",
        units: [
          {
            name: "Legal Unit",
            financeCode: "FCES/R/001/006/001",
          },
          {
            name: "Pension Affairs Unit",
            financeCode: "FCES/R/001/006/002",
          },
        ],
      },
      {
        name: "Personnel Affairs Division",
        financeCode: "FCES/R/001/007",
        units: [
          {
            name: "Academic and Junior Staff Unit",
            financeCode: "FCES/R/001/007/001",
          },
          {
            name: "Human Resourse Management System Unit",
            financeCode: "FCES/R/001/007/002",
          },
          {
            name: "Senior Non-teaching Unit",
            financeCode: "FCES/R/001/007/003",
          },
        ],
      },
      {
        name: "Planning, Research And Statistics Division",
        financeCode: "FCES/R/001/008",
      },
      { name: "General Duties", financeCode: "FCES/R/001/010" },
      {
        name: "Students Affairs (Sports Unit)",
        financeCode: "FCES/R/001/011",
      },
      { name: "Students' Affairs Unit", financeCode: "FCES/R/001/012" },
      {
        name: "Students Industrial Work Experience Scheme (Siwes)",
        financeCode: "FCES/R/001/013",
      },
      { name: "Teaching Practice Unit", financeCode: "FCES/R/001/014" },
    ],
  },
  {
    name: "Bursar's office",
    financeCode: "FCES/B/001",
    departments: [
      {
        name: "Budget And Planning",
        financeCode: "FCES/B/001/001",
        units: [
          {
            name: "Capital Monitoring and Evaluation",
            financeCode: "FCES/B/001/001/001",
          },
          {
            name: "Recurrent",
            financeCode: "FCES/B/001/001/002",
          },
          {
            name: "Revenue",
            financeCode: "FCES/B/001/001/003",
          },
        ],
      },
      {
        name: "Final Accounts",
        financeCode: "FCES/B/001/002",
        units: [
          {
            name: "Asset Management and Accounting",
            financeCode: "FCES/B/001/002/001",
          },
          {
            name: "Audit Query",
            financeCode: "FCES/B/001/002/002",
          },
          {
            name: "Final and Fiscal Accounts",
            financeCode: "FCES/B/001/002/003",
          },
          {
            name: "Inventory",
            financeCode: "FCES/B/001/002/004",
          },
          {
            name: "Reconciliation",
            financeCode: "FCES/B/001/002/005",
          },
        ],
      },
      {
        name: "Fund Management",
        financeCode: "FCES/B/001/003",
        units: [
          {
            name: "Cash book",
            financeCode: "FCES/B/001/003/001",
          },
          {
            name: "Central pay office",
            financeCode: "FCES/B/001/003/002",
          },
          {
            name: "Expenditure control",
            financeCode: "FCES/B/001/003/003",
          },
          {
            name: "Tetfund desk officer",
            financeCode: "FCES/B/001/003/004",
          },
        ],
      },
      {
        name: "Loans And Advances",
        financeCode: "FCES/B/001/004",
        units: [
          {
            name: "Tetfund advances",
            financeCode: "FCES/B/001/004/001",
          },
          {
            name: "Others advance",
            financeCode: "FCES/B/001/004/002",
          },
        ],
      },
      {
        name: "Salaries And Wages",
        financeCode: "FCES/B/001/005",
        units: [
          {
            name: "Gratuity and pension",
            financeCode: "FCES/B/001/005/001",
          },
          {
            name: "Salary and wages preparation",
            financeCode: "FCES/B/001/005/002",
          },
          {
            name: "Statutory deduction remittance",
            financeCode: "FCES/B/001/005/003",
          },
        ],
      },
      {
        name: "Sped Venture",
        financeCode: "FCES/B/001/006",
        units: [
          {
            name: "SISS/N&P",
            financeCode: "FCES/B/001/006/001",
          },
          {
            name: "Bakery",
            financeCode: "FCES/B/001/006/002",
          },
          {
            name: "Bookshop",
            financeCode: "FCES/B/001/006/003",
          },
          {
            name: "College farm",
            financeCode: "FCES/B/001/006/004",
          },
        ],
      },
    ],
  },
  {
    name: "College library",
    financeCode: "FCES/C/001",
    departments: [
      { name: "Bindery", financeCode: "FCES/C/001/001" },
      {
        name: "Cataloging and classification",
        financeCode: "FCES/C/001/002",
      },
      { name: "Circulation", financeCode: "FCES/C/001/003" },
      { name: "Collection development", financeCode: "FCES/C/001/004" },
      { name: "Reference", financeCode: "FCES/C/001/005" },
      { name: "Serial", financeCode: "FCES/C/001/006" },
      { name: "Virtual", financeCode: "FCES/C/001/007" },
    ],
  },
  {
    name: "Works and services department",
    financeCode: "FCES/W/001",
    departments: [
      { name: "Building unit", financeCode: "FCES/W/001/001" },
      { name: "Drivers unit", financeCode: "FCES/W/001/002" },
      { name: "Electrical unit", financeCode: "FCES/W/001/003" },
      { name: "Mechanical unit", financeCode: "FCES/W/001/004" },
      { name: "Parks and garden unit", financeCode: "FCES/W/001/005" },
    ],
  },
  {
    name: "School of secondary education: arts and social sciences programmes",
    financeCode: "FCES/S/001",
    departments: [
      {
        name: "Department of Christian Religious Studies",
        financeCode: "FCES/S/001/001",
      },
      {
        name: "Department of Culture and Creative Arts",
        financeCode: "FCES/S/001/002",
      },
      { name: "Department of Economics", financeCode: "FCES/S/001/003" },
      { name: "Department of Geography", financeCode: "FCES/S/001/004" },
      { name: "Department of History", financeCode: "FCES/S/001/005" },
      { name: "Department of Islamic Studies", financeCode: "FCES/S/001/006" },
      { name: "Department of Music", financeCode: "FCES/S/001/007" },
      {
        name: "Department of Political Science",
        financeCode: "FCES/S/001/008",
      },
      { name: "Department of Social Studies", financeCode: "FCES/S/001/009" },
      { name: "Department of Theatre Arts", financeCode: "FCES/S/001/010" },
      { name: "Finance Office", financeCode: "FCES/B/S/001/011" },
      { name: "School Office", financeCode: "FCES/R/S/001/012" },
    ],
  },
  {
    name: "School of early childhood care, primary and adult & non-formal education (ecpae)",
    financeCode: "FCES/S/002",
    departments: [
      {
        name: "Department of Adult and Non-Formal Education",
        financeCode: "FCES/S/002/001",
      },
      {
        name: "Department of Early Childhood Care Education",
        financeCode: "FCES/S/002/002",
      },
      {
        name: "Department of Primary Education Studies",
        financeCode: "FCES/S/002/003",
      },
      { name: "Finance Office", financeCode: "FCES/B/S/002/004" },
      { name: "School Office", financeCode: "FCES/R/S/002/005" },
    ],
  },
  {
    name: "School of general education",
    financeCode: "FCES/S/003",
    departments: [
      {
        name: "Department of Curriculum and Instructions",
        financeCode: "FCES/S/003/001",
      },
      {
        name: "Department of Educational Foundations",
        financeCode: "FCES/S/003/002",
      },
      {
        name: "Department of Educational Psychology",
        financeCode: "FCES/S/003/003",
      },
      { name: "Finance Office", financeCode: "FCES/B/S/003/004" },
      { name: "School Office", financeCode: "FCES/R/S/003/005" },
    ],
  },
  {
    name: "School of general studies education",
    financeCode: "FCES/S/004",
    departments: [
      {
        name: "Department of Science Education",
        financeCode: "FCES/S/004/001",
      },
      {
        name: "Department of Language and Communication",
        financeCode: "FCES/S/004/002",
      },
      {
        name: "Department of Social Science and Humanities",
        financeCode: "FCES/S/004/003",
      },
      { name: "Finance Office", financeCode: "FCES/B/S/004/004" },
      { name: "School Office", financeCode: "FCES/R/S/004/005" },
    ],
  },
  {
    name: "School of secondary  education: languages programme",
    financeCode: "FCES/S/005",
    departments: [
      { name: "Department of Arabic", financeCode: "FCES/S/005/001" },
      { name: "Department of English", financeCode: "FCES/S/005/002" },
      { name: "Department of French", financeCode: "FCES/S/005/003" },
      { name: "Department of Hausa", financeCode: "FCES/S/005/004" },
      { name: "Department of Yoruba", financeCode: "FCES/S/005/005" },
      { name: "Finance Office", financeCode: "FCES/B/S/005/006" },
      { name: "School Office", financeCode: "FCES/R/S/005/007" },
    ],
  },
  {
    name: "School of secondary education: sciences programmes",
    financeCode: "FCES/S/006",
    departments: [
      { name: "Department of Biology", financeCode: "FCES/S/006/001" },
      { name: "Department of Chemistry", financeCode: "FCES/S/006/002" },
      { name: "Department of Computer Science", financeCode: "FCES/S/006/003" },
      {
        name: "Department of Integrated Science",
        financeCode: "FCES/S/006/004",
      },
      { name: "Department of Mathematics", financeCode: "FCES/S/006/005" },
      { name: "Department Physics", financeCode: "FCES/S/006/006" },
      {
        name: "Department of Physical & Health Education",
        financeCode: "FCES/S/006/007",
      },
      { name: "Finance Office", financeCode: "FCES/B/S/006/008" },
      { name: "School Office", financeCode: "FCES/R/S/006/009" },
    ],
  },
  {
    name: "School of special education",
    financeCode: "FCES/S/007",
    departments: [
      {
        name: "Department of Education for Learners with Communication Behaviour Disorders",
        financeCode: "FCES/S/007/001",
      },
      {
        name: "Department of Education for the Gifted and Talented",
        financeCode: "FCES/S/007/002",
      },
      {
        name: "Department of Education for Learners with Hearing Impairment",
        financeCode: "FCES/S/007/003",
      },
      {
        name: "Department of Education for Learners with Intellectual Retardation",
        financeCode: "FCES/S/007/004",
      },
      {
        name: "Department of Education of the Children with Learning Disabilities",
        financeCode: "FCES/S/007/005",
      },
      {
        name: "Department of Education for Learners with Physical & Health Impairment",
        financeCode: "FCES/S/007/006",
      },
      {
        name: "Department of Rehabilitation Education",
        financeCode: "FCES/S/007/007",
      },
      {
        name: "Department of Education for Learners with Visual Impairment",
        financeCode: "FCES/S/007/008",
      },
      {
        name: "Finance Office",
        financeCode: "FCES/B/S/007/009",
      },
      {
        name: "School Office",
        financeCode: "FCES/R/S/007/010",
      },
    ],
  },
  {
    name: "School of secondary education (vocational and technical programmes)",
    financeCode: "FCES/S/008",
    departments: [
      {
        name: "Department of Agricultural Education",
        financeCode: "FCES/S/008/001",
      },
      {
        name: "Department of Business Education",
        financeCode: "FCES/S/008/002",
      },
      {
        name: "Department of Fine & Applied Arts",
        financeCode: "FCES/S/008/003",
      },
      {
        name: "Department of Home Economics",
        financeCode: "FCES/S/008/004",
      },
      {
        name: "Department of Technical Education",
        financeCode: "FCES/S/008/005",
      },
      {
        name: "Finance Office",
        financeCode: "FCES/B/S/008/006",
      },
      {
        name: "School Office",
        financeCode: "FCES/R/S/008/007",
      },
    ],
  },
];
const rows: SchoolOrOfficeCreationAttributes[] = schoolOfficeDepartentUnits.map(
  (data) => ({
    name: data.name,
    financeCode: data.financeCode,
    organizationId: 1,
    isActive: true,
    // description: data.description ?? null, // if you have it
  })
);

export class SchoolOrOfficeSeeder {
  static async run(): Promise<void> {
    await SchoolOrOffice.bulkCreate(rows, {
      ignoreDuplicates: true, // optional
    });
  }
}
