import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import data from '../data.json';

export const migrateDataToFirestore = async () => {
  try {
    // Migrate Schools
    const schoolsCol = collection(db, 'schools');
    for (const school of data.schools) {
      await addDoc(schoolsCol, {
        ...school,
        createdAt: serverTimestamp()
      });
    }
    console.log('Schools migrated successfully');

    // Migrate Housing
    const housingCol = collection(db, 'housing');
    for (const house of data.housing) {
      await addDoc(housingCol, {
        ...house,
        createdAt: serverTimestamp()
      });
    }
    console.log('Housing migrated successfully');

    // Migrate Services
    const servicesCol = collection(db, 'services');
    for (const service of data.services) {
      await addDoc(servicesCol, {
        ...service,
        createdAt: serverTimestamp()
      });
    }
    console.log('Services migrated successfully');

    return true;
  } catch (error) {
    console.error('Migration failed:', error);
    return false;
  }
};
