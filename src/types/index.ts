export interface School {
  id: string;
  name: string;
  location: string;
  country: string;
  tuitionFee: number;
  tuition: string;
  courses: string[];
  whatsapp: string;
  imageUrl?: string;
  isVerified?: boolean;
}

export interface HousingListing {
  id: string;
  title: string;
  location: string;
  price: string;
  whatsapp: string;
  description: string;
  imageUrl?: string;
  userId?: string;
  createdAt?: string | Date;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  bio?: string;
  country?: string;
  major?: string;
  photoUrl?: string;
  joinedAt?: any;
  lastOnline?: any;
  status?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  read: boolean;
  createdAt: any;
}

export interface Message {
  id: string;
  text: string;
  senderId: string;
  createdAt: any;
}

export interface Conversation {
  id: string;
  participants: string[];
  type: 'direct' | 'group' | 'student-to-student';
  lastMessage: string;
  updatedAt: any;
  createdAt: any;
  propertyTitle?: string;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: any;
}
