import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Card, PageContainer, SectionHeading, StatusBadge } from '../components/PublicUI';
import { SearchBar, SelectInput, EmptyState } from '../components/PublicUI2';
import { mockDonations, mockCategories } from '../mockData';

export const AvailableFood = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [filteredDonations, setFilteredDonations] = useState([]);

  useEffect(() => {
    let result = mockDonations;
    if (searchTerm) {
      result = result.filter(d => d.title.toLowerCase().includes(searchTerm.toLowerCase()) || d.location.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (categoryFilter) {
      result = result.filter(d => d.category === categoryFilter);
    }
    // Only show available and expired (to show the states), omit ones accepted by others
    result = result.filter(d => d.status === 'AVAILABLE' || d.status === 'EXPIRED');
    setFilteredDonations(result);
  }, [searchTerm, categoryFilter]);

  return (
    <div className="bg-background min-h-screen">
      <div className="bg-primary pb-24 pt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-8">Available Food Near You</h1>
          <div className="max-w-3xl mx-auto flex flex-col md:flex-row gap-4 bg-white p-2 rounded-2xl md:rounded-full shadow-lg">
            <div className="flex-1">
              <div className="relative">
                <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input 
                  type="text" 
                  placeholder="Search food or location..." 
                  className="w-full pl-12 pr-4 py-3 rounded-full md:border-none focus:outline-none focus:ring-0"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="w-full md:w-64 border-t md:border-t-0 md:border-l border-gray-200">
              <select 
                className="w-full px-4 py-3 bg-transparent focus:outline-none text-gray-700 font-medium"
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
              >
                <option value="">All Categories</option>
                {mockCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      <PageContainer className="-mt-16">
        {filteredDonations.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredDonations.map(donation => (
              <Card key={donation.id} className="flex flex-col h-full hover:shadow-lg transition-shadow">
                <div className="h-48 relative overflow-hidden bg-gray-200">
                  <img src={donation.imageUrl} alt={donation.title} className="w-full h-full object-cover" />
                  <div className="absolute top-4 right-4"><StatusBadge status={donation.status} /></div>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-gray-900 line-clamp-1">{donation.title}</h3>
                  </div>
                  <p className="text-sm text-primary font-medium mb-4">{donation.category}</p>
                  <div className="text-gray-600 text-sm space-y-2 mb-6 flex-1 grid grid-cols-2 gap-x-2">
                    <p><i className="fas fa-box w-4 text-gray-400"></i> {donation.qty} units</p>
                    <p><i className="fas fa-users w-4 text-gray-400"></i> {donation.servings} serves</p>
                    <p className="col-span-2 mt-2"><i className="fas fa-map-marker-alt w-4 text-gray-400"></i> {donation.distance} km away</p>
                    <p className="col-span-2 text-red-500 font-medium mt-1">
                      <i className="fas fa-clock w-4"></i> Safe until: {new Date(donation.safeUntil).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                  <Link to={`/food/${donation.id}`} className="w-full">
                    <Button variant="outline" className="w-full">View Details</Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState title="No food found" message="Try adjusting your filters or search terms." />
        )}
      </PageContainer>
    </div>
  );
};

export const FoodDetails = () => {
  const { id } = useParams();
  const donation = mockDonations.find(d => d.id === parseInt(id));
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!donation) return;
    
    const updateTime = () => {
      const now = new Date().getTime();
      const expiry = new Date(donation.safeUntil).getTime();
      const distance = expiry - now;

      if (distance < 0 || donation.status === 'EXPIRED') {
        setTimeLeft('EXPIRED');
        return;
      }

      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      
      setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, [donation]);

  if (!donation) {
    return <PageContainer><EmptyState title="Food not found" message="The donation you are looking for does not exist." icon="fa-exclamation-circle" /></PageContainer>;
  }

  const isExpired = timeLeft === 'EXPIRED' || donation.status === 'EXPIRED';

  return (
    <div className="bg-background min-h-screen py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/" className="inline-flex items-center text-gray-500 hover:text-primary mb-6 transition-colors">
          <i className="fas fa-arrow-left mr-2"></i> Back to Home
        </Link>
        
        <div className="bg-white rounded-3xl shadow-soft overflow-hidden">
          <div className="md:flex">
            {/* Image Column */}
            <div className="md:w-1/2 h-64 md:h-auto relative">
              <img src={donation.imageUrl} alt={donation.title} className="w-full h-full object-cover" />
              <div className="absolute top-4 left-4"><StatusBadge status={isExpired ? 'EXPIRED' : donation.status} /></div>
            </div>
            
            {/* Details Column */}
            <div className="md:w-1/2 p-8 md:p-10 flex flex-col">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{donation.title}</h1>
              <p className="text-primary font-medium mb-6">{donation.category}</p>
              
              <div className={`p-4 rounded-xl mb-8 flex items-center justify-between ${isExpired ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-orange-50 text-orange-800 border border-orange-100'}`}>
                <div className="flex items-center">
                  <i className="fas fa-stopwatch text-2xl mr-3"></i>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider opacity-80">Safe Until Countdown</p>
                    <p className="text-xl font-bold font-mono">{timeLeft}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-6 gap-x-4 mb-8">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Quantity</p>
                  <p className="font-semibold text-gray-900">{donation.qty} Units</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Servings</p>
                  <p className="font-semibold text-gray-900">{donation.servings} People</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Prepared At</p>
                  <p className="font-semibold text-gray-900">{new Date(donation.preparedDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Storage Required</p>
                  <p className="font-semibold text-gray-900">{donation.storageType}</p>
                </div>
              </div>

              <div className="mb-8 flex-1">
                <h3 className="font-bold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600 leading-relaxed">{donation.description}</p>
              </div>

              <div className="border-t border-gray-100 pt-6 mt-auto">
                <p className="text-gray-500 mb-4 flex items-center">
                  <i className="fas fa-map-marker-alt text-primary mr-2 w-4"></i>
                  <span className="font-medium text-gray-800">{donation.location}</span> ({donation.distance} km away)
                </p>
                <div className="space-y-3">
                  <Button variant="primary" className="w-full" disabled={isExpired || donation.status !== 'AVAILABLE'}>
                    {isExpired ? 'Food Expired' : (donation.status === 'AVAILABLE' ? 'Accept Donation (NGO Login Required)' : 'Already Accepted')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
