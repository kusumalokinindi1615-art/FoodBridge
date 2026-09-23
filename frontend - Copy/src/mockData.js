export const mockUsers = [
  { id: 1, name: 'John Donor', role: 'DONOR', email: 'john@example.com' },
  { id: 2, name: 'Food Rescue NGO', role: 'NGO', email: 'ngo@example.com' },
  { id: 3, name: 'Alice Volunteer', role: 'VOLUNTEER', email: 'alice@example.com' },
  { id: 4, name: 'Admin System', role: 'ADMIN', email: 'admin@example.com' }
];

export const mockDonations = [
  { id: 101, title: '50 Boxed Lunches', category: 'Prepared Meals', qty: 50, status: 'AVAILABLE', location: 'Downtown Hotel', date: '2023-10-01' },
  { id: 102, title: 'Fresh Vegetables', category: 'Produce', qty: 100, status: 'NGO_ACCEPTED', location: 'City Market', date: '2023-10-02' },
  { id: 103, title: 'Bakery Surplus', category: 'Baked Goods', qty: 30, status: 'IN_TRANSIT', location: 'Main St Bakery', date: '2023-10-03' },
  { id: 104, title: 'Canned Goods', category: 'Non-Perishable', qty: 200, status: 'DELIVERED', location: 'Community Center', date: '2023-10-04' }
];

export const mockNotifications = [
  { id: 1, text: 'New donation available near you.', read: false, date: '2 hrs ago' },
  { id: 2, text: 'Your donation was delivered successfully!', read: true, date: '1 day ago' }
];

export const mockStats = {
  totalDonations: 1450,
  mealsServed: 5200,
  activeVolunteers: 120,
  ngosPartnered: 45
};
