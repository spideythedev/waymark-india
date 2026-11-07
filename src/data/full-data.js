
export const WAYMARK_VERSION = "2.0.0";

export const EDUCATION_LEVELS = [
  {
    id: "after-10",
    title: "After Class 10",
    description: "Explore higher secondary, diploma and vocational pathways."
  },
  {
    id: "after-12",
    title: "After Class 12",
    description: "Explore undergraduate, professional and other pathways."
  },
  {
    id: "undergraduate",
    title: "Undergraduate",
    description: "Explore degrees, specializations and further study."
  },
  {
    id: "postgraduate",
    title: "Postgraduate",
    description: "Explore advanced degrees and research opportunities."
  }
];

export const COURSE_CATEGORIES = [
  { id: "engineering", title: "Engineering & Technology" },
  { id: "medicine", title: "Medicine & Healthcare" },
  { id: "science", title: "Pure & Applied Sciences" },
  { id: "commerce", title: "Commerce & Finance" },
  { id: "management", title: "Business & Management" },
  { id: "law", title: "Law & Legal Studies" },
  { id: "humanities", title: "Humanities & Social Sciences" },
  { id: "design", title: "Design & Creative Arts" },
  { id: "agriculture", title: "Agriculture & Allied Sciences" },
  { id: "vocational", title: "Vocational & Skill Education" },
  { id: "computer-science", title: "Computing & Information Technology" },
  { id: "education", title: "Education & Teaching" }
];

export const DATA_STATUS = {
  VERIFIED: "verified",
  PENDING: "pending",
  OUTDATED: "outdated",
  AI_GENERATED: "ai-generated"
};

export const EMPTY_COURSE_SCHEMA = {
  id: "",
  name: "",
  categoryId: "",
  level: "",
  duration: null,
  eligibility: [],
  entranceExams: [],
  institutions: [],
  fees: {
    minimum: null,
    maximum: null,
    currency: "INR",
    academicYear: null
  },
  careerPaths: [],
  source: {
    authority: "",
    url: "",
    verifiedAt: null,
    academicYear: null
  },
  status: DATA_STATUS.PENDING
};

export const OFFICIAL_SOURCES = [
  {
    id: "ugc",
    name: "University Grants Commission",
    url: "https://www.ugc.gov.in/",
    domain: "Higher education regulation"
  },
  {
    id: "aicte",
    name: "All India Council for Technical Education",
    url: "https://www.aicte-india.org/",
    domain: "Technical education"
  },
  {
    id: "nta",
    name: "National Testing Agency",
    url: "https://nta.ac.in/",
    domain: "Entrance examinations"
  },
  {
    id: "nsp",
    name: "National Scholarship Portal",
    url: "https://scholarships.gov.in/",
    domain: "Scholarships"
  },
  {
    id: "josaa",
    name: "JoSAA",
    url: "https://josaa.nic.in/",
    domain: "Joint seat allocation"
  }
];

export const STUDENT_LEVELS = [
  { id: "class-10", label: "Class 10" },
  { id: "class-11", label: "Class 11" },
  { id: "class-12", label: "Class 12" },
  { id: "diploma", label: "Diploma" },
  { id: "undergraduate", label: "Undergraduate" },
  { id: "postgraduate", label: "Postgraduate" },
  { id: "other", label: "Other" }
];

export const STUDENT_STREAMS = [
  { id: "science-pcm", label: "Science — PCM" },
  { id: "science-pcb", label: "Science — PCB" },
  { id: "science-pcmb", label: "Science — PCMB" },
  { id: "commerce", label: "Commerce" },
  { id: "humanities", label: "Humanities / Arts" },
  { id: "vocational", label: "Vocational" },
  { id: "not-decided", label: "Not decided" }
];

export const STUDENT_INTERESTS = [
  "Computer Science",
  "Artificial Intelligence",
  "Engineering",
  "Medicine",
  "Biotechnology",
  "Physics",
  "Mathematics",
  "Business",
  "Economics",
  "Law",
  "Psychology",
  "Design",
  "Architecture",
  "Research",
  "Agriculture",
  "Humanities",
  "Creative Arts",
  "Entrepreneurship",
  "Public Service",
  "Other"
];

export const STUDENT_GOALS = [
  "University admission",
  "Competitive examinations",
  "Professional career",
  "Research and innovation",
  "Entrepreneurship",
  "Study abroad",
  "Skill development",
  "Still exploring"
];

export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry"
];

