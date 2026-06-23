import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const institutions = [
  { id: 6723, name: "Center for Physical Sciences and Technology (FTMC)" },
  { id: 4516, name: "European Humanities University" },
  { id: 4540, name: "ISM University of Management and Economics" },
  { id: 4524, name: "Kaunas University of Technology (KTU)" },
  { id: 4563, name: "Kauno kolegija Higher Education Institution" },
  { id: 4594, name: "Kazimieras Simonavicius University (KSU)" },
  { id: 4536, name: "Klaipėda University (KU)" },
  { id: 4582, name: "Klaipėdos valstybinė kolegija / Higher Education Institution" },
  { id: 4623, name: "Kolpingo kolegija / Kolping Higher Education Institution" },
  { id: 4532, name: "LCC International University" },
  { id: 7859, name: "Lietuvos inžinerijos kolegija / Higher Education Institution" },
  { id: 4602, name: "Lithuania Business College" },
  { id: 4574, name: "Lithuanian Academy of Music and Theatre (LMTA)" },
  { id: 6698, name: "Lithuanian Centre For Social Sciences" },
  { id: 6710, name: "Lithuanian Energy Institute" },
  { id: 4598, name: "Lithuanian Maritime Academy" },
  { id: 4547, name: "Lithuanian Sports University (LSU)" },
  { id: 4508, name: "Lithuanian University of Health Sciences (LSMU)" },
  { id: 4528, name: "Mykolas Romeris University (MRU)" },
  { id: 4634, name: "Panevėžio kolegija / State Higher Education Institution" },
  { id: 4570, name: "Šiaulių valstybinė kolegija / Higher Education Institution" },
  { id: 4590, name: "SMK University of Applied Sciences" },
  { id: 4613, name: "St. Ignatius of Loyola College" },
  { id: 4551, name: "Utenos kolegija / Higher Education Institution" },
  { id: 4559, name: "Vilniaus kolegija / Higher Education Institution" },
  { id: 4555, name: "Vilnius Academy of Arts" },
  { id: 4586, name: "Vilnius Business College / Higher Education Institution" },
  { id: 4610, name: "Vilnius College of Design" },
  { id: 4512, name: "Vilnius Gediminas Technical University (VILNIUS TECH)" },
  { id: 4504, name: "Vilnius University" },
  { id: 4520, name: "Vytautas Magnus University (VMU)" }
];

async function fetchCoursesForInstitution(id) {
  let allCourses = new Set();
  // Assume max 10 pages per institution to avoid infinite loops
  for (let page = 1; page <= 10; page++) {
    const url = `https://studyin.lt/study-programmes/page/${page}/?institution_id=${id}`;
    try {
      const response = await fetch(url);
      if (response.status === 404) break; // Reached past the last page
      const html = await response.text();
      
      const regex = /<h5 class="title">(.*?)<\/h5>/g;
      let match;
      let count = 0;
      while ((match = regex.exec(html)) !== null) {
        const title = match[1].replace(/<[^>]+>/g, '').trim();
        allCourses.add(title);
        count++;
      }
      if (count === 0) break; // No courses on this page
    } catch (e) {
      console.error(`Error fetching page ${page} for ID ${id}`);
      break;
    }
  }
  return Array.from(allCourses);
}

async function main() {
  const fileToModify = path.join(__dirname, 'src', 'firebase', 'scoutGlobalSchools.js');
  let content = fs.readFileSync(fileToModify, 'utf-8');

  for (const inst of institutions) {
    console.log(`Fetching courses for ${inst.name}...`);
    const courses = await fetchCoursesForInstitution(inst.id);
    console.log(`Found ${courses.length} courses for ${inst.name}.`);
    
    // Now replace it in the file content
    // We look for name: "inst.name" and replace the courses array near it
    // Because some names might have regex special chars, escape them
    const escapedName = inst.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const schoolRegex = new RegExp(`(name:\\s*["']${escapedName}["'][\\s\\S]*?courses:\\s*\\[)([^\\]]*)(\\])`, 'm');
    
    // Convert courses to a nice string array
    // Let's cap the courses at 20 so the UI doesn't look absurdly huge
    const coursesToInclude = courses;
    const coursesStr = coursesToInclude.map(c => `"${c}"`).join(', ');
    
    if (schoolRegex.test(content)) {
      content = content.replace(schoolRegex, `$1${coursesStr}$3`);
    } else {
      console.log(`Could not find regex match for ${inst.name}`);
    }
  }

  fs.writeFileSync(fileToModify, content, 'utf-8');
  console.log("Finished updating scoutGlobalSchools.js");
}

main();
