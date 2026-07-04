export type PaperTemplate = "english" | "urdu" | "sindhi" | "maths" | "islamiat" | "science" | "social" | "computer";

export interface TemplateConfig {
  id: PaperTemplate;
  label: string;
  dir: "ltr" | "rtl";
  lang: "en" | "ur" | "sd";
  numbering: (index: number) => string;
  mcqOption: (i: number) => string;
  questionMark: string;
  trueFalseLabel: string;
  studentNameLabel: string;
  fatherNameLabel: string;
  classLabel: string;
  subjectLabel: string;
  totalMarksLabel: string;
  obtainedMarksLabel: string;
  timeLabel: string;
  dateLabel: string;
  teacherSignatureLabel: string;
  principalSignatureLabel: string;
}

export const TEMPLATES: TemplateConfig[] = [
  {
    id: "english",
    label: "English Paper",
    dir: "ltr",
    lang: "en",
    numbering: (i: number) => `${i + 1}.`,
    mcqOption: (i: number) => `${String.fromCharCode(65 + i)})`,
    questionMark: "?",
    trueFalseLabel: "(True / False)",
    studentNameLabel: "Student Name",
    fatherNameLabel: "Father's Name",
    classLabel: "Class",
    subjectLabel: "Subject",
    totalMarksLabel: "Total Marks",
    obtainedMarksLabel: "Obtained Marks",
    timeLabel: "Time",
    dateLabel: "Date",
    teacherSignatureLabel: "Teacher's Signature",
    principalSignatureLabel: "Principal's Signature",
  },
  {
    id: "urdu",
    label: "Urdu Paper",
    dir: "rtl",
    lang: "ur",
    numbering: (i: number) => `س:${i + 1}`,
    mcqOption: (i: number) => {
      const options = ["(i)", "(ii)", "(iii)", "(iv)", "(v)", "(vi)", "(vii)", "(viii)"];
      return options[i] || `(${i + 1})`;
    },
    questionMark: "؟",
    trueFalseLabel: "(سچ / غلط)",
    studentNameLabel: "طالب علم کا نام",
    fatherNameLabel: "والد کا نام",
    classLabel: "جماعت",
    subjectLabel: "مضمون",
    totalMarksLabel: "کل نمبر",
    obtainedMarksLabel: "حاصل کردہ نمبر",
    timeLabel: "وقت",
    dateLabel: "تاریخ",
    teacherSignatureLabel: "استاد کے دستخط",
    principalSignatureLabel: "پرنسپل کے دستخط",
  },
  {
    id: "sindhi",
    label: "Sindhi Paper",
    dir: "rtl",
    lang: "sd",
    numbering: (i: number) => `س:${i + 1}`,
    mcqOption: (i: number) => {
      const options = ["(i)", "(ii)", "(iii)", "(iv)", "(v)", "(vi)", "(vii)", "(viii)"];
      return options[i] || `(${i + 1})`;
    },
    questionMark: "؟",
    trueFalseLabel: "(سچو / ڪوڙو)",
    studentNameLabel: "شاگرد جو نالو",
    fatherNameLabel: "پيءُ جو نالو",
    classLabel: "درجو",
    subjectLabel: "مضمون",
    totalMarksLabel: "کل نمبر",
    obtainedMarksLabel: "حاصل ڪيل نمبر",
    timeLabel: "وقت",
    dateLabel: "تاريخ",
    teacherSignatureLabel: "استاد جا دستخط",
    principalSignatureLabel: "پرنسپل جا دستخط",
  },
  {
    id: "maths",
    label: "Maths Paper",
    dir: "ltr",
    lang: "en",
    numbering: (i: number) => `${i + 1}.`,
    mcqOption: (i: number) => `${String.fromCharCode(65 + i)})`,
    questionMark: "?",
    trueFalseLabel: "(True / False)",
    studentNameLabel: "Student Name",
    fatherNameLabel: "Father's Name",
    classLabel: "Class",
    subjectLabel: "Subject",
    totalMarksLabel: "Total Marks",
    obtainedMarksLabel: "Obtained Marks",
    timeLabel: "Time",
    dateLabel: "Date",
    teacherSignatureLabel: "Teacher's Signature",
    principalSignatureLabel: "Principal's Signature",
  },
  {
    id: "islamiat",
    label: "Islamiat Paper",
    dir: "rtl",
    lang: "ur",
    numbering: (i: number) => `س:${i + 1}`,
    mcqOption: (i: number) => {
      const options = ["(i)", "(ii)", "(iii)", "(iv)", "(v)", "(vi)", "(vii)", "(viii)"];
      return options[i] || `(${i + 1})`;
    },
    questionMark: "؟",
    trueFalseLabel: "(سچ / غلط)",
    studentNameLabel: "طالب علم کا نام",
    fatherNameLabel: "والد کا نام",
    classLabel: "جماعت",
    subjectLabel: "مضمون",
    totalMarksLabel: "کل نمبر",
    obtainedMarksLabel: "حاصل کردہ نمبر",
    timeLabel: "وقت",
    dateLabel: "تاریخ",
    teacherSignatureLabel: "استاد کے دستخط",
    principalSignatureLabel: "پرنسپل کے دستخط",
  },
  {
    id: "science",
    label: "General Science",
    dir: "ltr",
    lang: "en",
    numbering: (i: number) => `${i + 1}.`,
    mcqOption: (i: number) => `${String.fromCharCode(65 + i)})`,
    questionMark: "?",
    trueFalseLabel: "(True / False)",
    studentNameLabel: "Student Name",
    fatherNameLabel: "Father's Name",
    classLabel: "Class",
    subjectLabel: "Subject",
    totalMarksLabel: "Total Marks",
    obtainedMarksLabel: "Obtained Marks",
    timeLabel: "Time",
    dateLabel: "Date",
    teacherSignatureLabel: "Teacher's Signature",
    principalSignatureLabel: "Principal's Signature",
  },
  {
    id: "social",
    label: "Social Studies",
    dir: "ltr",
    lang: "en",
    numbering: (i: number) => `${i + 1}.`,
    mcqOption: (i: number) => `${String.fromCharCode(65 + i)})`,
    questionMark: "?",
    trueFalseLabel: "(True / False)",
    studentNameLabel: "Student Name",
    fatherNameLabel: "Father's Name",
    classLabel: "Class",
    subjectLabel: "Subject",
    totalMarksLabel: "Total Marks",
    obtainedMarksLabel: "Obtained Marks",
    timeLabel: "Time",
    dateLabel: "Date",
    teacherSignatureLabel: "Teacher's Signature",
    principalSignatureLabel: "Principal's Signature",
  },
  {
    id: "computer",
    label: "Computer Paper",
    dir: "ltr",
    lang: "en",
    numbering: (i: number) => `${i + 1}.`,
    mcqOption: (i: number) => `${String.fromCharCode(65 + i)})`,
    questionMark: "?",
    trueFalseLabel: "(True / False)",
    studentNameLabel: "Student Name",
    fatherNameLabel: "Father's Name",
    classLabel: "Class",
    subjectLabel: "Subject",
    totalMarksLabel: "Total Marks",
    obtainedMarksLabel: "Obtained Marks",
    timeLabel: "Time",
    dateLabel: "Date",
    teacherSignatureLabel: "Teacher's Signature",
    principalSignatureLabel: "Principal's Signature",
  },
];

export function getTemplate(id: PaperTemplate): TemplateConfig {
  return TEMPLATES.find((t) => t.id === id) || TEMPLATES[0];
}
