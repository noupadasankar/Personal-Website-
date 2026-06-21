/* =============================================================
   config.js — ⭐ YOUR SINGLE SOURCE OF TRUTH (the site's ".env")
   -------------------------------------------------------------
   Edit ONLY this file to change every link, email, résumé and
   project on the site. Nothing else needs touching.

   • A browser can't read a real .env file without a build step,
     so this JS config is the static-site equivalent — same idea,
     zero tooling, works the instant you deploy.
   • Leave a value as "" (empty) to automatically HIDE that link.
============================================================= */

export const CONFIG = {

  /* ---------------------------------------------------------
     1) LINKS  — paste your URLs here
  --------------------------------------------------------- */
  links: {
    github:   "https://github.com/noupadasankar",
    linkedin: "https://www.linkedin.com/in/shankar-noupada-7a5b77301",
    leetcode: "https://leetcode.com/u/noupadashankar78/",
    twitter:  "",                       // optional — leave "" to hide the X/Twitter link
    email:    "noupadashankar78@gmail.com",
    resume:   "SANKAR_RESUME.pdf",      // file path or full URL
  },

  /* Contact form endpoint (FormSubmit). Leave blank to auto-build
     it from the email above. */
  formEndpoint: "",

  /* ---------------------------------------------------------
     2) PROJECTS  — add / edit / reorder freely
     Image guide:  1200 × 750 px  (16:10).  Any size works (it's
     cropped to fit), but 16:10 looks cleanest. Put files in
     assets/img/ and reference them below.
  --------------------------------------------------------- */
  projects: [
    {
      title:    "TeleHealth Web Application",
      year:     "2025",
      category: "fullstack frontend",        // used by the filter buttons
      desc:     "Real-time telehealth platform with secure video consultations, auth and cloud storage.",
      image:    "assets/img/project-telehealth.png",
      imageAlt: "TeleHealth web application preview",
      tags:     ["React.js", "Firebase", "Tailwind"],
      live:     "",                           // "" hides the Live demo button
      repo:     "",                           // "" hides the Source button
      challenge: "Patients and doctors needed secure, low-latency video consultations with reliable scheduling and auth — without a heavyweight native app.",
      solution:  "Built a responsive React SPA with Firebase auth and realtime data, integrated secure video sessions, appointment scheduling and cloud-stored records.",
      result:    "A production-grade telehealth flow: instant onboarding, encrypted sessions and a clean, accessible UI that works across devices.",
    },
    {
      title:    "Citizen Grievance Portal",
      year:     "2025",
      category: "fullstack",
      desc:     "Civic-issue reporting platform with location tagging, status tracking and authority dashboards.",
      image:    "assets/img/project-grievance.jpg",
      imageAlt: "Citizen grievance management portal preview",
      tags:     ["Full Stack", "MongoDB", "Node.js"],
      live:     "",
      repo:     "",
      challenge: "Citizens lacked a single, transparent channel to report civic issues and track resolution; authorities lacked structured routing.",
      solution:  "Designed a centralized portal with location-tagged complaints, status tracking, role-based dashboards for authorities and a clean reporting flow.",
      result:    "A transparent, accountable pipeline from complaint to resolution with location intelligence and real-time status visibility.",
    },

    /* ---- ⬇ PRESET: your next project. Swap the text + image. ---- */
    {
      title:    "Your Next Project",
      year:     "2026",
      category: "fullstack frontend",
      desc:     "One-line description of your project — what it does and who it's for.",
      image:    "assets/img/Screenshot 2026-06-14 193120.png",   // replace with assets/img/project-3.jpg (1200×750)
      imageAlt: "Project preview",
      tags:     ["Tech", "Stack", "Here"],
      live:     "",
      repo:     "",
      challenge: "Describe the problem you set out to solve.",
      solution:  "Describe what you built and the approach you took.",
      result:    "Describe the outcome and impact.",
    },
  ],
};
