(function exposeTemplates(root, factory) {
  const value = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = value;
  }
  if (root) {
    root.PackLedgerTemplates = value;
  }
})(typeof window !== "undefined" ? window : globalThis, function buildTemplates() {
  "use strict";

  const PACKAGE_TEMPLATES = [
    {
      id: "blank",
      label: "Blank package",
      title: "My submission package",
      note: ""
    },
    {
      id: "homework",
      label: "Homework submission",
      title: "Homework submission package",
      note: "Course, assignment name, student name, and submission date can be added here."
    },
    {
      id: "job",
      label: "Job application",
      title: "Job application materials",
      note: "Resume, portfolio, certificates, and supporting documents included for review."
    },
    {
      id: "event",
      label: "Event registration",
      title: "Event registration materials",
      note: "Registration form, identity or eligibility materials, and related attachments included."
    }
  ];

  function getTemplateById(templateId) {
    return PACKAGE_TEMPLATES.find((template) => template.id === templateId) || PACKAGE_TEMPLATES[0];
  }

  return {
    PACKAGE_TEMPLATES,
    getTemplateById
  };
});
