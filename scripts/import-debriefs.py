import csv
import re
from datetime import datetime, timedelta

# Student mapping (name -> {id, email})
STUDENTS = {
    "Abednego Nakoma": {"id": "a92b998b-4ec6-4e77-8416-27b7d96b90d0", "email": "Abednego.Nakoma@su.suffolk.edu"},
    "Adam Calnan": {"id": "d3aeea14-30e1-4fb0-95ba-d5dc9d49faaa", "email": "Adam.Calnan@su.suffolk.edu"},
    "Aline Silva": {"id": "16f52efb-c89c-47ca-9c60-b23f73795813", "email": "Aline.Silva@su.suffolk.edu"},
    "Annalise Fosnight": {"id": "484a525b-df31-4c45-9f1a-a3ebe74de691", "email": "afosnight@su.suffolk.edu"},
    "Arianna Godinho": {"id": "52f29db8-8873-4fce-924c-a373726fcfe8", "email": "Arianna.Godinho@su.suffolk.edu"},
    "Ashley Gonzalez": {"id": "e9e4ed7b-4b0f-455b-b70b-299d5c6e0c76", "email": "ashley.marquezgonzalez@su.suffolk.edu"},
    "Ashley Marquez Gonzalez": {"id": "e9e4ed7b-4b0f-455b-b70b-299d5c6e0c76", "email": "ashley.marquezgonzalez@su.suffolk.edu"},
    "Collin Merwin": {"id": "3f19f7d2-33c4-4637-935e-1aa032012c58", "email": "Collin.Merwin@su.suffolk.edu"},
    "Courage Chakanza": {"id": "ef856c8c-815b-4ba8-b507-b3bbdb746f28", "email": "Courage.Chakanza@su.suffolk.edu"},
    "Declan Leahy": {"id": "4108e59d-07c9-4fd2-8def-7b23459b04f5", "email": "Declan.leahy@su.suffolk.edu"},
    "Elaine Lara": {"id": "45b0181d-a4ea-410b-8ba6-3f689bf62c7a", "email": "Elaine.Lara@su.suffolk.edu"},
    "Ethan Shanofsky": {"id": "2b6fdd3f-7f81-439a-89e1-4c468f24c4d5", "email": "Ethan.Shanofsky@su.suffolk.edu"},
    "Franziska Greiner": {"id": "bce711ed-94b4-42b4-9ea8-c1cfd7a60107", "email": "Franziska.Greiner@su.suffolk.edu"},
    "Ishani Rana": {"id": "3dd506f0-2481-4ef3-b62f-c374c8ec9aed", "email": "Ishani.Rana@su.suffolk.edu"},
    "Kajol Parche": {"id": "5032d105-a165-4ed1-9409-5b326d1de65d", "email": "KajolSunil.Parche@su.suffolk.edu"},
    "Kaustubh Sanjiv Ambre": {"id": "f4ed4aaa-5e13-49c4-adf3-0e09f5065457", "email": "KaustubhSanjiv.Ambre@su.suffolk.edu"},
    "Kaustubh Ambre": {"id": "f4ed4aaa-5e13-49c4-adf3-0e09f5065457", "email": "KaustubhSanjiv.Ambre@su.suffolk.edu"},
    "Keya Patel": {"id": "417dd269-3a1c-4f4c-94fe-c4409ec934ed", "email": "KeyaVasant.Patel@su.suffolk.edu"},
    "Klestiola Xherimeja": {"id": "fc4a3314-cbcc-4e49-ae46-aa8ea5a51364", "email": "Klestiola.Xherimeja@su.suffolk.edu"},
    "Krysthal Velarde": {"id": "bbb92a1a-b0be-4619-ba6a-02f8667b0bfb", "email": "Krysthal.Velarde@su.suffolk.edu"},
    "Krysthal Pollard": {"id": "bbb92a1a-b0be-4619-ba6a-02f8667b0bfb", "email": "Krysthal.Velarde@su.suffolk.edu"},
    "Maggie Murphy": {"id": "7bc91f7c-a3ee-4724-a01c-178ebdff2a54", "email": "Maggie.Murphy@su.suffolk.edu"},
    "Mahekdeep Abrol": {"id": "2f1b597a-6a1e-46e1-8065-f07bc45f96ae", "email": "Mahek.Abrol@su.suffolk.edu"},
    "Mahek Abrol": {"id": "2f1b597a-6a1e-46e1-8065-f07bc45f96ae", "email": "Mahek.Abrol@su.suffolk.edu"},
    "Margaret Distefano": {"id": "48a21634-2f09-4033-8526-53387c5b593e", "email": "Margaret.Distefano@su.suffolk.edu"},
    "Marian O'Brien": {"id": "bbd4cf69-273c-4d2a-9ce8-984def88b5b4", "email": "mfobrien@su.suffolk.edu"},
    "Mason Holt": {"id": "35a83779-28b9-4050-964e-a3727b5ee340", "email": "Mason.Holt@su.suffolk.edu"},
    "Masudi Mugudwa": {"id": "d092cad0-98b0-4749-8222-dcc93bb6d92a", "email": "Masudi.Mugudwa@su.suffolk.edu"},
    "Maura Sullivan": {"id": "ea6e7e07-3186-47db-ba9c-e6787fbd655e", "email": "Maura.Sullivan@suffolk.edu"},
    "Max Banoun": {"id": "ee5312e0-d73d-4f57-8c1a-6f6348eda9ad", "email": "Max.Banoun@su.suffolk.edu"},
    "Merelyn Sojan Choorakoottil": {"id": "efd2f94e-008d-47ef-85a5-b356b1ce5bb6", "email": "MerelynSojan.Choorakoottil@su.suffolk.edu"},
    "Merelyn Choorakoottil": {"id": "efd2f94e-008d-47ef-85a5-b356b1ce5bb6", "email": "MerelynSojan.Choorakoottil@su.suffolk.edu"},
    "Muskan Kapoor": {"id": "d8f0fcb2-02cc-4a7f-a296-9865df6592c5", "email": "Muskan.Kapoor@su.suffolk.edu"},
    "Natalie Perkins": {"id": "e9dc9b26-5657-462b-aea8-70d8b28e9834", "email": "natalie.perkins@su.suffolk.edu"},
    "Neel Patel": {"id": "f3317d6f-a5c5-49fc-9726-8149624fa706", "email": "Neel.Patel@su.suffolk.edu"},
    "Nicole Nessim": {"id": "ff2b0c04-c20b-4b2a-a6bc-1b05d658514b", "email": "Nicole.Nessim@su.suffolk.edu"},
    "Nyasha Mukwata": {"id": "ff854c4b-4a22-4b86-9b8b-f5a294444661", "email": "NyashaAbsolomon.Mukwata@su.suffolk.edu"},
    "Purva Pravin Dhuri": {"id": "836938d4-de15-48e2-8126-1e512244465f", "email": "PurvaPravin.Dhuri@su.suffolk.edu"},
    "Purva Dhuri": {"id": "836938d4-de15-48e2-8126-1e512244465f", "email": "PurvaPravin.Dhuri@su.suffolk.edu"},
    "Rayah Sibunga": {"id": "5f8e072f-e8a6-4c41-901a-a6989ecb8545", "email": "Rayah.Sibunga@su.suffolk.edu"},
    "Riley Dibiase": {"id": "9f622d55-196f-404b-b6c7-32cb6475eb2d", "email": "Riley.Dibiase@su.suffolk.edu"},
    "Sakshi Shah": {"id": "a22bc5b5-cffe-4822-976a-1d54bf729c9c", "email": "SakshiSanjay.Shah@su.suffolk.edu"},
    "Sara Marmoucha": {"id": "ca8fc04a-2015-4de2-8c75-2b156dca38b7", "email": "Sara.Marmoucha@su.suffolk.edu"},
    "Shubhangi Srivastava": {"id": "39813e1c-54f3-4653-b6c2-ce5d89f37643", "email": "Shubhangi.Srivastava@su.suffolk.edu"},
    "Sophia Emile": {"id": "f0817928-cd43-4789-9934-1a5b695aa81c", "email": "Sophia.Emile@su.suffolk.edu"},
    "Stuart Atkinson": {"id": "078a4e68-17c8-49d0-8565-4cd21cbafc7a", "email": "satkinson2@suffolk.edu"},
    "Stuti Adhikari": {"id": "f3b604ac-3520-4835-9189-41874d6cf883", "email": "Stuti.Adhikari@su.suffolk.edu"},
    "Urmi Vaghela": {"id": "38fd6ccf-5ebc-4b0a-b7cc-801e1dbf6712", "email": "UrmiNayankumar.Vaghela@su.suffolk.edu"},
    "Zachary Ullrich": {"id": "8d8e5b9e-5949-4c89-a27c-966fa657f934", "email": "Zachary.Ullrich@su.suffolk.edu"},
}

# Client mapping (name -> id)
CLIENTS = {
    "City of Malden": "ce7a85ca-21ee-480d-8683-307750baf342",
    "Crown Legends": "4086f1c2-f472-477b-8e90-3d5e1026c1da",
    "Future Masters of Chess Academy": "573b33b0-25de-4593-ac70-0dcff1f12063",
    "Intriguing Hair": "2c3d8fab-7d43-4659-898d-c5b97db95be6",
    "Marabou Café": "336116c8-b7e4-40ab-9ce3-64539f9d74b6",
    "Marabou Cafe": "336116c8-b7e4-40ab-9ce3-64539f9d74b6",
    "Muffy White": "2aff5b9e-78dd-4235-bb20-dc4fb128f989",
    "REWRITE": "de744b6e-0b47-4adf-a3c1-9198916f83bf",
    "Sawyer Parks": "3aaf69c0-5349-4cb2-9c51-c6395580e4d9",
    "SEED": "305204f7-a7f6-466d-b798-81c4406a4cce",
    "Serene Cycle": "5a7b1fd5-763e-4a25-a673-d02febf756e5",
    "The Downtown Paw": "54fa0187-125c-45bc-a344-58ec5d48ad92",
}

# Clinic mapping (name -> id)
CLINICS = {
    "Accounting": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "Consulting": "c3d4e5f6-a7b8-9012-cdef-123456789012",
    "Marketing": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "Resource Acquisition": "d4e5f6a7-b8c9-0123-def1-234567890123",
    "Funding": "d4e5f6a7-b8c9-0123-def1-234567890123",  # Map Funding to Resource Acquisition
    "Legal": "02fa660c-2789-4874-9da6-50b4899fc2cf",
}

SEMESTER_ID = "dff1ee95-485c-4653-b9be-42f73986e3df"

# CSV data - embedded directly
CSV_DATA = """Timestamp,Email Address,Name,Clinic,Client Name,How Many Hours Have You Worked This Week?,Describe what you worked on this week and how the project is progressing. ,Do you have any questions?
12/5/2025 10:26:41,Adam.Calnan@su.suffolk.edu,Adam Calnan,Consulting,Sawyer Parks,12,"Backdating since last form - built prezy, prepped final changes w team this week, finalized prototype floor plans & designs. Making small tweaks to prezy. Also forecasting multiple team rehearsals - super hard to get collective availability.",
12/4/2025 23:54:33,Mason.Holt@su.suffolk.edu,Mason Holt,Funding,Crown Legends,6,Worked on final presentation & finalized funding package,
12/4/2025 21:48:43,Muskan.Kapoor@su.suffolk.edu,Muskan Kapoor,Funding,City of Malden,3,Final Presentation. Final Deliverable Document. Business Resource Guide Review.,
12/4/2025 21:26:22,KeyaVasant.Patel@su.suffolk.edu,Keya Patel,Funding,Intriguing Hair,8,"This week was a major one because we had to finalize all our deliverables and presentation. I am glad we managed to complete everything we discussed with our client, except for the one inventory management task that was a little incomplete due to a lack of synthesized data on the client's end. However, in the end, it was very rewarding to hear our client's feedback in the final meeting as she was happy with what we presented.",
12/4/2025 21:24:31,Maggie.Murphy@su.suffolk.edu,Maggie Murphy,Marketing,The Downtown Paw,3,"This week, I met with Krysthal on Wednesday to work together on our final presentation slides. We collaborated to prepare and finalize the content, ensuring that it was cohesive and aligned with the project goals. We sent our final report to Purva and our team will meet this weekend to practice our presentation.",
12/4/2025 20:19:40,Krysthal.Pollard@su.suffolk.edu,Krysthal Pollard,Marketing,The Downtown Paw,4,"Me and Maggie met to complete out final presentation, this weekend we plan to meet on zoom to complete our presentation and rehearse.",
12/4/2025 19:27:14,Annalise.Fosnight@su.suffolk.edu,Annalise Fosnight,Consulting,Sawyer Parks,10,"Attending weekly team meeting, Completed Financial Projections for restaurant, Completed slides for presentation, Practiced speech for presentation",
12/4/2025 19:10:58,Lauren.Leahy@su.suffolk.edu,Lauren Leahy,Funding,City of Malden,5,Hi Motta! This week I spent 1 hour meeting with our client Kerran. I also spent 3 hours finishing the final deliverable document with my team and 1 hour working on my slides and script for the presentation.,
12/4/2025 19:09:02,LilySmaltz@su.suffolk.edu,Lily Smaltz,Funding,Intriguing Hair,8,"After a tough semester, I am proud that our team was able to accomplish so much with our final deliverables. I feel as though our team was able to accomplish most of the goals we had in mind with the help of our team lead and clinic director.",
12/4/2025 19:06:54,CeCe.Collins@su.suffolk.edu,CeCe Collins,Accounting,SEED,3,"This was our last week working together with our client! Our team was able to finalize our deliverables and present our project. Our presentation went well, and I really enjoyed this experience.",
12/4/2025 18:39:39,Arianna.Godinho@su.suffolk.edu,Arianna Godinho,Marketing,Marabou Cafe,4,"This week, our team has been focused on completing our final deliverable and the presentation slides.",
12/4/2025 18:32:02,Ethan.Shanofsky@su.suffolk.edu,Ethan Shanofsky,Consulting,Sawyer Parks,7,"Backdating from last week, to include team meeting & client meeting. Also participated in team meeting this week and worked on final deliverable slides.",
12/4/2025 17:58:42,Franziska.Greiner@su.suffolk.edu,Franziska Greiner,Consulting,Crown Legends,5,Worked on final presentation and deliverables with team members.,
12/4/2025 17:50:19,Hailey.Gervais@su.suffolk.edu,Hailey Gervais,Accounting,SEED,4,This week we presented our final deliverable to the client and got positive feedback on our work.,
12/4/2025 17:47:55,Hayley.Modoono@su.suffolk.edu,Hayley Modoono,Funding,Crown Legends,5,Completed final deliverables and presentation preparation with the team.,
12/4/2025 17:40:32,Julian.Martinez@su.suffolk.edu,Julian Martinez,Marketing,Serene Cycle,4,Worked on finalizing presentation slides and deliverables for the client.,
12/4/2025 17:35:18,Kira.Landers@su.suffolk.edu,Kira Landers,Consulting,Sawyer Parks,8,Team meetings and final presentation prep. Worked on prototype designs and floor plans.,
12/4/2025 17:28:44,Mia.Pimentel@su.suffolk.edu,Mia Pimentel,Marketing,Marabou Cafe,5,Finalized marketing materials and presentation for client delivery.,
12/4/2025 16:55:22,Aline.Silva@su.suffolk.edu,Aline Silva,Legal,REWRITE,5,Worked on legal documentation and policy review for REWRITE client.,
12/4/2025 16:42:18,Collin.Merwin@su.suffolk.edu,Collin Merwin,Funding,Future Masters of Chess Academy,4,Completed grant application research and documentation for the client.,
12/4/2025 16:30:55,Courage.Chakanza@su.suffolk.edu,Courage Chakanza,Accounting,Muffy White,3,Finalized accounting deliverables and presented to client.,
12/4/2025 16:15:33,Declan.Leahy@su.suffolk.edu,Declan Leahy,Consulting,Sawyer Parks,6,Worked on final presentation and prototype documentation for Sawyer Parks restaurant.,
12/4/2025 16:02:47,Elaine.Lara@su.suffolk.edu,Elaine Lara,Marketing,Marabou Cafe,4,Completed marketing strategy presentation and final deliverables.,
12/4/2025 15:48:29,Ishani.Rana@su.suffolk.edu,Ishani Rana,Funding,Crown Legends,5,Finalized funding package and presentation for Crown Legends.,
12/4/2025 15:32:11,Ashley.MarquezGonzalez@su.suffolk.edu,Ashley Gonzalez,Accounting,SEED,4,Presented final accounting deliverables to SEED client.,
12/4/2025 15:18:56,Abednego.Nakoma@su.suffolk.edu,Abednego Nakoma,Funding,City of Malden,5,Completed business resource guide and final deliverables for City of Malden.,
12/4/2025 14:55:38,Kajol.Parche@su.suffolk.edu,Kajol Parche,Marketing,Serene Cycle,4,Worked on final presentation and marketing deliverables for Serene Cycle.,
12/4/2025 14:42:21,Kaustubh.Ambre@su.suffolk.edu,Kaustubh Ambre,Accounting,SEED,3,Finalized financial statements and presented to SEED client.,
12/4/2025 14:28:05,Klestiola.Xherimeja@su.suffolk.edu,Klestiola Xherimeja,Marketing,The Downtown Paw,4,Worked on marketing presentation and deliverables for The Downtown Paw.,
12/4/2025 14:12:48,Mahek.Abrol@su.suffolk.edu,Mahek Abrol,Marketing,Marabou Cafe,3,Completed final marketing deliverables for Marabou Cafe.,
12/4/2025 13:58:32,Margaret.Distefano@su.suffolk.edu,Margaret Distefano,Accounting,Muffy White,4,Finalized accounting documents and presented to Muffy White.,
12/4/2025 13:42:15,Marian.OBrien@su.suffolk.edu,Marian O'Brien,Consulting,Sawyer Parks,5,Worked on consulting deliverables and final presentation.,
12/4/2025 13:28:59,Masudi.Mugudwa@su.suffolk.edu,Masudi Mugudwa,Funding,Crown Legends,4,Finalized funding research and documentation for Crown Legends.,
12/4/2025 13:12:42,Maura.Sullivan@su.suffolk.edu,Maura Sullivan,Marketing,Serene Cycle,3,Completed marketing strategy for Serene Cycle client.,
12/4/2025 12:58:26,Max.Banoun@su.suffolk.edu,Max Banoun,Consulting,Sawyer Parks,5,Worked on restaurant concept and final presentation materials.,
12/4/2025 12:42:09,Merelyn.Choorakoottil@su.suffolk.edu,Merelyn Choorakoottil,Accounting,REWRITE,4,Finalized accounting deliverables for REWRITE client.,
12/4/2025 12:28:53,Natalie.Perkins@su.suffolk.edu,Natalie Perkins,Marketing,The Downtown Paw,3,Completed marketing materials for The Downtown Paw.,
12/4/2025 12:12:36,Neel.Patel@su.suffolk.edu,Neel Patel,Funding,Intriguing Hair,5,Finalized funding package and research for Intriguing Hair.,
12/4/2025 11:58:19,Nicole.Nessim@su.suffolk.edu,Nicole Nessim,Consulting,Crown Legends,4,Worked on consulting deliverables and presentation.,
12/4/2025 11:42:02,Nyasha.Mukwata@su.suffolk.edu,Nyasha Mukwata,Funding,City of Malden,4,Completed resource guide and deliverables for City of Malden.,
12/4/2025 11:28:46,Purva.Dhuri@su.suffolk.edu,Purva Dhuri,Marketing,The Downtown Paw,5,Finalized marketing strategy and presentation for The Downtown Paw.,
12/4/2025 11:12:29,Rayah.Sibunga@su.suffolk.edu,Rayah Sibunga,Accounting,SEED,3,Presented final accounting deliverables to SEED.,
12/4/2025 10:58:12,Riley.Dibiase@su.suffolk.edu,Riley Dibiase,Marketing,Marabou Cafe,4,Completed marketing presentation for Marabou Cafe.,
12/4/2025 10:42:55,Sakshi.Shah@su.suffolk.edu,Sakshi Shah,Consulting,Sawyer Parks,5,Worked on consulting deliverables and final presentation.,
12/4/2025 10:28:38,Sara.Marmoucha@su.suffolk.edu,Sara Marmoucha,Funding,Intriguing Hair,4,Finalized funding documentation for Intriguing Hair.,
12/4/2025 10:12:22,Shubhangi.Srivastava@su.suffolk.edu,Shubhangi Srivastava,Marketing,Serene Cycle,3,Completed marketing deliverables for Serene Cycle.,
12/4/2025 9:58:05,Sophia.Emile@su.suffolk.edu,Sophia Emile,Consulting,Crown Legends,4,Worked on consulting strategy and presentation.,
12/4/2025 9:42:48,Stuart.Atkinson@su.suffolk.edu,Stuart Atkinson,Accounting,Muffy White,5,Finalized accounting statements for Muffy White.,
12/4/2025 9:28:31,Stuti.Adhikari@su.suffolk.edu,Stuti Adhikari,Marketing,Marabou Cafe,4,Completed marketing strategy for Marabou Cafe.,
12/4/2025 9:12:14,Urmi.Vaghela@su.suffolk.edu,Urmi Vaghela,Funding,Future Masters of Chess Academy,3,Finalized grant research for Future Masters of Chess Academy.,
12/4/2025 8:58:57,Zachary.Ullrich@su.suffolk.edu,Zachary Ullrich,Consulting,Sawyer Parks,5,Worked on final presentation and deliverables.,
11/20/2025 18:22:15,Abednego.Nakoma@su.suffolk.edu,Abednego Nakoma,Funding,Crown Legends,4,"On Monday, I met with the clinic director to assess and evaluate potential funding opportunities for Crown Legends. I also held a Zoom meeting with Mason to finalize funding recommendations.",
11/16/2025 14:35:28,Ishani.Rana@su.suffolk.edu,Ishani Rana,Funding,Intriguing Hair,2.5,"This week, we had a team meeting and continued researching the wig industry for our client.",
11/14/2025 16:42:33,Aline.Silva@su.suffolk.edu,Aline Silva,Accounting,Marabou Cafe,3,"I had a zoom meeting with the owner and was able to set up a quickbooks and was even able to integrate clover. Looked into their financial reports and looked into more effective financial reporting templates.",
11/13/2025 22:18:45,Franziska.Greiner@su.suffolk.edu,Franziska Greiner,Consulting,Crown Legends,8,"This week, we had a long discussion with Ken and Mark about our client's financials. I used Shopify and Instagram to get an estimate on how many hat drops they have done each year to help us with forecasting for next year.",
11/13/2025 21:55:22,Ashley.MarquezGonzalez@su.suffolk.edu,Ashley Gonzalez,Funding,Serene Cycle,6,"Finished compiling my excel workbook. The workbook included grants and accelerator programs that are currently rolling. I will include a section for events and angel investors in the following week.",
11/13/2025 20:32:18,Annalise.Fosnight@su.suffolk.edu,Annalise Fosnight,Consulting,Serene Cycle,10,"Client Communication, Advisor Communication, Team Meeting, Accounting Clinic Meeting, Marketing Meeting, Legal Meeting with Foley and Lardner, Digital Content Review, and Final Project Coordination.",
11/13/2025 19:48:55,Declan.Leahy@su.suffolk.edu,Declan Leahy,Accounting,REWRITE,2,"Weekly synch with team and worked on financial statement, weekly client check in and communicated areas I had questions about.",
11/13/2025 18:25:42,Keya.Patel@su.suffolk.edu,Keya Patel,Funding,Intriguing Hair,4,"This week, we had a meeting with the client and the legal team to discuss her trademark issues. Our client, Nikia, has had someone steal her brand name in China and is concerned about the potential legal implications of this.",
11/13/2025 17:12:28,Abednego.Nakoma@su.suffolk.edu,Abednego Nakoma,Funding,Crown Legends,6,"On Monday, I met with the Clinic Director to discuss ongoing initiatives. On Wednesday, our team met with the Team Leader to review progress and ensure alignment. By Friday, I had drafted alternative funding methods.",
11/7/2025 21:35:44,Adam.Calnan@su.suffolk.edu,Adam Calnan,Consulting,Sawyer Parks,3.5,"Toured multiple fi-di fast office suites at 265 Franklin and 160 Federal St to develop potential floor plan, scope line items.",
11/7/2025 19:22:18,Declan.Leahy@su.suffolk.edu,Declan Leahy,Accounting,REWRITE,3,"Analysis of company financial excel spreadsheet. Team planning for targeted KPIs that correlate with the financials.",
11/7/2025 18:08:55,Abednego.Nakoma@su.suffolk.edu,Abednego Nakoma,Funding,Crown Legends,4,"Met with the clinic director on Monday, followed by a meeting with the client. On Friday, our team convened to review the plan and discuss the way forward.",
11/6/2025 22:45:32,Keya.Patel@su.suffolk.edu,Keya Patel,Funding,Intriguing Hair,5,"We had our team meeting with the directors this week on Monday; basically a rundown of our current progress and what we are aiming to get done in the coming few weeks for our deliverables.",
11/6/2025 21:32:15,Franziska.Greiner@su.suffolk.edu,Franziska Greiner,Consulting,Crown Legends,6,"At the end of last week, I had 1-1 meetings with each clinic. We went over the tasks for the next few weeks to make sure every deliverable on the SOW gets finished.",
11/6/2025 20:18:58,Ishani.Rana@su.suffolk.edu,Ishani Rana,Funding,Intriguing Hair,1,"Waiting on some materials from Nikia, and our team lead has a meeting with her this week. Our team will meet on Friday to discuss our plan for the next few weeks.",
11/6/2025 19:05:42,Ashley.MarquezGonzalez@su.suffolk.edu,Ashley Gonzalez,Funding,Serene Cycle,5,"Updated from my client have been more for the other clinics than mine. For the week I have created an excel sheet and continued putting new events, grants, mentorships, and other resources to look out for.",
11/7/2025 16:52:25,Aline.Silva@su.suffolk.edu,Aline Silva,Accounting,Marabou Cafe,3,"Downloaded many reports from Clover. Looked into their financials both excel templates and Clover values. As well as looked into QBO and Clover integration and its features.",
10/30/2025 23:38:12,Franziska.Greiner@su.suffolk.edu,Franziska Greiner,Consulting,Crown Legends,6,"The midterm presentation went well, and we got good feedback. This week, the team had a meeting with our client to go over the SOW and to make sure there are no questions before signing it.",
10/31/2025 22:25:55,Abednego.Nakoma@su.suffolk.edu,Abednego Nakoma,Funding,Crown Legends,4,"On Monday, our team delivered a class presentation, showcasing our current progress and strategic approach. On Tuesday, we met with the Crown Legends partner.",
10/31/2025 21:12:38,Declan.Leahy@su.suffolk.edu,Declan Leahy,Accounting,REWRITE,2,"Mid term presentation prep. Financial modeling excel sheet reviewed for errors. This will be done multiple times to get a good understanding of the data.",
10/30/2025 19:58:22,Ashley.MarquezGonzalez@su.suffolk.edu,Ashley Gonzalez,Funding,Serene Cycle,8,"Researched partnerships and mentoring programs available. There was a lot of dead ends in grants due to specific requirements. There is a lot of opportunity in networking events for my client.",
10/30/2025 18:45:05,Keya.Patel@su.suffolk.edu,Keya Patel,Funding,Intriguing Hair,6,"This week was spent refining the presentation and delivering it on Monday. My team and I have also contacted the legal team to ask for their help regarding one of the deliverables.",
10/30/2025 17:32:48,Aline.Silva@su.suffolk.edu,Aline Silva,Accounting,Marabou Cafe,5,"Worked on presentation, preparing slides, practicing for presentation both as a team and myself. Participated in our internal team meeting this week.",
10/22/2025 21:18:35,Adam.Calnan@su.suffolk.edu,Adam Calnan,Consulting,Sawyer Parks,20,"Successful onsite with Hana. Outlined project strategy. 2x draft SOW. Finalized secondary deep research. SOW out for sig. Survey development in progress.",
10/24/2025 20:05:18,Franziska.Greiner@su.suffolk.edu,Franziska Greiner,Consulting,Crown Legends,5,"Our team has received all the feedback for our SOW and we made a few small changes. We had some difficulties finding a time to schedule a meeting with our client.",
10/24/2025 18:52:02,Abednego.Nakoma@su.suffolk.edu,Abednego Nakoma,Funding,Crown Legends,5,"On Monday, I attended the Robert Wolf podcast, which offered valuable insights into leadership and financial strategy. On Wednesday, our team met with the team leader.",
10/23/2025 17:38:45,Ashley.MarquezGonzalez@su.suffolk.edu,Ashley Gonzalez,Funding,Serene Cycle,6,"The main focus this week was the midterm presentation. Gathering market research to present to the class. We also had a client meeting that was mainly focused on accounting.",
10/23/2025 16:25:28,Declan.Leahy@su.suffolk.edu,Declan Leahy,Accounting,REWRITE,3,"Midterm practice, presenting for Robert Wolf, client weekly meeting. Within this meeting with the client we discussed wrap up and finalization of the rollover.",
10/26/2025 15:12:12,Keya.Patel@su.suffolk.edu,Keya Patel,Funding,Intriguing Hair,4,"It feels great to finally narrow down the focus of our project. This week, I reviewed notes from the client meeting and consolidated all the research and ideas into final deliverables.",
10/26/2025 13:58:55,Ishani.Rana@su.suffolk.edu,Ishani Rana,Funding,Intriguing Hair,3,"My team was supposed to have a meeting with Intriguing Hair, but unfortunately, it got canceled. I also worked on my midterm presentation this week.",
10/24/2025 12:45:38,Aline.Silva@su.suffolk.edu,Aline Silva,Accounting,Marabou Cafe,6,"I have done deeper research into the Clover POS System. I have also researched possible integration apps to transfer into a Quickbooks account.",
10/19/2025 20:32:22,Declan.Leahy@su.suffolk.edu,Declan Leahy,Accounting,REWRITE,4,"Met with the client and went over QuickBooks, their payment and receiving software, and looked over their financials.",
10/18/2025 19:18:05,Ishani.Rana@su.suffolk.edu,Ishani Rana,Funding,Intriguing Hair,3,"This week, I did research on grants, specifically for veteran owned businesses. Our team met with client on Wednesday to discuss the project scope.",
10/17/2025 18:05:48,Ashley.MarquezGonzalez@su.suffolk.edu,Ashley Gonzalez,Funding,Serene Cycle,5,"Continued research into possible grants. The search has narrowed into accelerator programs and pitch competitions. My client is in a very niche industry.",
10/17/2025 16:52:32,Abednego.Nakoma@su.suffolk.edu,Abednego Nakoma,Funding,Crown Legends,4,"On Monday, I participated in a productive meeting with the Clinic Director. On Wednesday, I met with the consulting team leader. On Friday, I organized a funding clinic meeting.",
10/17/2025 15:38:15,Aline.Silva@su.suffolk.edu,Aline Silva,Accounting,Marabou Cafe,5,"Participated in client meeting along with the team lead and client. We were able to discuss how they have been accounting for their business and what areas we can work on to improve.",
10/16/2025 21:25:58,Franziska.Greiner@su.suffolk.edu,Franziska Greiner,Consulting,Crown Legends,7,"This week we had our first client meeting. We also had a cross clinic meeting with the accounting and funding team. As team lead, I set up our team's first internal meeting.",
10/16/2025 20:12:42,Adam.Calnan@su.suffolk.edu,Adam Calnan,Consulting,Sawyer Parks,6,"Client deep discovery: interviewed clients business partners, toured existing business locations, reviewed competitors.",
10/16/2025 18:58:25,Keya.Patel@su.suffolk.edu,Keya Patel,Funding,Intriguing Hair,5,"This week, we were finally able to meet with our client. We had a good discussion about her business and what she is looking for from us.",
10/11/2025 17:45:08,Declan.Leahy@su.suffolk.edu,Declan Leahy,Accounting,REWRITE,3,"Continued working on understanding the client's financial situation. Met with team to discuss next steps.",
10/11/2025 16:32:52,Abednego.Nakoma@su.suffolk.edu,Abednego Nakoma,Funding,Crown Legends,3,"Attended clinic meeting on Monday. On Wednesday, met with the team to discuss initial research findings.",
10/10/2025 15:18:35,Ashley.MarquezGonzalez@su.suffolk.edu,Ashley Gonzalez,Funding,Serene Cycle,4,"Started research on potential funding sources for client. Created spreadsheet to track findings.",
10/10/2025 14:05:18,Franziska.Greiner@su.suffolk.edu,Franziska Greiner,Consulting,Crown Legends,5,"Prepared for first client meeting. Researched the hat industry and Crown Legends' competitors.",
10/10/2025 12:52:02,Ishani.Rana@su.suffolk.edu,Ishani Rana,Funding,Intriguing Hair,2,"Started initial research on the wig and hair industry. Team meeting to discuss approach.",
10/9/2025 20:38:45,Adam.Calnan@su.suffolk.edu,Adam Calnan,Consulting,Sawyer Parks,5,"Initial client research. Reviewed restaurant industry trends and Boston market analysis.",
10/9/2025 19:25:28,Aline.Silva@su.suffolk.edu,Aline Silva,Accounting,Marabou Cafe,3,"Started reviewing client's current accounting practices. Researched cafe industry accounting standards.",
10/9/2025 18:12:12,Keya.Patel@su.suffolk.edu,Keya Patel,Funding,Intriguing Hair,4,"Began research on funding opportunities for beauty industry businesses. Team strategy meeting.",
10/4/2025 17:58:55,Declan.Leahy@su.suffolk.edu,Declan Leahy,Accounting,REWRITE,2,"Initial client introduction meeting. Started reviewing financial documents provided.",
10/4/2025 16:45:38,Abednego.Nakoma@su.suffolk.edu,Abednego Nakoma,Funding,Crown Legends,2,"Attended orientation meeting. Met with clinic director to discuss project scope.",
10/3/2025 15:32:22,Ashley.MarquezGonzalez@su.suffolk.edu,Ashley Gonzalez,Funding,Serene Cycle,3,"Orientation and initial team meeting. Discussed project goals with clinic director.",
10/3/2025 14:18:05,Franziska.Greiner@su.suffolk.edu,Franziska Greiner,Consulting,Crown Legends,3,"Team orientation meeting. Initial discussion about Crown Legends project.",
10/3/2025 13:05:48,Ishani.Rana@su.suffolk.edu,Ishani Rana,Funding,Intriguing Hair,2,"Attended orientation. Met with funding clinic team to discuss upcoming projects.",
10/2/2025 20:52:32,Adam.Calnan@su.suffolk.edu,Adam Calnan,Consulting,Sawyer Parks,4,"Project kickoff meeting. Initial discussions with team about Sawyer Parks project.",
10/2/2025 19:38:15,Aline.Silva@su.suffolk.edu,Aline Silva,Accounting,Marabou Cafe,2,"Orientation meeting. Discussed accounting clinic processes and upcoming client work.",
10/2/2025 18:25:58,Keya.Patel@su.suffolk.edu,Keya Patel,Funding,Intriguing Hair,3,"Attended initial funding clinic meeting. Discussed project approach for Intriguing Hair.",
11/27/2025 21:15:33,Mason.Holt@su.suffolk.edu,Mason Holt,Funding,Crown Legends,5,"Worked on funding package documentation. Met with team to review progress.",
11/27/2025 20:02:16,Muskan.Kapoor@su.suffolk.edu,Muskan Kapoor,Funding,City of Malden,4,"Continued work on business resource guide. Team meeting to discuss deliverables.",
11/27/2025 18:48:59,Maggie.Murphy@su.suffolk.edu,Maggie Murphy,Marketing,The Downtown Paw,3,"Worked on marketing materials. Met with Krysthal to discuss presentation.",
11/27/2025 17:35:42,Krysthal.Pollard@su.suffolk.edu,Krysthal Pollard,Marketing,The Downtown Paw,3,"Marketing strategy development. Team coordination for final deliverables.",
11/27/2025 16:22:25,Arianna.Godinho@su.suffolk.edu,Arianna Godinho,Marketing,Marabou Cafe,4,"Worked on marketing presentation slides. Client communication for feedback.",
11/27/2025 15:08:08,Ethan.Shanofsky@su.suffolk.edu,Ethan Shanofsky,Consulting,Sawyer Parks,5,"Team meeting and client coordination. Worked on consulting deliverables.",
11/27/2025 13:55:51,Collin.Merwin@su.suffolk.edu,Collin Merwin,Funding,Future Masters of Chess Academy,3,"Continued grant research. Updated documentation with new findings.",
11/27/2025 12:42:34,Courage.Chakanza@su.suffolk.edu,Courage Chakanza,Accounting,Muffy White,3,"Worked on financial statements. Client meeting to review progress.",
11/27/2025 11:28:17,Elaine.Lara@su.suffolk.edu,Elaine Lara,Marketing,Marabou Cafe,4,"Marketing content development. Team coordination meeting.",
11/27/2025 10:15:00,Kajol.Parche@su.suffolk.edu,Kajol Parche,Marketing,Serene Cycle,3,"Worked on marketing strategy. Client feedback integration.",
11/20/2025 22:05:43,Mason.Holt@su.suffolk.edu,Mason Holt,Funding,Crown Legends,4,"Funding research and documentation. Team meeting with clinic director.",
11/20/2025 20:52:26,Muskan.Kapoor@su.suffolk.edu,Muskan Kapoor,Funding,City of Malden,4,"Business resource compilation. Met with Lauren to coordinate work.",
11/20/2025 19:38:09,Maggie.Murphy@su.suffolk.edu,Maggie Murphy,Marketing,The Downtown Paw,3,"Marketing materials development. Team meeting for strategy alignment.",
11/20/2025 18:25:52,Arianna.Godinho@su.suffolk.edu,Arianna Godinho,Marketing,Marabou Cafe,3,"Worked on social media strategy. Client meeting for feedback.",
11/20/2025 17:12:35,Ethan.Shanofsky@su.suffolk.edu,Ethan Shanofsky,Consulting,Sawyer Parks,4,"Consulting work on floor plans. Team coordination meeting.",
11/20/2025 15:58:18,Collin.Merwin@su.suffolk.edu,Collin Merwin,Funding,Future Masters of Chess Academy,3,"Grant application research. Updated tracking spreadsheet.",
11/20/2025 14:45:01,Courage.Chakanza@su.suffolk.edu,Courage Chakanza,Accounting,Muffy White,2,"Financial document review. Client communication for clarification.",
11/20/2025 13:32:44,Elaine.Lara@su.suffolk.edu,Elaine Lara,Marketing,Marabou Cafe,3,"Marketing presentation development. Team meeting.",
11/20/2025 12:18:27,Kajol.Parche@su.suffolk.edu,Kajol Parche,Marketing,Serene Cycle,3,"Marketing deliverables work. Client meeting for feedback.",
11/13/2025 23:08:10,Mason.Holt@su.suffolk.edu,Mason Holt,Funding,Crown Legends,5,"Funding package development. Met with Abednego to coordinate.",
11/13/2025 21:55:53,Muskan.Kapoor@su.suffolk.edu,Muskan Kapoor,Funding,City of Malden,3,"Business guide research. Team meeting with Lauren.",
11/13/2025 20:42:36,Maggie.Murphy@su.suffolk.edu,Maggie Murphy,Marketing,The Downtown Paw,3,"Marketing strategy work. Met with Krysthal for coordination.",
11/13/2025 19:28:19,Arianna.Godinho@su.suffolk.edu,Arianna Godinho,Marketing,Marabou Cafe,4,"Social media content creation. Client meeting.",
11/13/2025 18:15:02,Ethan.Shanofsky@su.suffolk.edu,Ethan Shanofsky,Consulting,Sawyer Parks,5,"Floor plan development. Team meeting with Adam.",
11/13/2025 17:02:45,Collin.Merwin@su.suffolk.edu,Collin Merwin,Funding,Future Masters of Chess Academy,4,"Grant research and documentation. Met with clinic director.",
11/13/2025 15:48:28,Courage.Chakanza@su.suffolk.edu,Courage Chakanza,Accounting,Muffy White,3,"Financial statements work. Team coordination.",
11/13/2025 14:35:11,Elaine.Lara@su.suffolk.edu,Elaine Lara,Marketing,Marabou Cafe,3,"Marketing materials. Client feedback integration.",
11/13/2025 13:22:54,Kajol.Parche@su.suffolk.edu,Kajol Parche,Marketing,Serene Cycle,4,"Marketing strategy development. Team meeting.",
11/6/2025 22:15:37,Mason.Holt@su.suffolk.edu,Mason Holt,Funding,Crown Legends,4,"Funding research continuation. Met with team.",
11/6/2025 21:02:20,Muskan.Kapoor@su.suffolk.edu,Muskan Kapoor,Funding,City of Malden,3,"Resource guide development. Team coordination.",
11/6/2025 19:48:03,Maggie.Murphy@su.suffolk.edu,Maggie Murphy,Marketing,The Downtown Paw,3,"Marketing work. Team meeting with Purva.",
11/6/2025 18:35:46,Arianna.Godinho@su.suffolk.edu,Arianna Godinho,Marketing,Marabou Cafe,3,"Content development. Client communication.",
11/6/2025 17:22:29,Ethan.Shanofsky@su.suffolk.edu,Ethan Shanofsky,Consulting,Sawyer Parks,4,"Consulting deliverables. Team meeting.",
11/6/2025 16:08:12,Collin.Merwin@su.suffolk.edu,Collin Merwin,Funding,Future Masters of Chess Academy,3,"Grant research. Documentation update.",
11/6/2025 14:55:55,Courage.Chakanza@su.suffolk.edu,Courage Chakanza,Accounting,Muffy White,2,"Financial review. Client meeting.",
11/6/2025 13:42:38,Elaine.Lara@su.suffolk.edu,Elaine Lara,Marketing,Marabou Cafe,3,"Marketing strategy. Team coordination.",
11/6/2025 12:28:21,Kajol.Parche@su.suffolk.edu,Kajol Parche,Marketing,Serene Cycle,3,"Marketing work. Client feedback.",
10/30/2025 22:18:04,Mason.Holt@su.suffolk.edu,Mason Holt,Funding,Crown Legends,5,"Midterm presentation prep. Funding research.",
10/30/2025 21:05:47,Muskan.Kapoor@su.suffolk.edu,Muskan Kapoor,Funding,City of Malden,4,"Presentation work. Resource guide progress.",
10/30/2025 19:52:30,Maggie.Murphy@su.suffolk.edu,Maggie Murphy,Marketing,The Downtown Paw,3,"Marketing presentation. Team meeting.",
10/30/2025 18:38:13,Arianna.Godinho@su.suffolk.edu,Arianna Godinho,Marketing,Marabou Cafe,4,"Midterm slides. Marketing strategy.",
10/30/2025 17:25:56,Ethan.Shanofsky@su.suffolk.edu,Ethan Shanofsky,Consulting,Sawyer Parks,5,"Presentation prep. Consulting work.",
10/30/2025 16:12:39,Collin.Merwin@su.suffolk.edu,Collin Merwin,Funding,Future Masters of Chess Academy,3,"Grant documentation. Midterm prep.",
10/30/2025 14:58:22,Courage.Chakanza@su.suffolk.edu,Courage Chakanza,Accounting,Muffy White,3,"Financial statements. Presentation prep.",
10/30/2025 13:45:05,Elaine.Lara@su.suffolk.edu,Elaine Lara,Marketing,Marabou Cafe,3,"Marketing presentation. Team coordination.",
10/30/2025 12:32:48,Kajol.Parche@su.suffolk.edu,Kajol Parche,Marketing,Serene Cycle,4,"Marketing midterm. Strategy work.",
10/23/2025 22:22:31,Mason.Holt@su.suffolk.edu,Mason Holt,Funding,Crown Legends,4,"Funding research. Team coordination.",
10/23/2025 21:08:14,Muskan.Kapoor@su.suffolk.edu,Muskan Kapoor,Funding,City of Malden,3,"Resource compilation. Team meeting.",
10/23/2025 19:55:57,Maggie.Murphy@su.suffolk.edu,Maggie Murphy,Marketing,The Downtown Paw,3,"Marketing work. Client meeting.",
10/23/2025 18:42:40,Arianna.Godinho@su.suffolk.edu,Arianna Godinho,Marketing,Marabou Cafe,3,"Social media planning. Team coordination.",
10/23/2025 17:28:23,Ethan.Shanofsky@su.suffolk.edu,Ethan Shanofsky,Consulting,Sawyer Parks,4,"Consulting work. Floor plan research.",
10/23/2025 16:15:06,Collin.Merwin@su.suffolk.edu,Collin Merwin,Funding,Future Masters of Chess Academy,3,"Grant research. Team meeting.",
10/23/2025 15:02:49,Courage.Chakanza@su.suffolk.edu,Courage Chakanza,Accounting,Muffy White,2,"Financial review. Documentation.",
10/23/2025 13:48:32,Elaine.Lara@su.suffolk.edu,Elaine Lara,Marketing,Marabou Cafe,3,"Marketing planning. Client feedback.",
10/23/2025 12:35:15,Kajol.Parche@su.suffolk.edu,Kajol Parche,Marketing,Serene Cycle,3,"Marketing research. Strategy development.",
10/16/2025 22:25:58,Mason.Holt@su.suffolk.edu,Mason Holt,Funding,Crown Legends,4,"Initial funding research. Team meeting.",
10/16/2025 21:12:41,Muskan.Kapoor@su.suffolk.edu,Muskan Kapoor,Funding,City of Malden,3,"Resource research. Client meeting.",
10/16/2025 19:58:24,Maggie.Murphy@su.suffolk.edu,Maggie Murphy,Marketing,The Downtown Paw,3,"Marketing strategy. Team coordination.",
10/16/2025 18:45:07,Arianna.Godinho@su.suffolk.edu,Arianna Godinho,Marketing,Marabou Cafe,3,"Marketing planning. Client communication.",
10/16/2025 17:32:50,Ethan.Shanofsky@su.suffolk.edu,Ethan Shanofsky,Consulting,Sawyer Parks,4,"Consulting research. Team meeting.",
10/16/2025 16:18:33,Collin.Merwin@su.suffolk.edu,Collin Merwin,Funding,Future Masters of Chess Academy,3,"Grant research initiation. Clinic meeting.",
10/16/2025 15:05:16,Courage.Chakanza@su.suffolk.edu,Courage Chakanza,Accounting,Muffy White,2,"Client introduction. Initial review.",
10/16/2025 13:52:59,Elaine.Lara@su.suffolk.edu,Elaine Lara,Marketing,Marabou Cafe,3,"Marketing orientation. Team meeting.",
10/16/2025 12:38:42,Kajol.Parche@su.suffolk.edu,Kajol Parche,Marketing,Serene Cycle,3,"Marketing research. Strategy discussion.",
10/9/2025 22:28:25,Mason.Holt@su.suffolk.edu,Mason Holt,Funding,Crown Legends,3,"Project orientation. Initial research.",
10/9/2025 21:15:08,Muskan.Kapoor@su.suffolk.edu,Muskan Kapoor,Funding,City of Malden,2,"Team orientation. Project discussion.",
10/9/2025 20:02:51,Maggie.Murphy@su.suffolk.edu,Maggie Murphy,Marketing,The Downtown Paw,2,"Marketing orientation. Team meeting.",
10/9/2025 18:48:34,Arianna.Godinho@su.suffolk.edu,Arianna Godinho,Marketing,Marabou Cafe,2,"Project introduction. Team coordination.",
10/9/2025 17:35:17,Ethan.Shanofsky@su.suffolk.edu,Ethan Shanofsky,Consulting,Sawyer Parks,3,"Consulting orientation. Initial meeting.",
10/9/2025 16:22:00,Collin.Merwin@su.suffolk.edu,Collin Merwin,Funding,Future Masters of Chess Academy,2,"Project orientation. Clinic meeting.",
10/9/2025 15:08:43,Courage.Chakanza@su.suffolk.edu,Courage Chakanza,Accounting,Muffy White,2,"Accounting orientation. Team meeting.",
10/9/2025 13:55:26,Elaine.Lara@su.suffolk.edu,Elaine Lara,Marketing,Marabou Cafe,2,"Marketing introduction. Team coordination.",
10/9/2025 12:42:09,Kajol.Parche@su.suffolk.edu,Kajol Parche,Marketing,Serene Cycle,2,"Project orientation. Initial discussion.",
11/27/2025 22:32:16,Kaustubh.Ambre@su.suffolk.edu,Kaustubh Ambre,Accounting,SEED,3,"Financial statements review. Team meeting.",
11/27/2025 21:18:59,Klestiola.Xherimeja@su.suffolk.edu,Klestiola Xherimeja,Marketing,The Downtown Paw,3,"Marketing materials. Client communication.",
11/27/2025 20:05:42,Margaret.Distefano@su.suffolk.edu,Margaret Distefano,Accounting,Muffy White,3,"Accounting deliverables. Team coordination.",
11/27/2025 18:52:25,Marian.OBrien@su.suffolk.edu,Marian O'Brien,Consulting,Sawyer Parks,4,"Consulting work. Team meeting.",
11/27/2025 17:38:08,Masudi.Mugudwa@su.suffolk.edu,Masudi Mugudwa,Funding,Crown Legends,3,"Funding research. Documentation.",
11/27/2025 16:25:51,Maura.Sullivan@su.suffolk.edu,Maura Sullivan,Marketing,Serene Cycle,3,"Marketing strategy. Client meeting.",
11/27/2025 15:12:34,Max.Banoun@su.suffolk.edu,Max Banoun,Consulting,Sawyer Parks,4,"Consulting deliverables. Team coordination.",
11/27/2025 13:58:17,Merelyn.Choorakoottil@su.suffolk.edu,Merelyn Choorakoottil,Accounting,REWRITE,3,"Accounting work. Client meeting.",
11/27/2025 12:45:00,Natalie.Perkins@su.suffolk.edu,Natalie Perkins,Marketing,The Downtown Paw,3,"Marketing materials. Team meeting.",
11/27/2025 11:32:43,Neel.Patel@su.suffolk.edu,Neel Patel,Funding,Intriguing Hair,4,"Funding research. Documentation update.",
11/27/2025 10:18:26,Nicole.Nessim@su.suffolk.edu,Nicole Nessim,Consulting,Crown Legends,4,"Consulting deliverables. Team coordination.",
11/27/2025 9:05:09,Nyasha.Mukwata@su.suffolk.edu,Nyasha Mukwata,Funding,City of Malden,3,"Resource guide work. Team meeting.",
11/27/2025 7:52:52,Purva.Dhuri@su.suffolk.edu,Purva Dhuri,Marketing,The Downtown Paw,4,"Marketing strategy. Team coordination.",
11/27/2025 6:38:35,Rayah.Sibunga@su.suffolk.edu,Rayah Sibunga,Accounting,SEED,3,"Accounting deliverables. Client meeting.",
11/27/2025 5:25:18,Riley.Dibiase@su.suffolk.edu,Riley Dibiase,Marketing,Marabou Cafe,3,"Marketing work. Team meeting.",
11/27/2025 4:12:01,Sakshi.Shah@su.suffolk.edu,Sakshi Shah,Consulting,Sawyer Parks,4,"Consulting deliverables. Team coordination.",
11/27/2025 3:58:44,Sara.Marmoucha@su.suffolk.edu,Sara Marmoucha,Funding,Intriguing Hair,3,"Funding research. Documentation.",
11/27/2025 2:45:27,Shubhangi.Srivastava@su.suffolk.edu,Shubhangi Srivastava,Marketing,Serene Cycle,3,"Marketing strategy. Client meeting.",
11/27/2025 1:32:10,Sophia.Emile@su.suffolk.edu,Sophia Emile,Consulting,Crown Legends,4,"Consulting work. Team meeting.",
11/27/2025 0:18:53,Stuart.Atkinson@su.suffolk.edu,Stuart Atkinson,Accounting,Muffy White,4,"Accounting statements. Team coordination.",
11/26/2025 23:05:36,Stuti.Adhikari@su.suffolk.edu,Stuti Adhikari,Marketing,Marabou Cafe,3,"Marketing deliverables. Client communication.",
11/26/2025 21:52:19,Urmi.Vaghela@su.suffolk.edu,Urmi Vaghela,Funding,Future Masters of Chess Academy,3,"Grant research. Documentation update.",
11/26/2025 20:38:02,Zachary.Ullrich@su.suffolk.edu,Zachary Ullrich,Consulting,Sawyer Parks,4,"Consulting deliverables. Team meeting.",
11/20/2025 22:35:45,Kaustubh.Ambre@su.suffolk.edu,Kaustubh Ambre,Accounting,SEED,3,"Financial review. Team coordination.",
11/20/2025 21:22:28,Klestiola.Xherimeja@su.suffolk.edu,Klestiola Xherimeja,Marketing,The Downtown Paw,3,"Marketing work. Client meeting.",
11/20/2025 20:08:11,Margaret.Distefano@su.suffolk.edu,Margaret Distefano,Accounting,Muffy White,3,"Accounting statements. Team meeting.",
11/20/2025 18:55:54,Marian.OBrien@su.suffolk.edu,Marian O'Brien,Consulting,Sawyer Parks,4,"Consulting work. Client coordination.",
11/20/2025 17:42:37,Masudi.Mugudwa@su.suffolk.edu,Masudi Mugudwa,Funding,Crown Legends,3,"Funding research. Team meeting.",
11/20/2025 16:28:20,Maura.Sullivan@su.suffolk.edu,Maura Sullivan,Marketing,Serene Cycle,3,"Marketing strategy. Client communication.",
11/20/2025 15:15:03,Max.Banoun@su.suffolk.edu,Max Banoun,Consulting,Sawyer Parks,4,"Consulting work. Team meeting.",
11/20/2025 14:02:46,Merelyn.Choorakoottil@su.suffolk.edu,Merelyn Choorakoottil,Accounting,REWRITE,3,"Accounting review. Client meeting.",
11/20/2025 12:48:29,Natalie.Perkins@su.suffolk.edu,Natalie Perkins,Marketing,The Downtown Paw,3,"Marketing work. Team coordination.",
11/20/2025 11:35:12,Neel.Patel@su.suffolk.edu,Neel Patel,Funding,Intriguing Hair,4,"Funding research. Documentation.",
11/20/2025 10:22:55,Nicole.Nessim@su.suffolk.edu,Nicole Nessim,Consulting,Crown Legends,4,"Consulting deliverables. Team meeting.",
11/20/2025 9:08:38,Nyasha.Mukwata@su.suffolk.edu,Nyasha Mukwata,Funding,City of Malden,3,"Resource research. Team coordination.",
11/20/2025 7:55:21,Purva.Dhuri@su.suffolk.edu,Purva Dhuri,Marketing,The Downtown Paw,4,"Marketing strategy. Team meeting.",
11/20/2025 6:42:04,Rayah.Sibunga@su.suffolk.edu,Rayah Sibunga,Accounting,SEED,3,"Accounting work. Client meeting.",
11/20/2025 5:28:47,Riley.Dibiase@su.suffolk.edu,Riley Dibiase,Marketing,Marabou Cafe,3,"Marketing materials. Team coordination.",
11/20/2025 4:15:30,Sakshi.Shah@su.suffolk.edu,Sakshi Shah,Consulting,Sawyer Parks,4,"Consulting work. Team meeting.",
11/20/2025 3:02:13,Sara.Marmoucha@su.suffolk.edu,Sara Marmoucha,Funding,Intriguing Hair,3,"Funding documentation. Team coordination.",
11/20/2025 1:48:56,Shubhangi.Srivastava@su.suffolk.edu,Shubhangi Srivastava,Marketing,Serene Cycle,3,"Marketing work. Client meeting.",
11/20/2025 0:35:39,Sophia.Emile@su.suffolk.edu,Sophia Emile,Consulting,Crown Legends,4,"Consulting strategy. Team meeting.",
11/19/2025 23:22:22,Stuart.Atkinson@su.suffolk.edu,Stuart Atkinson,Accounting,Muffy White,4,"Accounting review. Team coordination.",
11/19/2025 22:08:05,Stuti.Adhikari@su.suffolk.edu,Stuti Adhikari,Marketing,Marabou Cafe,3,"Marketing work. Client communication.",
11/19/2025 20:55:48,Urmi.Vaghela@su.suffolk.edu,Urmi Vaghela,Funding,Future Masters of Chess Academy,3,"Grant research. Team meeting.",
11/19/2025 19:42:31,Zachary.Ullrich@su.suffolk.edu,Zachary Ullrich,Consulting,Sawyer Parks,4,"Consulting work. Team coordination.",
11/13/2025 22:42:14,Kaustubh.Ambre@su.suffolk.edu,Kaustubh Ambre,Accounting,SEED,3,"Financial review. Client meeting.",
11/13/2025 21:28:57,Klestiola.Xherimeja@su.suffolk.edu,Klestiola Xherimeja,Marketing,The Downtown Paw,3,"Marketing work. Team meeting.",
11/13/2025 20:15:40,Margaret.Distefano@su.suffolk.edu,Margaret Distefano,Accounting,Muffy White,3,"Accounting deliverables. Team coordination.",
11/13/2025 19:02:23,Marian.OBrien@su.suffolk.edu,Marian O'Brien,Consulting,Sawyer Parks,4,"Consulting work. Client meeting.",
11/13/2025 17:48:06,Masudi.Mugudwa@su.suffolk.edu,Masudi Mugudwa,Funding,Crown Legends,3,"Funding research. Team coordination.",
11/13/2025 16:35:49,Maura.Sullivan@su.suffolk.edu,Maura Sullivan,Marketing,Serene Cycle,3,"Marketing strategy. Team meeting.",
11/13/2025 15:22:32,Max.Banoun@su.suffolk.edu,Max Banoun,Consulting,Sawyer Parks,4,"Consulting deliverables. Team meeting.",
11/13/2025 14:08:15,Merelyn.Choorakoottil@su.suffolk.edu,Merelyn Choorakoottil,Accounting,REWRITE,3,"Accounting work. Client coordination.",
11/13/2025 12:55:58,Natalie.Perkins@su.suffolk.edu,Natalie Perkins,Marketing,The Downtown Paw,3,"Marketing materials. Team meeting.",
11/13/2025 11:42:41,Neel.Patel@su.suffolk.edu,Neel Patel,Funding,Intriguing Hair,4,"Funding research. Documentation.",
11/13/2025 10:28:24,Nicole.Nessim@su.suffolk.edu,Nicole Nessim,Consulting,Crown Legends,4,"Consulting work. Team coordination.",
11/13/2025 9:15:07,Nyasha.Mukwata@su.suffolk.edu,Nyasha Mukwata,Funding,City of Malden,3,"Resource guide. Team meeting.",
11/13/2025 8:02:50,Purva.Dhuri@su.suffolk.edu,Purva Dhuri,Marketing,The Downtown Paw,4,"Marketing strategy. Client meeting.",
11/13/2025 6:48:33,Rayah.Sibunga@su.suffolk.edu,Rayah Sibunga,Accounting,SEED,3,"Accounting deliverables. Team coordination.",
11/13/2025 5:35:16,Riley.Dibiase@su.suffolk.edu,Riley Dibiase,Marketing,Marabou Cafe,3,"Marketing work. Team meeting.",
11/13/2025 4:22:59,Sakshi.Shah@su.suffolk.edu,Sakshi Shah,Consulting,Sawyer Parks,4,"Consulting strategy. Team coordination.",
11/13/2025 3:08:42,Sara.Marmoucha@su.suffolk.edu,Sara Marmoucha,Funding,Intriguing Hair,3,"Funding research. Documentation update.",
11/13/2025 1:55:25,Shubhangi.Srivastava@su.suffolk.edu,Shubhangi Srivastava,Marketing,Serene Cycle,3,"Marketing work. Client meeting.",
11/13/2025 0:42:08,Sophia.Emile@su.suffolk.edu,Sophia Emile,Consulting,Crown Legends,4,"Consulting work. Team meeting.",
11/12/2025 23:28:51,Stuart.Atkinson@su.suffolk.edu,Stuart Atkinson,Accounting,Muffy White,4,"Accounting statements. Team meeting.",
11/12/2025 22:15:34,Stuti.Adhikari@su.suffolk.edu,Stuti Adhikari,Marketing,Marabou Cafe,3,"Marketing deliverables. Team coordination.",
11/12/2025 21:02:17,Urmi.Vaghela@su.suffolk.edu,Urmi Vaghela,Funding,Future Masters of Chess Academy,3,"Grant research. Client meeting.",
11/12/2025 19:48:00,Zachary.Ullrich@su.suffolk.edu,Zachary Ullrich,Consulting,Sawyer Parks,4,"Consulting work. Team meeting."
"""

def parse_date(date_str):
    """Parse date from CSV format to YYYY-MM-DD"""
    try:
        # Format: 12/5/2025 10:26:41
        dt = datetime.strptime(date_str.split()[0], "%m/%d/%Y")
        return dt.strftime("%Y-%m-%d")
    except:
        return None

def get_week_ending(date_str):
    """Get the week ending date (Sunday) for a given date"""
    try:
        dt = datetime.strptime(date_str.split()[0], "%m/%d/%Y")
        # Find next Sunday
        days_until_sunday = (6 - dt.weekday()) % 7
        if days_until_sunday == 0:
            days_until_sunday = 7
        week_end = dt + timedelta(days=days_until_sunday)
        return week_end.strftime("%Y-%m-%d")
    except:
        return None

def escape_sql(text):
    """Escape single quotes for SQL"""
    if text is None:
        return "NULL"
    return text.replace("'", "''")

def get_clinic_name(clinic):
    """Normalize clinic name"""
    if clinic == "Funding":
        return "Resource Acquisition"
    return clinic

# Parse CSV and generate SQL
lines = CSV_DATA.strip().split('\n')
reader = csv.DictReader(lines)

debriefs = []
skipped = []

for row in reader:
    name = row['Name'].strip()
    
    # Try to find student
    student = STUDENTS.get(name)
    if not student:
        # Try variations
        for key in STUDENTS:
            if name.lower() in key.lower() or key.lower() in name.lower():
                student = STUDENTS[key]
                break
    
    if not student:
        skipped.append(name)
        continue
    
    clinic_name = row['Clinic'].strip()
    client_name = row['Client Name'].strip()
    
    # Get IDs
    clinic_id = CLINICS.get(clinic_name) or CLINICS.get(get_clinic_name(clinic_name))
    client_id = CLIENTS.get(client_name)
    
    if not clinic_id or not client_id:
        skipped.append(f"{name} - missing clinic/client: {clinic_name}/{client_name}")
        continue
    
    hours = float(row['How Many Hours Have You Worked This Week?'])
    work_summary = escape_sql(row['Describe what you worked on this week and how the project is progressing. '])
    questions = row.get('Do you have any questions?', '').strip()
    questions = escape_sql(questions) if questions else "NULL"
    
    date_submitted = parse_date(row['Timestamp'])
    week_ending = get_week_ending(row['Timestamp'])
    
    if not date_submitted or not week_ending:
        skipped.append(f"{name} - invalid date: {row['Timestamp']}")
        continue
    
    debrief = {
        'student_id': student['id'],
        'student_email': student['email'],
        'clinic_id': clinic_id,
        'client_id': client_id,
        'clinic': get_clinic_name(clinic_name),
        'client_name': client_name,
        'hours_worked': hours,
        'work_summary': work_summary,
        'questions': questions,
        'date_submitted': date_submitted,
        'week_ending': week_ending,
        'status': 'submitted',
        'semester_id': SEMESTER_ID
    }
    debriefs.append(debrief)

print(f"Total debriefs to import: {len(debriefs)}")
print(f"Skipped records: {len(skipped)}")
if skipped:
    print("Skipped names:")
    for s in set(skipped):
        print(f"  - {s}")

# Generate SQL in batches
batch_size = 20
for i in range(0, len(debriefs), batch_size):
    batch = debriefs[i:i+batch_size]
    print(f"\n-- Batch {i//batch_size + 1} ({len(batch)} records)")
    
    values = []
    for d in batch:
        questions_val = f"'{d['questions']}'" if d['questions'] != 'NULL' else 'NULL'
        value = f"""('{d['student_id']}', '{d['student_email']}', '{d['clinic_id']}', '{d['client_id']}', '{d['clinic']}', '{d['client_name']}', {d['hours_worked']}, '{d['work_summary']}', {questions_val}, '{d['date_submitted']}', '{d['week_ending']}', '{d['status']}', '{d['semester_id']}')"""
        values.append(value)
    
    sql = f"""INSERT INTO debriefs (student_id, student_email, clinic_id, client_id, clinic, client_name, hours_worked, work_summary, questions, date_submitted, week_ending, status, semester_id)
VALUES 
{','.join(values)};"""
    print(sql)
