const sessionTypes = [
  {
    id: "theory",
    label: "Theory Training",
    desc: "Briefing, rules, phraseology, airspace, procedures",
    examOnly: false,
  },
  {
    id: "practical-unofficial",
    label: "Unofficial Practical",
    desc: "Practice session without official assessment",
    examOnly: false,
  },
  {
    id: "practical-official",
    label: "Official Practical",
    desc: "Official practical training recorded by staff",
    examOnly: false,
  },
  {
    id: "knowledge-check",
    label: "Knowledge Check-up",
    desc: "Pre-exam or rating knowledge check",
    examOnly: true,
  },
  {
    id: "exam-practical",
    label: "Practical Exam",
    desc: "Official rating practical examination",
    examOnly: true,
  },
];

export default sessionTypes;