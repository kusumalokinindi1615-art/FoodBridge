export const mockStats = {
  mealsShared: 12500,
  activeDonors: 340,
  partnerNGOs: 85,
  volunteers: 420
};

export const mockCategories = [
  "Cooked Meals",
  "Bakery",
  "Fruits & Vegetables",
  "Packaged Food",
  "Other"
];

// Generate dates relative to current time for realistic expiry
const now = new Date();
const inTwoHours = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString();
const pastHour = new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString();
const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

export const mockUsers = [
  { id: '1', name: 'Hotel Grand', email: 'donor@test.com', role: 'DONOR', location: 'Downtown Tech Hub' },
  { id: '2', name: 'Helping Hands NGO', email: 'ngo@test.com', role: 'NGO', location: 'City Center' },
  { id: '3', name: 'John Driver', email: 'vol@test.com', role: 'VOLUNTEER', location: 'Westside' },
  { id: '4', name: 'Admin User', email: 'admin@test.com', role: 'ADMIN', location: 'HQ' }
];

export const mockNotifications = [
  { id: 1, userId: 'NGO_ALL', text: 'Welcome to FoodBridge! Start by exploring available donations near you.', type: 'SYSTEM', read: false, date: pastHour }
];

export const mockDonations = [
  { 
    id: 1, 
    title: 'Vegetable Biryani', 
    category: 'Cooked Meals', 
    description: 'Freshly prepared vegetable biryani leftover from a corporate event. Kept in warm containers.',
    qty: '40 kg', 
    servings: 40,
    status: 'AVAILABLE', 
    location: 'Downtown Tech Hub', 
    distance: 2.1,
    donorId: '1',
    preparedDate: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
    safeUntil: inTwoHours,
    storageType: 'Hot Food Container',
    imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80',
    createdAt: pastHour
  },
  { 
    id: 2, 
    title: 'Assorted Bread & Pastries', 
    category: 'Bakery', 
    description: 'End of day surplus from our local bakery. Includes sourdough, croissants, and bagels.',
    qty: '25 packets', 
    servings: 50,
    status: 'NGO_ACCEPTED', 
    location: 'Main St Bakery',
    deliveryLocation: 'Orphanage North',
    distance: 1.5,
    donorId: '1',
    ngoId: '2',
    ngoName: 'Helping Hands NGO',
    preparedDate: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
    safeUntil: tomorrow,
    storageType: 'Room Temperature',
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80',
    createdAt: pastHour
  },
  { 
    id: 5, 
    title: 'Canned Soups & Beans', 
    category: 'Packaged Food', 
    description: 'Overstocked canned goods close to best before date but still safe for consumption.',
    qty: '100 boxes', 
    servings: 200,
    status: 'DELIVERED', 
    location: 'North Supermarket',
    deliveryLocation: 'City Center Community Hall', 
    distance: 5.5,
    donorId: '1',
    ngoId: '2',
    ngoName: 'Helping Hands NGO',
    volunteerId: '3',
    volunteerName: 'John Driver',
    preparedDate: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString(),
    safeUntil: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    storageType: 'Room Temperature',
    imageUrl: 'https://images.unsplash.com/photo-1596646549248-c2b6279f9b5c?w=800&q=80',
    createdAt: new Date(now.getTime() - 10 * 60 * 60 * 1000).toISOString()
  }
];
