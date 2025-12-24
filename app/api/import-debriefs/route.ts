import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

// Function to get Supabase client
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_supabase_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.supabase_SUPABASE_SERVICE_ROLE_KEY
  return createClient(supabaseUrl!, supabaseServiceKey!)
}

// All debriefs from the MIGRATION_DEBRIEFS CSV
const DEBRIEFS_DATA = [
  {
    date: "12/5/2025",
    clinic: "Consulting",
    client: "Sawyer Parks",
    hours: 12,
    summary:
      "Backdating since last form – built prezy, prepped final changes w team this week, finalized prototype floor plans & designs. Making small tweaks to prezy",
    student: "Adam Calnan",
    questions: "",
    actionItems: "Also forecasting multiple team rehearsals – super hard to get collective availability :/",
  },
  {
    date: "12/4/2025",
    clinic: "Funding",
    client: "Crown Legends",
    hours: 6,
    summary: "Worked on final presentation & finalized funding package",
    student: "Mason Holt",
    questions: "",
    actionItems: "",
  },
  {
    date: "12/4/2025",
    clinic: "Funding",
    client: "City of Malden",
    hours: 3,
    summary: "Final Presentation. Final Deliverable Document. Business Resource Guide Review",
    student: "Muskan Kapoor",
    questions: "",
    actionItems: "",
  },
  {
    date: "12/4/2025",
    clinic: "Funding",
    client: "Intriguing Hair",
    hours: 8,
    summary:
      "This week was a major one because we had to finalize all our deliverables and presentation. I'm glad we managed to complete everything we discussed with our client, except for the one inventory management task that was a little incomplete due to a lack of synthesized data on the client's end. However, in the end, it was very rewarding to hear our client's feedback in the final meeting as she was happy with what we presented.",
    student: "Keya Patel",
    questions: "",
    actionItems: "",
  },
  {
    date: "12/4/2025",
    clinic: "Funding",
    client: "Marabou Café",
    hours: 5,
    summary:
      "This week, the main focus was on working on our final presentation. We have been preparing our final Deliverables to the client as well as consulting our Clinical director to do a review of our work.",
    student: "Nyasha Mukwat",
    questions: "",
    actionItems: "",
  },
  {
    date: "12/4/2025",
    clinic: "Marketing",
    client: "The Downtown Paw",
    hours: 3,
    summary:
      "This week, I met with Krysthal on Wednesday to work together on our final presentation slides. We collaborated to prepare and finalize the content, ensuring that it was cohesive and aligned with the project goals. We sent our final report to Purva and our team will meet this weekend to practice our presentation.",
    student: "Maggie Murphy",
    questions: "",
    actionItems: "Our team will be meeting on zoom this weekend to practice for our final presentation.",
  },
  {
    date: "12/1/2025",
    clinic: "Accounting",
    client: "REWRITE",
    hours: 8,
    summary:
      "Final project work, writing the Tax Analysis, Revenue Analysis, meeting with teams for rehearsal of final project. This was for the week of November 24-December 1",
    student: "Declan Leahy",
    questions: "",
    actionItems: "",
  },
  {
    date: "11/30/2025",
    clinic: "Consulting",
    client: "Marabou Café",
    hours: 12.9,
    summary:
      "Create and share final presentation (Canva). Complete the Catering Expansion Plan. Respond to lawyers asap- invite to presentation. Compile all deliverables > check against SOW. Send client progress report / email. Send client catering expansion plan. Review deliverables and make recommendations. Schedule final presentation run through",
    student: "Marian O'Brien",
    questions: "",
    actionItems:
      "Send all deliverables to professor mooney. Finalize deliverables as a team based on professor feedback. Create packet with all deliverables. Send deliverables to the client. Develop slides for the final presentation (introduction, legal and operations). Finalize slides as a team. Practice presentation as a team. Send final presentation to the client and professor",
  },
  {
    date: "11/29/2025",
    clinic: "Funding",
    client: "REWRITE",
    hours: 9.5,
    summary:
      "This week, I wrapped up all of our deliverables for the client. I completed the full investor list, found and added points of contact, and gathered additional recommendations like grants and accelerators that align with their updated funding strategy. I also compiled everything into the written 'Compilation of All Deliverables' document and finished the PowerPoint to go along with it. Overall, everything is finalized and ready for review.",
    student: "Klestiola Xherimeja",
    questions: "",
    actionItems:
      "Team dry run today at 6 PM. Additional team meeting tomorrow if needed. Send the full deliverables package to the directors and the client. Final presentation on Monday",
  },
  {
    date: "11/29/2025",
    clinic: "Funding",
    client: "REWRITE",
    hours: 4.5,
    summary: "Finalized deliverables, worked on final presentation and final deliverable document",
    student: "Max Banoun",
    questions: "",
    actionItems: "",
  },
  {
    date: "11/28/2025",
    clinic: "Accounting",
    client: "City of Malden",
    hours: 2,
    summary:
      "Worked on the KPI Dashboard for final deliverable documents, along with the final presentation in the works for the client presentation on 12/8.",
    student: "Neel Patel",
    questions: "",
    actionItems: "",
  },
  {
    date: "11/27/2025",
    clinic: "Consulting",
    client: "Serene Cycle",
    hours: 12,
    summary:
      "1 hour – Affiliate Program Troubleshooting. 3 hours – Final Presentation Formatting & Content Development. 1 hour – Team Meeting. 3 hours – Client Communication on Career Pivot. 1 hour – Marketing Meeting. 1.5 hours – Client Meeting. 1.5 hours – Post-Meeting Email Drafting.",
    student: "Annalise Fosnight",
    questions: "Not applicable",
    actionItems: "Not applicable",
  },
  {
    date: "11/27/2025",
    clinic: "Funding",
    client: "Crown Legends",
    hours: 5,
    summary:
      "Met with Prof. Mooney to discuss funding path for our client, worked on a Funding 101 presentation to present to our client prior to final presentation",
    student: "Mason Holt",
    questions: "",
    actionItems: "",
  },
  {
    date: "11/27/2025",
    clinic: "Consulting",
    client: "SEED",
    hours: 6,
    summary:
      "Working on the final presentation slides. We had a client meeting, three team meetings, one mini team meeting and the rest was independent research time.",
    student: "Masudi Mugudwa",
    questions: "",
    actionItems: "",
  },
  {
    date: "11/27/2025",
    clinic: "Accounting",
    client: "Serene Cycle",
    hours: 4,
    summary: "Finished all the client work and finished presentation for the 1st",
    student: "Riley Dibiase",
    questions: "NA",
    actionItems: "NA",
  },
  {
    date: "11/27/2025",
    clinic: "Funding",
    client: "Marabou Café",
    hours: 7,
    summary:
      "It's been my busiest week yet. I began with a Seed class on Monday, then moved straight into meetings with the clinic director and our team members as we prepared for the final project.",
    student: "Nyasha Mukwat",
    questions: "",
    actionItems: "",
  },
  {
    date: "11/27/2025",
    clinic: "Funding",
    client: "Crown Legends",
    hours: 4,
    summary:
      "On Monday, we met with the Clinic Directors of Accounting and Resource Acquisition. On Tuesday, we held a meeting with the team leader to review the project's progress. On Wednesday, I met with my funding colleague to finalize our recommendations",
    student: "Abednego Nakoma",
    questions: "",
    actionItems: "",
  },
  {
    date: "11/27/2025",
    clinic: "Funding",
    client: "City of Malden",
    hours: 8,
    summary: "Final ppt and deliverable document",
    student: "Muskan Kapoor",
    questions: "",
    actionItems: "",
  },
  {
    date: "11/27/2025",
    clinic: "Funding",
    client: "Intriguing Hair",
    hours: 9,
    summary:
      "Our deliverables are 95% done, with a few refinements required on the funding end. It was one of the busiest weeks for me since my other teammate and I had to take care of the financial projections and loan application.",
    student: "Keya Patel",
    questions: "",
    actionItems: "",
  },
  {
    date: "11/27/2025",
    clinic: "Marketing",
    client: "SEED",
    hours: 12,
    summary:
      "Final presentation meeting x4 hours. Meeting with Patty Corey. Client meeting x1.5 hours. Final presentation design prep individual x2 hours. Run through prep presentation 2.5 hours.",
    student: "Maura Sullivan",
    questions: "",
    actionItems: "",
  },
  {
    date: "11/27/2025",
    clinic: "Marketing",
    client: "The Downtown Paw",
    hours: 4,
    summary:
      "I finalized my KPI assignment, ensuring that the performance indicators are clearly defined and organized in the dashboard. I finalized the report, which provides a comprehensive overview of the findings, insights, and recommendations.",
    student: "Maggie Murphy",
    questions: "",
    actionItems: "My remaining action items focus on preparing for the upcoming presentation and final deliverables.",
  },
  {
    date: "11/23/2025",
    clinic: "Funding",
    client: "REWRITE",
    hours: 5.5,
    summary: "This week, I focused on updating the client deliverables and making progress on the investor list.",
    student: "Klestiola Xherimeja",
    questions: "",
    actionItems: "Finalize all deliverables, including the updated investor list and recommendations",
  },
  {
    date: "11/22/2025",
    clinic: "Consulting",
    client: "SEED",
    hours: 12,
    summary:
      "1 client meeting, 3 mini team meetings, 3 team meetings, 2 client information gathering meetings and 3 hours of independent research. We have updated the budget with current budget information and designed an assumption revenue funding model.",
    student: "Masudi Mugudwa",
    questions: "",
    actionItems: "",
  },
  {
    date: "11/21/2025",
    clinic: "Accounting",
    client: "Marabou Café",
    hours: 4,
    summary:
      "Finished a deliverable: effective excel reporting templates. Working on posting all transactions into QBO. QBO chart of accounts done and sent to client for review",
    student: "Aline Silva",
    questions: "",
    actionItems: "",
  },
  {
    date: "11/21/2025",
    clinic: "Accounting",
    client: "Muffy White",
    hours: 3.5,
    summary:
      "Summary of Work – Past 7 Weeks including client visits, data requests, financial analysis, and invoice review.",
    student: "Merelyn Sojan Choorakoottil",
    questions: "",
    actionItems: "",
  },
  {
    date: "11/21/2025",
    clinic: "Funding",
    client: "REWRITE",
    hours: 3.5,
    summary:
      "Met with Richard Meiklejohn on Monday to discuss any ideas he may have for rewrite, and he was able to provide us some great insight which we have passed along to Alik. Additionally we have almost completed our list of VC funds.",
    student: "Max Banoun",
    questions: "",
    actionItems: "",
  },
  {
    date: "11/20/2025",
    clinic: "Funding",
    client: "Crown Legends",
    hours: 5,
    summary: "Created a grant application template and have 3 suggestions for grants to apply for",
    student: "Mason Holt",
    questions: "",
    actionItems: "",
  },
  {
    date: "11/20/2025",
    clinic: "Accounting",
    client: "REWRITE",
    hours: 5,
    summary:
      "Analyzing Financials for better classification of accounts. Worked on 174 A analysis and how it pertains to ReWrite",
    student: "Declan Leahy",
    questions: "",
    actionItems: "",
  },
  {
    date: "11/20/2025",
    clinic: "Funding",
    client: "Intriguing Hair",
    hours: 3,
    summary:
      "We had a meeting with Nikia and Professor Mooney, which gave us a better understanding of the type of funding she is looking for and our next steps.",
    student: "Ishani Rana",
    questions: "",
    actionItems: "We will be working on finishing the financial projections this weekend and having our team meeting.",
  },
  {
    date: "11/20/2025",
    clinic: "Accounting",
    client: "Serene Cycle",
    hours: 10,
    summary:
      "This week I finished getting everything brought into QuickBooks and finished organizing it completely. I made about 5 training videos to send to the client for future reference.",
    student: "Riley Dibiase",
    questions: "N/A",
    actionItems: "Just waiting for the final meeting with client and then we will be all complete!",
  },
  {
    date: "11/20/2025",
    clinic: "Consulting",
    client: "Intriguing Hair",
    hours: 7,
    summary:
      "Met with Nikia to map the business model, product lines and customer segments. Reviewed current channels, pricing, promotions and Shopify site.",
    student: "Shubhangi Srivastava",
    questions: "No questions, everything is working out really well.",
    actionItems:
      "Awaiting further guidance from Mead and the Foley team on the logo change versus name change strategy",
  },
  {
    date: "11/20/2025",
    clinic: "Consulting",
    client: "REWRITE",
    hours: 6,
    summary:
      "Work on building business KPI dashboard as one of the deliverable for our client, Developed shareable document for the entire team to compile their individual deliverables.",
    student: "Shah Sakshi Sanjay",
    questions: "None for this week",
    actionItems: "Upcoming meeting with client on Monday, 11/24",
  },
  {
    date: "11/20/2025",
    clinic: "Accounting",
    client: "Sawyer Parks",
    hours: 4,
    summary:
      "working on forecasting, comparing numbers with similar buildings in the region, researching the types of tenants that would best suit the building",
    student: "Sara Marmoucha",
    questions: "",
    actionItems: "",
  },
  {
    date: "11/20/2025",
    clinic: "Funding",
    client: "Serene Cycle",
    hours: 4,
    summary:
      "Did some light research this week. Will continue to add final information into the excel I've prepared for my client.",
    student: "Ashley Gonzalez",
    questions: "",
    actionItems: "",
  },
  {
    date: "11/20/2025",
    clinic: "Consulting",
    client: "Serene Cycle",
    hours: 8.5,
    summary:
      "1. Marketing Meeting – 1 hour. 2. Client Meeting – 1 hour. 3. Client Calls (2x) – 2 hours. 4. Email Communication – ~3 hours. 5. Final Presentation Preparation – 1 hour.",
    student: "Annalise Fosnight",
    questions: "N/A",
    actionItems: "N/A",
  },
  {
    date: "11/20/2025",
    clinic: "Consulting",
    client: "Marabou Café",
    hours: 5.5,
    summary:
      "Send client weekly progress report. Work on Catering Expansion tasks. Re-prioritize our deliverables with the team.",
    student: "Marian O'Brien",
    questions: "",
    actionItems: "We will be working on completing deliverables and beginning the final presentation.",
  },
  {
    date: "11/20/2025",
    clinic: "Consulting",
    client: "Crown Legends",
    hours: 4,
    summary:
      "This week, my team focused on finalizing the deliverables. Stuti is going to finish the forecasting on Friday and immediately send it to Mason and Abed.",
    student: "Franziska Greiner",
    questions: "",
    actionItems: "",
  },
  {
    date: "11/20/2025",
    clinic: "Marketing",
    client: "Sawyer Parks",
    hours: 3,
    summary:
      "Client presentation is coming together. We are currently working on forming it, I just finished my marketing plan (marketing persona).",
    student: "Rayah Sibunga",
    questions: "N/a",
    actionItems: "N/a",
  },
  {
    date: "11/20/2025",
    clinic: "Funding",
    client: "Intriguing Hair",
    hours: 6,
    summary:
      "This week was a great milestone for us. We completed our marketing deliverable and have made significant progress with the accounting deliverables.",
    student: "Keya Patel",
    questions: "",
    actionItems: "",
  },
  {
    date: "11/20/2025",
    clinic: "Marketing",
    client: "The Downtown Paw",
    hours: 5,
    summary:
      "This week I've been finishing up the marketing deliverables and formatting the report. I worked with Krysthal to finalize the go-to-market plan.",
    student: "Maggie Murphy",
    questions: "",
    actionItems: "My next steps are to complete the marketing dashboard with Krysthal this week.",
  },
  {
    date: "11/20/2025",
    clinic: "Funding",
    client: "Marabou Café",
    hours: 5,
    summary:
      "Documented updates on client progress and funding needs. Advanced work on financing strategies and resource clinic tasks.",
    student: "Nyasha Mukwat",
    questions: "",
    actionItems: "Continue follow-ups on funding opportunities.",
  },
  {
    date: "11/20/2025",
    clinic: "Funding",
    client: "Crown Legends",
    hours: 4,
    summary:
      "On Monday, I met with the clinic director to assess and evaluate potential funding opportunities for Crown Legends.",
    student: "Abednego Nakoma",
    questions: "",
    actionItems: "",
  },
  {
    date: "11/20/2025",
    clinic: "Marketing",
    client: "SEED",
    hours: 8,
    summary:
      "Final presentation meeting. Client meeting. Team meeting. Creation of presentation style guide. Team meeting to re-draft final presentation",
    student: "Maura Sullivan",
    questions: "",
    actionItems: "",
  },
  {
    date: "11/16/2025",
    clinic: "Funding",
    client: "REWRITE",
    hours: 4,
    summary: "This week, we met with Rewrite on Wednesday and got clarification about their funding status.",
    student: "Klestiola Xherimeja",
    questions: "",
    actionItems: "Finalize the investor list. Meet with Richard on Monday for more market insight",
  },
  {
    date: "11/16/2025",
    clinic: "Funding",
    client: "Intriguing Hair",
    hours: 2.5,
    summary: "This week, we had a team meeting and continued researching the wig industry for our client.",
    student: "Ishani Rana",
    questions: "",
    actionItems: "",
  },
  {
    date: "11/14/2025",
    clinic: "Accounting",
    client: "Marabou Café",
    hours: 3,
    summary:
      "I had a zoom meeting with the owner and was able to set up a quickbooks and was even able to integrate clover",
    student: "Aline Silva",
    questions: "",
    actionItems:
      "I'm currently waiting to hear back from them on which financial reporting templates she best prefers me to improve",
  },
  {
    date: "11/13/2025",
    clinic: "Funding",
    client: "Crown Legends",
    hours: 5,
    summary:
      "Continued working on a Funding Debrief presentation for Crown, and gained insight from Prof Mooney and Mark",
    student: "Mason Holt",
    questions: "",
    actionItems: "",
  },
  {
    date: "11/13/2025",
    clinic: "Consulting",
    client: "Crown Legends",
    hours: 8,
    summary:
      "This week, we had a long discussion with Ken and Mark about our client's financials. I used Shopify and Instagram to get an estimate on how many hat drops they have done each year.",
    student: "Franziska Greiner",
    questions: "",
    actionItems:
      "We're currently waiting for the accounting team to do the forecasting for next year in order to move forward with funding options.",
  },
  {
    date: "11/13/2025",
    clinic: "Consulting",
    client: "SEED",
    hours: 4,
    summary:
      "Participated in client meeting, will meet with Maura directly for deliverable action. Communicated with team.",
    student: "Stuart Atkinson",
    questions: "",
    actionItems: "",
  },
  {
    date: "11/13/2025",
    clinic: "Funding",
    client: "Serene Cycle",
    hours: 6,
    summary:
      "Finished compiling my excel workbook. The workbook included grants and accelerator programs that are currently rolling.",
    student: "Ashley Gonzalez",
    questions: "",
    actionItems: "",
  },
  {
    date: "11/13/2025",
    clinic: "Consulting",
    client: "Marabou Café",
    hours: 7,
    summary:
      "Send email about templates to team. Client meeting (1 hour). Email Paulette - marketing deliverable. Review Mahek's survey.",
    student: "Marian O'Brien",
    questions: "Can you provide any information about how and why each client was matched with their SEED team?",
    actionItems: "We need to reprioritize deliverables based on what is available to us.",
  },
  {
    date: "11/13/2025",
    clinic: "Funding",
    client: "The Downtown Paw",
    hours: 4,
    summary:
      "Went through the missing documents and researched a bit about Prof Mooney option for build out and SBA 504",
    student: "Urmi Vaghela",
    questions: "",
    actionItems: "",
  },
  {
    date: "11/13/2025",
    clinic: "Marketing",
    client: "Sawyer Parks",
    hours: 4,
    summary: "I completed a full marketing plan for Sawyer Parks Enterprises instead of selecting a surgery report.",
    student: "Rayah Sibunga",
    questions: "N/a",
    actionItems: "Response from Hanna",
  },
  {
    date: "11/13/2025",
    clinic: "Consulting",
    client: "Serene Cycle",
    hours: 10,
    summary:
      "1. Client Communication – ~2 hours. 2. Advisor Communication – ~1 hour. 3. Team Meeting – 1 hour. 4. Accounting Clinic Meeting – 1 hour. 5. Marketing Meeting – 1 hour. 6. Legal Meeting with Foley & Lardner – 1 hour.",
    student: "Annalise Fosnight",
    questions: "N/A",
    actionItems: "",
  },
  {
    date: "11/13/2025",
    clinic: "Consulting",
    client: "REWRITE",
    hours: 6,
    summary:
      "Had meeting with REWRITE team and work on the shareable document for the team to consolidate their individual versions of deliverables.",
    student: "Shah Sakshi Sanjay",
    questions: "None",
    actionItems: "Working on the deliverables",
  },
  {
    date: "11/13/2025",
    clinic: "Accounting",
    client: "REWRITE",
    hours: 2,
    summary:
      "Weekly synch with team and worked on financial statement, weekly client check in and communicated areas I had questions about.",
    student: "Declan Leahy",
    questions: "",
    actionItems: "",
  },
  {
    date: "11/13/2025",
    clinic: "Marketing",
    client: "SEED",
    hours: 5.5,
    summary:
      "Client meeting with Chaim. Took notes for my team regarding summaries of meeting notes and next steps. Worked on website graphics and models for final presentation.",
    student: "Maura Sullivan",
    questions: "",
    actionItems: "In-person meeting with group, sending out meeting link from Monday meeting",
  },
  {
    date: "11/13/2025",
    clinic: "Consulting",
    client: "SEED",
    hours: 5,
    summary: "3 meetings: one with client(1 hr), two with team(1&half) 2.5 hours of independent research.",
    student: "Masudi Mugudwa",
    questions: "",
    actionItems: "",
  },
  {
    date: "11/13/2025",
    clinic: "Marketing",
    client: "The Downtown Paw",
    hours: 3,
    summary: "This week, I focused on writing, formatting, and emailing the final copy of the press release to Purva.",
    student: "Maggie Murphy",
    questions: "",
    actionItems: "I will meet with the team leader on Zoom tomorrow to discuss the feedback and align on next steps.",
  },
  {
    date: "11/13/2025",
    clinic: "Funding",
    client: "Intriguing Hair",
    hours: 4,
    summary: "This week, we had a meeting with the client and the legal team to discuss her trademark issues.",
    student: "Keya Patel",
    questions: "",
    actionItems: "",
  },
  {
    date: "11/13/2025",
    clinic: "Funding",
    client: "Marabou Café",
    hours: 5,
    summary:
      "This week, I have started working on alternative funding since I have realized that traditional lenders will not be in a position to lend Marabou.",
    student: "Nyasha Mukwat",
    questions: "",
    actionItems: "",
  },
  {
    date: "11/13/2025",
    clinic: "Funding",
    client: "REWRITE",
    hours: 3,
    summary: "Continued working on our list and prepared for our call with Professor Mooney's introduction.",
    student: "Max Banoun",
    questions: "",
    actionItems: "",
  },
  {
    date: "11/13/2025",
    clinic: "Funding",
    client: "City of Malden",
    hours: 4,
    summary: "Business Resource Guide for Funding",
    student: "Muskan Kapoor",
    questions: "",
    actionItems: "",
  },
  {
    date: "11/13/2025",
    clinic: "Funding",
    client: "Crown Legends",
    hours: 6,
    summary:
      "On Monday, I met with the Clinic Director to discuss ongoing initiatives. On Wednesday, our team met with the Team Leader to review progress.",
    student: "Abednego Nakoma",
    questions: "",
    actionItems: "",
  },
  {
    date: "11/13/2025",
    clinic: "Accounting",
    client: "The Downtown Paw",
    hours: 5,
    summary:
      "Summary of the past 2 weeks (11/07 - 11/21): We received the 2023 and 2024 financials, completed the 3-year forecast for The Downtown Paw.",
    student: "Merelyn Sojan Choorakoottil",
    questions: "How much financing does Kate plan to request?",
    actionItems: "Need to start preparing the presentation slides.",
  },
  {
    date: "11/10/2025",
    clinic: "Marketing",
    client: "Serene Cycle",
    hours: 10,
    summary: "3 client meetings. Website SEO, review section in the webpage, affiliate program.",
    student: "Nicole Nessim",
    questions: "",
    actionItems: "",
  },
  {
    date: "11/9/2025",
    clinic: "Funding",
    client: "REWRITE",
    hours: 4.5,
    summary: "This week, Max and I reached out to Richard Meiklejohn to coordinate a mutual time to speak with him.",
    student: "Klestiola Xherimeja",
    questions: "",
    actionItems: "Meet with Richard on Monday for more market insight. Tailor our funding recommendations.",
  },
  {
    date: "11/7/2025",
    clinic: "Accounting",
    client: "Marabou Café",
    hours: 3,
    summary:
      "Downloaded many reports from Clover. Looked into their financials both excel templates and Clover values.",
    student: "Aline Silva",
    questions: "",
    actionItems: "",
  },
  {
    date: "11/7/2025",
    clinic: "Consulting",
    client: "Sawyer Parks",
    hours: 3.5,
    summary:
      "Toured multiple fi-di fast office suites at 265 Franklin and 160 Federal St to develop potential floor plan.",
    student: "Adam Calnan",
    questions: "",
    actionItems: "Received SOW sign from Hana Mon pm",
  },
  {
    date: "11/7/2025",
    clinic: "Accounting",
    client: "REWRITE",
    hours: 3,
    summary:
      "Analysis of company financial excel spreadsheet. Team planning for targeted KPI's that correlate with the financials.",
    student: "Declan Leahy",
    questions: "",
    actionItems: "",
  },
  {
    date: "11/7/2025",
    clinic: "Funding",
    client: "Crown Legends",
    hours: 4,
    summary:
      "Met with the clinic director on Monday, followed by a meeting with the client. On Friday, our team convened to review the plan.",
    student: "Abednego Nakoma",
    questions: "",
    actionItems: "",
  },
  {
    date: "11/7/2025",
    clinic: "Accounting",
    client: "Serene Cycle",
    hours: 7,
    summary:
      "Scheduled meeting with Jamie to get on QuickBooks. Made excel spreadsheet of all the inventory purchases she has made so far.",
    student: "Riley Dibiase",
    questions: "N/A",
    actionItems: "Just waiting for Jamie and I's weekly meeting to work on categorizing a few more transactions.",
  },
  {
    date: "11/6/2025",
    clinic: "Funding",
    client: "Intriguing Hair",
    hours: 5,
    summary:
      "We had our team meeting with the directors this week on Monday; basically a rundown of our current progress.",
    student: "Keya Patel",
    questions: "",
    actionItems: "",
  },
  {
    date: "11/6/2025",
    clinic: "Consulting",
    client: "Crown Legends",
    hours: 6,
    summary:
      "At the end of last week, I had 1-1 meetings with each clinic. We went over the tasks for the next few weeks.",
    student: "Franziska Greiner",
    questions: "",
    actionItems: "Currently waiting to hear back from our client regarding a few questions and resources we need.",
  },
  {
    date: "11/6/2025",
    clinic: "Consulting",
    client: "Marabou Café",
    hours: 8,
    summary:
      "Finish Marabou Cafe templates. Liquor license feasibility report. Catering Expansion report. Send client progress report.",
    student: "Marian O'Brien",
    questions: "",
    actionItems: "",
  },
  {
    date: "11/6/2025",
    clinic: "Consulting",
    client: "SEED",
    hours: 3,
    summary: "Met with Kenneth, scheduled upcoming client meeting, discussion with Maura on next steps.",
    student: "Stuart Atkinson",
    questions: "",
    actionItems: "N/A",
  },
  {
    date: "11/6/2025",
    clinic: "Funding",
    client: "Intriguing Hair",
    hours: 1,
    summary: "Waiting on some materials from Nikia, and our team lead has a meeting with her this week.",
    student: "Ishani Rana",
    questions: "",
    actionItems: "",
  },
  {
    date: "11/6/2025",
    clinic: "Funding",
    client: "Serene Cycle",
    hours: 5,
    summary: "Updated research and compiled funding opportunities for Serene Cycle.",
    student: "Ashley Gonzalez",
    questions: "",
    actionItems: "",
  },
  {
    date: "11/6/2025",
    clinic: "Marketing",
    client: "SEED",
    hours: 5,
    summary: "Client meeting. Team meeting. Worked on website mockups and marketing deliverables.",
    student: "Maura Sullivan",
    questions: "",
    actionItems: "",
  },
  {
    date: "11/6/2025",
    clinic: "Consulting",
    client: "SEED",
    hours: 4,
    summary: "Team meetings and client communication. Worked on deliverable documentation.",
    student: "Masudi Mugudwa",
    questions: "",
    actionItems: "",
  },
  {
    date: "10/31/2025",
    clinic: "Accounting",
    client: "Marabou Café",
    hours: 3,
    summary: "Started reviewing financial documents and setting up QuickBooks integration.",
    student: "Aline Silva",
    questions: "",
    actionItems: "",
  },
  {
    date: "10/31/2025",
    clinic: "Consulting",
    client: "Crown Legends",
    hours: 5,
    summary: "Team coordination and client meeting preparation. SOW review and deliverable planning.",
    student: "Franziska Greiner",
    questions: "",
    actionItems: "",
  },
  {
    date: "10/31/2025",
    clinic: "Funding",
    client: "REWRITE",
    hours: 3,
    summary: "Started compiling investor research and funding strategy documentation.",
    student: "Klestiola Xherimeja",
    questions: "",
    actionItems: "",
  },
  {
    date: "10/31/2025",
    clinic: "Marketing",
    client: "The Downtown Paw",
    hours: 4,
    summary: "Began work on marketing personas and press release draft.",
    student: "Maggie Murphy",
    questions: "",
    actionItems: "",
  },
  {
    date: "10/30/2025",
    clinic: "Accounting",
    client: "REWRITE",
    hours: 2,
    summary: "Initial financial analysis and document review.",
    student: "Declan Leahy",
    questions: "",
    actionItems: "",
  },
  {
    date: "10/30/2025",
    clinic: "Consulting",
    client: "Serene Cycle",
    hours: 6,
    summary: "Client onboarding meetings and project scope definition.",
    student: "Annalise Fosnight",
    questions: "",
    actionItems: "",
  },
  {
    date: "10/30/2025",
    clinic: "Funding",
    client: "Crown Legends",
    hours: 3,
    summary: "Initial funding research and meeting with clinic director.",
    student: "Mason Holt",
    questions: "",
    actionItems: "",
  },
  {
    date: "10/30/2025",
    clinic: "Marketing",
    client: "SEED",
    hours: 4,
    summary: "Initial client meeting and marketing strategy discussion.",
    student: "Maura Sullivan",
    questions: "",
    actionItems: "",
  },
  {
    date: "10/23/2025",
    clinic: "Accounting",
    client: "Serene Cycle",
    hours: 5,
    summary: "Started QuickBooks setup and transaction categorization.",
    student: "Riley Dibiase",
    questions: "",
    actionItems: "",
  },
  {
    date: "10/23/2025",
    clinic: "Consulting",
    client: "SEED",
    hours: 3,
    summary: "Client meeting and project planning.",
    student: "Stuart Atkinson",
    questions: "",
    actionItems: "",
  },
  {
    date: "10/23/2025",
    clinic: "Funding",
    client: "Intriguing Hair",
    hours: 2,
    summary: "Initial funding research for client.",
    student: "Keya Patel",
    questions: "",
    actionItems: "",
  },
  {
    date: "10/16/2025",
    clinic: "Consulting",
    client: "Marabou Café",
    hours: 4,
    summary: "Initial client meeting and SOW discussion.",
    student: "Marian O'Brien",
    questions: "",
    actionItems: "",
  },
  {
    date: "10/16/2025",
    clinic: "Marketing",
    client: "Sawyer Parks",
    hours: 3,
    summary: "Started marketing research and persona development.",
    student: "Rayah Sibunga",
    questions: "",
    actionItems: "",
  },
  {
    date: "10/9/2025",
    clinic: "Accounting",
    client: "The Downtown Paw",
    hours: 3,
    summary: "Initial data request and financial document collection.",
    student: "Merelyn Sojan Choorakoottil",
    questions: "",
    actionItems: "",
  },
  {
    date: "10/9/2025",
    clinic: "Consulting",
    client: "REWRITE",
    hours: 4,
    summary: "Initial client meeting and project scope discussion.",
    student: "Shah Sakshi Sanjay",
    questions: "",
    actionItems: "",
  },
]

function parseDate(dateStr: string): string {
  const [month, day, year] = dateStr.split("/")
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
}

function getWeekEnding(dateStr: string): string {
  const date = new Date(parseDate(dateStr))
  const dayOfWeek = date.getDay()
  const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek
  date.setDate(date.getDate() + daysUntilSunday)
  return date.toISOString().split("T")[0]
}

function mapClinicName(clinic: string): string {
  const clinicMap: Record<string, string> = {
    Funding: "Resource Acquisition",
    "Resource Acquisition": "Resource Acquisition",
    Accounting: "Accounting",
    Consulting: "Consulting",
    Marketing: "Marketing",
  }
  return clinicMap[clinic] || clinic
}

export async function POST() {
  const supabase = getSupabaseClient()

  const results = {
    totalRecords: DEBRIEFS_DATA.length,
    inserted: 0,
    duplicates: 0,
    errors: [] as string[],
    insertedRecords: [] as any[],
  }

  // First, clear existing data to avoid duplicates (optional - comment out if you want to append)
  // await supabase.from("weekly_summaries").delete().neq("id", "00000000-0000-0000-0000-000000000000")

  // Group debriefs by week_ending + clinic + client for aggregation
  const groupedDebriefs = new Map<string, typeof DEBRIEFS_DATA>()

  for (const debrief of DEBRIEFS_DATA) {
    const weekEnding = getWeekEnding(debrief.date)
    const clinic = mapClinicName(debrief.clinic)
    const key = `${weekEnding}|${clinic}|${debrief.client}`

    if (!groupedDebriefs.has(key)) {
      groupedDebriefs.set(key, [])
    }
    groupedDebriefs.get(key)!.push(debrief)
  }

  // Process each group
  for (const [key, debriefs] of groupedDebriefs) {
    const [weekEnding, clinic, clientName] = key.split("|")

    // Aggregate data
    const totalHours = debriefs.reduce((sum, d) => sum + d.hours, 0)
    const studentCount = new Set(debriefs.map((d) => d.student)).size
    const activityCount = debriefs.length
    const summaries = debriefs.map((d) => `${d.student}: ${d.summary}`).join("\n\n")

    // Check for existing record
    const { data: existing } = await supabase
      .from("weekly_summaries")
      .select("id")
      .eq("week_ending", weekEnding)
      .eq("clinic", clinic)
      .eq("client_name", clientName)
      .maybeSingle()

    if (existing) {
      results.duplicates++
      continue
    }

    // Insert new record
    const record = {
      week_ending: weekEnding,
      clinic: clinic,
      client_name: clientName,
      total_hours: totalHours,
      student_count: studentCount,
      activity_count: activityCount,
      summary: summaries,
      semester: "Fall 2025",
    }

    const { data, error } = await supabase.from("weekly_summaries").insert(record).select().single()

    if (error) {
      results.errors.push(`Error inserting ${key}: ${error.message}`)
    } else {
      results.inserted++
      results.insertedRecords.push(data)
    }
  }

  // Verify final count
  const { count } = await supabase.from("weekly_summaries").select("*", { count: "exact", head: true })

  return NextResponse.json({
    success: true,
    results: {
      ...results,
      finalCount: count,
    },
    message: `Imported ${results.inserted} records, ${results.duplicates} duplicates skipped, ${results.errors.length} errors`,
  })
}

export async function GET() {
  const supabase = getSupabaseClient()

  // Get all records from weekly_summaries
  const { data, error, count } = await supabase
    .from("weekly_summaries")
    .select("*", { count: "exact" })
    .order("week_ending", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Get unique values for audit
  const clinics = [...new Set(data?.map((d) => d.clinic) || [])]
  const clients = [...new Set(data?.map((d) => d.client_name) || [])]
  const weeks = [...new Set(data?.map((d) => d.week_ending) || [])]

  return NextResponse.json({
    success: true,
    totalRecords: count,
    records: data,
    audit: {
      uniqueClinics: clinics,
      uniqueClients: clients,
      uniqueWeeks: weeks.sort(),
      clinicCount: clinics.length,
      clientCount: clients.length,
      weekCount: weeks.length,
    },
  })
}
