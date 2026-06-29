const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'scoutGlobalSchools.js');
let code = fs.readFileSync(filePath, 'utf8');

const updatedCode = code.replace(/whatsapp:\s*\"[^\"]+\"/g, (match) => {
  return match + `,
    deadlines: { fall: 'June 1st', spring: 'November 1st' },
    admissionReqs: [
      'High School Diploma or Equivalent (For Bachelors)',
      'Bachelors Degree in related field (For Masters)',
      'English Proficiency (IELTS >= 6.0 / TOEFL >= 80)',
      'Passport Copy',
      'Motivation Letter'
    ],
    galleryImages: [
      'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80',
      'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&q=80',
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80'
    ]`;
});

// For SMK, VU, KTU, VMU let's add some more specific real images
// SMK
const smkImages = updatedCode.replace(
  /name:\s*\"SMK University of Applied Sciences\"[\s\S]*?galleryImages:\s*\[[\s\S]*?\]/m,
  (match) => {
    return match.replace(/galleryImages:\s*\[[\s\S]*?\]/m, `galleryImages: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/SMK_Kaunas.JPG/800px-SMK_Kaunas.JPG',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/SMK_Vilnius.JPG/800px-SMK_Vilnius.JPG',
      'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&q=80'
    ]`);
  }
);

fs.writeFileSync(filePath, smkImages);
console.log('Updated scoutGlobalSchools.js with deadlines, requirements and photos.');
