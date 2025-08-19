import { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';

// --- Icon Components (Lucide React equivalent via SVG) ---
const HouseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-building text-blue-500">
    <rect width="16" height="16" x="4" y="2" rx="2" ry="2" />
    <path d="M12 2v14" />
    <path d="M12 14h6" />
    <path d="M12 10h6" />
    <path d="M12 6h6" />
    <path d="M18 6v14" />
    <path d="M18 10v10" />
    <path d="M18 14v6" />
    <path d="M18 18v2" />
    <path d="M4 6v14" />
    <path d="M4 10v10" />
    <path d="M4 14v6" />
    <path d="M4 18v2" />
  </svg>
);

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user-2 text-white">
    <circle cx="12" cy="7" r="4" />
    <path d="M18.8 19.8a9 9 0 0 0-13.6 0" />
  </svg>
);

const HeartIcon = ({ filled = false }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-heart text-red-500">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
);

const StarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="gold" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-star">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const PremiumIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none" className="lucide lucide-diamond text-purple-600">
    <path d="M2.7 10.7a2.41 2.41 0 0 1 0-3.4L6.9 3.5A2.41 2.41 0 0 1 10.3 3.5L13.5 6.7a2.41 2.41 0 0 1 0 3.4L10.3 14.3a2.41 2.41 0 0 1-3.4 0Z"/><path d="M7.6 10.8a2.41 2.41 0 0 0-3.4 0L.5 14.5a2.41 2.41 0 0 0 0 3.4l4.2 4.2a2.41 2.41 0 0 0 3.4 0l3.7-3.7a2.41 2.41 0 0 0 0-3.4Z"/><path d="M10.8 13.5a2.41 2.41 0 0 0-3.4 0L3.5 17.7a2.41 2.41 0 0 0 0 3.4l4.2 4.2a2.41 2.41 0 0 0 3.4 0l3.7-3.7a2.41 2.41 0 0 0 0-3.4Z"/><path d="M13.5 10.7a2.41 2.41 0 0 1 0 3.4L17.7 17.7a2.41 2.41 0 0 1 0 3.4l4.2 4.2a2.41 2.41 0 0 1 0-3.4L17.7 14.3a2.41 2.41 0 0 1-3.4 0Z"/>
  </svg>
);

const ArrowLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left mr-2"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
);

const AdminIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-gauge text-white">
    <path d="m12 15-3.5-3.5L8 10l-2.5-2.5a.5.5 0 0 0-.8.4V20a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8.1a.5.5 0 0 0-.8-.4L16 10l-.5.5L12 15Z"/><path d="m16 10-2.5 2.5a.5.5 0 0 0 .4.8H19a2 2 0 0 0 2-2V8.1a.5.5 0 0 0-.8-.4L16 10Z"/><path d="M12 15h0"/><path d="M12 15l-3.5-3.5"/><path d="M12 15l2.5-2.5"/>
  </svg>
);

// --- Data and Constants ---
const REVIEWS = [
  { text: "Property Bazar helped me find my dream home in just two weeks! The listings are genuine and the interface is so easy to use. Highly recommended!", author: "Priya Sharma" },
  { text: "As a broker, this platform has revolutionized my business. I can connect with serious buyers instantly. The premium listing feature is a game-changer.", author: "Rahul Verma" },
  { text: "Found a great rental apartment without any hassle. The filters are very helpful and the property details are accurate.", author: "Neha Gupta" }
];

const FAQS = [
  { question: "How do I post a property listing?", answer: "Navigate to the 'Post Property' page from the main menu, fill out the form with your property details, and submit. Your listing will be reviewed by an admin for approval." },
  { question: "Is it free to list a property?", answer: "Yes, standard listings are completely free. You can also opt for a premium listing for a small fee to gain more visibility." },
  { question: "How do I contact a property owner?", answer: "On the property details page, you will find a 'Contact Seller' button which will give you the contact information of the person who posted the listing." },
  { question: "What is a featured listing?", answer: "Featured listings are highlighted on the homepage and at the top of the listings page, giving them maximum exposure." }
];

// --- Reusable UI Components ---
const ListingCard = ({ property, isFeatured = false, onClick }) => (
  <div onClick={onClick} className="cursor-pointer bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
    <div className="relative">
      <img
        src={property.image}
        alt={property.title}
        className="w-full h-48 object-cover"
        onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/400x300/e5e7eb/6b7280?text=Image+Not+Found'; }}
      />
      {isFeatured && (
        <span className="absolute top-2 right-2 bg-yellow-500 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-md">
          Featured
        </span>
      )}
      {property.isPremium && (
        <span className="absolute top-2 left-2 bg-purple-600 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-md flex items-center">
          <PremiumIcon /> Premium
        </span>
      )}
      {property.isSoldOut && (
        <span className="absolute bottom-2 left-2 bg-red-600 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-md">
          Sold Out
        </span>
      )}
      <div className="absolute bottom-2 right-2 bg-gray-900 bg-opacity-60 text-white text-xs font-semibold px-2 py-1 rounded-full">
        {property.price}
      </div>
    </div>
    <div className="p-4">
      <h3 className="text-xl font-bold text-gray-800 truncate mb-1">{property.title}</h3>
      <p className="text-sm text-gray-500 mb-2">{property.location}</p>
      <div className="flex justify-between items-center mt-4">
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full transition-colors duration-300">
          View Details
        </button>
        <button aria-label="Add to favorites" className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-300">
          <HeartIcon />
        </button>
      </div>
    </div>
  </div>
);

// --- Page Components ---
const HomePage = ({ allProperties, setActivePage, setSelectedProperty }) => {
  const featuredProperties = allProperties.filter(p => p.isFeatured && p.isApproved && !p.isSoldOut).slice(0, 3);
  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      {/* Hero Section */}
      <section className="bg-blue-600 text-white py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="relative max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4 leading-tight">
            Find Your Dream Property in India
          </h1>
          <p className="text-xl md:text-2xl font-light mb-8">
            Explore homes, apartments, and commercial spaces for sale or rent.
          </p>
          {/* Search Bar */}
          <div className="w-full bg-white rounded-full shadow-xl p-2 flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-search text-gray-400 ml-4"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input
              type="text"
              placeholder="Search by location, city, or keyword..."
              className="w-full h-12 text-gray-800 bg-transparent outline-none focus:ring-0 placeholder:text-gray-400"
            />
            <button className="bg-blue-600 text-white font-bold py-3 px-8 rounded-full hover:bg-blue-700 transition-colors duration-300">
              Search
            </button>
          </div>
        </div>
      </section>

      {/* Featured Properties Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-800 mb-8">Featured Properties <StarIcon /></h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProperties.length > 0 ? (
              featuredProperties.map(p => <ListingCard key={p.id} property={p} isFeatured={true} onClick={() => { setActivePage('details'); setSelectedProperty(p); }} />)
            ) : (
              <p className="text-gray-600">No featured properties found at the moment.</p>
            )}
          </div>
        </div>
      </section>

      {/* Customer Reviews Section */}
      <section className="bg-gray-100 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-800 text-center mb-12">What Our Customers Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {REVIEWS.map((review, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-md">
                <p className="italic text-gray-600 mb-4">"{review.text}"</p>
                <p className="font-semibold text-gray-800">- {review.author}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-800 text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {FAQS.map((faq, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="font-bold text-gray-800 mb-2">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

const ListingsPage = ({ allProperties, setActivePage, setSelectedProperty, categories }) => {
  const [filters, setFilters] = useState({ type: 'All', subType: 'All', keywords: '', location: '' });
  const [filteredProperties, setFilteredProperties] = useState([]);
  
  useEffect(() => {
    // Filter listings whenever filters or properties change
    const newFilteredProperties = allProperties.filter(p => {
      // Show only approved, non-sold-out listings
      if (!p.isApproved || p.isSoldOut) {
        return false;
      }
      if (filters.type !== 'All' && p.type !== filters.type) {
        return false;
      }
      if (filters.subType !== 'All' && p.subType !== filters.subType) {
        return false;
      }
      const keywordsMatch = filters.keywords.toLowerCase().split(' ').every(keyword =>
        (p.title?.toLowerCase().includes(keyword) ||
        p.description?.toLowerCase().includes(keyword))
      );
      const locationMatch = filters.location.toLowerCase().split(' ').every(keyword =>
        (p.location?.toLowerCase().includes(keyword))
      );
      return keywordsMatch && locationMatch;
    });
    setFilteredProperties(newFilteredProperties);
  }, [filters, allProperties]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearchChange = (e) => {
    setFilters(prev => ({ ...prev, keywords: e.target.value }));
  };

  const handleLocationSearch = (e) => {
    setFilters(prev => ({ ...prev, location: e.target.value }));
  };
  
  const allSubTypes = [...new Set(allProperties.map(p => p.subType).filter(Boolean))];

  return (
    <div className="bg-gray-100 min-h-screen font-sans py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">All Property Listings</h1>
        
        {/* Filters and Search Section */}
        <div className="bg-white p-6 rounded-xl shadow-md mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label htmlFor="search-bar" className="block text-sm font-medium text-gray-700">Search by Title/Description</label>
            <input
              id="search-bar"
              type="text"
              name="keywords"
              value={filters.keywords}
              onChange={handleSearchChange}
              placeholder="e.g., modern flat, house for sale"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="location-search" className="block text-sm font-medium text-gray-700">Search by Location</label>
            <input
              id="location-search"
              type="text"
              name="location"
              value={filters.location}
              onChange={handleLocationSearch}
              placeholder="e.g., Delhi, Mumbai"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700">Filter by Type</label>
            <select
              id="type-filter"
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="All">All Types</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>
          {filters.type === 'Residential' && (
            <div>
              <label htmlFor="subtype-filter" className="block text-sm font-medium text-gray-700">Filter by Sub-type</label>
              <select
                id="subtype-filter"
                name="subType"
                value={filters.subType}
                onChange={handleFilterChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="All">All Sub-types</option>
                {allSubTypes.map(subType => (
                  <option key={subType} value={subType}>{subType}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProperties.length > 0 ? (
            filteredProperties.map(p => (
              <ListingCard 
                key={p.id} 
                property={p} 
                onClick={() => { setActivePage('details'); setSelectedProperty(p); }} 
              />
            ))
          ) : (
            <div className="md:col-span-3 text-center text-gray-600 p-8">
              No listings match your search criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const PropertyDetails = ({ property, onBack }) => (
  <div className="bg-gray-100 min-h-screen font-sans">
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <button onClick={onBack} className="flex items-center text-blue-600 hover:text-blue-800 mb-8 transition-colors duration-300">
        <ArrowLeftIcon />
        Back to Listings
      </button>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <img
          src={property.image}
          alt={property.title}
          className="w-full h-96 object-cover"
          onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/1200x800/e5e7eb/6b7280?text=Property+Image'; }}
        />
        <div className="p-8 md:p-12">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">{property.title}</h1>
              <p className="text-xl text-gray-600">{property.location}</p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-extrabold text-blue-600">{property.price}</span>
              {property.isFeatured && <span className="ml-2 bg-yellow-500 text-white text-sm font-semibold px-3 py-1 rounded-full">Featured</span>}
              {property.isPremium && <span className="ml-2 bg-purple-600 text-white text-sm font-semibold px-3 py-1 rounded-full">Premium</span>}
              {property.isSoldOut && <span className="ml-2 bg-red-600 text-white text-sm font-semibold px-3 py-1 rounded-full">Sold Out</span>}
            </div>
          </div>
          <p className="text-gray-700 leading-relaxed mb-6">{property.description}</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center border-t border-b py-4 mb-6">
            <div>
              <p className="font-bold text-gray-800">Poster Role</p>
              <p className="text-gray-600">{property.role}</p>
            </div>
            <div>
              <p className="font-bold text-gray-800">Type</p>
              <p className="text-gray-600">{property.type}</p>
            </div>
            {property.subType && <div>
              <p className="font-bold text-gray-800">Sub-type</p>
              <p className="text-gray-600">{property.subType}</p>
            </div>}
            {property.bedrooms && <div>
              <p className="font-bold text-gray-800">Bedrooms</p>
              <p className="text-gray-600">{property.bedrooms}</p>
            </div>}
            {property.bathrooms && <div>
              <p className="font-bold text-gray-800">Bathrooms</p>
              <p className="text-gray-600">{property.bathrooms}</p>
            </div>}
            <div>
              <p className="font-bold text-gray-800">Area</p>
              <p className="text-gray-600">{property.sqft} sqft</p>
            </div>
          </div>
          <div className="text-center mt-8">
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-full shadow-lg transition-colors duration-300">
              Contact Seller
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const PostPropertyForm = ({ setActivePage, db, userId, categories }) => {
  const [formData, setFormData] = useState({
    title: '', location: '', price: '', description: '', type: 'Residential', subType: 'House', bedrooms: '', bathrooms: '', sqft: '', role: 'Owner', image: null, isPremium: false, isFeatured: false,
  });
  
  const [paytmMessage, setPaytmMessage] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "type") {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        subType: '', bedrooms: '', bathrooms: '',
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };
  
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: URL.createObjectURL(file) }));
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) {
      setPaytmMessage("Please sign in to post a property.");
      return;
    }

    const newProperty = {
      ...formData,
      isApproved: false, // Listings require admin approval
      isSoldOut: false,
      timestamp: serverTimestamp(),
      userId: userId,
      image: formData.image || 'https://placehold.co/400x300/e5e7eb/6b7280?text=New+Listing',
      duration: 180 * 24 * 60 * 60 * 1000 // 6 months in milliseconds
    };

    try {
      // Add to public collection for admin to see, will be approved later
      await addDoc(collection(db, `artifacts/${__app_id}/public/data/listings`), newProperty);
      // Add to user's private collection for their dashboard
      await addDoc(collection(db, `artifacts/${__app_id}/users/${userId}/listings`), newProperty);
      
      setPaytmMessage('Listing submitted for review. It will be visible on the listings page after admin approval.');
      setTimeout(() => setActivePage('listings'), 3000);
    } catch (e) {
      console.error("Error adding document: ", e);
      setPaytmMessage('Error posting listing. Please try again.');
    }
  };

  const residentialSubtypes = ['House', 'Villa', 'Duplex', 'Simplex', 'Flat'];
  const commercialSubtypes = ['Shop', 'Office', 'Godown', 'Showroom'];

  const getSubtypes = (type) => {
    switch(type) {
      case 'Residential':
        return residentialSubtypes;
      case 'Commercial':
        return commercialSubtypes;
      default:
        return [];
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen font-sans">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">Post Your Property</h1>
          {paytmMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
              <span className="block sm:inline">{paytmMessage}</span>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-700 font-bold mb-2">Title</label>
              <input type="text" name="title" value={formData.title} onChange={handleChange} className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div>
              <label className="block text-gray-700 font-bold mb-2">Location</label>
              <input type="text" name="location" value={formData.location} onChange={handleChange} className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., Connaught Place, New Delhi" required />
            </div>
            <div>
              <label className="block text-gray-700 font-bold mb-2">Price</label>
              <input type="text" name="price" value={formData.price} onChange={handleChange} className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., ₹ 50 Lakh" required />
            </div>
            <div>
              <label className="block text-gray-700 font-bold mb-2">Description</label>
              <textarea name="description" value={formData.description} onChange={handleChange} rows="4" className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required></textarea>
            </div>
            <div>
              <label className="block text-gray-700 font-bold mb-2">Property Type</label>
              <select name="type" value={formData.type} onChange={handleChange} className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>
            {getSubtypes(formData.type).length > 0 && (
              <div>
                <label className="block text-gray-700 font-bold mb-2">Sub-type</label>
                <select name="subType" value={formData.subType} onChange={handleChange} className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {getSubtypes(formData.type).map(subType => (
                    <option key={subType} value={subType}>{subType}</option>
                  ))}
                </select>
              </div>
            )}
            {formData.type === 'Residential' && (
              <>
                <div>
                  <label className="block text-gray-700 font-bold mb-2">Bedrooms</label>
                  <input type="number" name="bedrooms" value={formData.bedrooms} onChange={handleChange} className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-2">Bathrooms</label>
                  <input type="number" name="bathrooms" value={formData.bathrooms} onChange={handleChange} className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </>
            )}
            <div>
              <label className="block text-gray-700 font-bold mb-2">Area (sqft)</label>
              <input type="number" name="sqft" value={formData.sqft} onChange={handleChange} className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div>
              <label className="block text-gray-700 font-bold mb-2">Your Role</label>
              <select name="role" value={formData.role} onChange={handleChange} className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="Owner">Owner</option>
                <option value="Broker">Broker</option>
                <option value="Property Dealer">Property Dealer</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700 font-bold mb-2">Upload Image</label>
              <input type="file" onChange={handleImageChange} className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" accept="image/*" />
              {formData.image && <img src={formData.image} alt="Property Preview" className="mt-4 rounded-lg w-full h-48 object-cover" />}
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" name="isPremium" checked={formData.isPremium} onChange={handleChange} className="h-4 w-4 text-blue-600 rounded" />
              <label className="text-gray-700">Make this a Premium Listing (₹500)</label>
            </div>
            <div className="text-center">
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-colors duration-300">
                Submit Listing
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const LoginPage = ({ setActivePage, auth }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setActivePage('dashboard');
    } catch (e) {
      setError(e.message);
      console.error("Login error:", e);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-sm">
        <h2 className="text-3xl font-bold text-gray-800 text-center mb-6">Login</h2>
        <p className="text-center text-gray-600 mb-6">Enter your details to access your account.</p>
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-lg mb-4">{error}</div>}
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">Email</label>
            <input 
              className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500" 
              id="email" type="email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">Password</label>
            <input 
              className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500" 
              id="password" type="password" placeholder="********" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button 
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-300"
          >
            Sign In
          </button>
        </form>
        <p className="mt-6 text-center text-gray-600 text-sm">
          Don't have an account? <button onClick={() => setActivePage('signup')} className="text-blue-500 hover:text-blue-700 font-bold">Sign up now</button>
        </p>
      </div>
    </div>
  );
};

const SignUpPage = ({ setActivePage, auth }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setActivePage('dashboard');
    } catch (e) {
      setError(e.message);
      console.error("Sign-up error:", e);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-sm">
        <h2 className="text-3xl font-bold text-gray-800 text-center mb-6">Create Account</h2>
        <p className="text-center text-gray-600 mb-6">Create a new account to post listings and manage your profile.</p>
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-lg mb-4">{error}</div>}
        <form onSubmit={handleSignUp} className="space-y-6">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">Email</label>
            <input 
              className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500" 
              id="email" type="email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">Password</label>
            <input 
              className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500" 
              id="password" type="password" placeholder="********" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button 
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-300"
          >
            Create Account
          </button>
        </form>
        <p className="mt-6 text-center text-gray-600 text-sm">
          Already have an account? <button onClick={() => setActivePage('login')} className="text-blue-500 hover:text-blue-700 font-bold">Sign in</button>
        </p>
      </div>
    </div>
  );
};

const AboutUsPage = () => (
  <div className="bg-gray-100 min-h-screen font-sans py-12 px-4 sm:px-6 lg:px-8">
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">
      <h1 className="text-4xl font-bold text-gray-800 mb-6 text-center">About Property Bazar</h1>
      <p className="text-gray-700 text-lg leading-relaxed mb-4">
        Property Bazar is a leading online platform dedicated to helping you find your perfect home or investment property. Our mission is to simplify the real estate process, making it transparent, efficient, and accessible for everyone.
      </p>
      <p className="text-gray-700 text-lg leading-relaxed mb-4">
        Whether you are a buyer, seller, owner, or broker, our platform provides the tools you need to connect with genuine listings and verified clients. We offer a wide range of properties, from residential homes to commercial spaces, across India.
      </p>
      <p className="text-gray-700 text-lg leading-relaxed">
        Thank you for choosing Property Bazar. We look forward to helping you with your real estate journey.
      </p>
    </div>
  </div>
);

const UserDashboardPage = ({ user, userProperties, setActivePage, handleLogout }) => (
    <div className="bg-gray-100 p-8 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-extrabold text-gray-800 mb-8">User Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">My Profile</h2>
            <p className="text-gray-600">User ID: <span className="font-mono break-all">{user.uid}</span></p>
            <p className="text-gray-600">Email: {user.email || 'N/A'}</p>
            <button 
              onClick={handleLogout}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded-full hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
          {/* My Listings */}
          <div className="bg-white p-6 rounded-xl shadow-lg md:col-span-2">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">My Listings</h2>
            {userProperties.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userProperties.map((p) => (
                  <div key={p.id} className="bg-gray-50 p-4 rounded-lg shadow">
                    <h3 className="font-bold text-gray-800">{p.title}</h3>
                    <p className="text-sm text-gray-600">{p.location}</p>
                    <p className="text-lg font-semibold text-blue-600 mt-2">{p.price}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${p.isApproved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {p.isApproved ? 'Approved' : 'Pending'}
                      </span>
                      {p.isSoldOut && <span className="text-xs font-semibold px-2 py-1 rounded-full bg-red-100 text-red-700">Sold Out</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">You have no listings yet. Post one now!</p>
            )}
          </div>
        </div>
      </div>
    </div>
);

// --- Admin Panel Components ---
const AdminPanel = ({ allProperties, users, categories, db, setActivePage }) => {
  const [activeTab, setActiveTab] = useState('listings');

  const updateListing = async (id, data) => {
    try {
      const q = query(collection(db, `artifacts/${__app_id}/public/data/listings`), where("id", "==", id));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const docRef = doc(db, `artifacts/${__app_id}/public/data/listings`, querySnapshot.docs[0].id);
        await updateDoc(docRef, data);
      } else {
         console.warn("Public listing not found for update:", id);
      }
    } catch (e) {
      console.error("Error updating public document:", e);
    }
  };
  
  const handleApprove = (listingId) => {
    updateListing(listingId, { isApproved: true });
  };
  
  const handleDelete = async (listingId) => {
    try {
      // Find and delete from public listings
      const qPublic = query(collection(db, `artifacts/${__app_id}/public/data/listings`), where("id", "==", listingId));
      const querySnapshotPublic = await getDocs(qPublic);
      if (!querySnapshotPublic.empty) {
        const publicDocRef = doc(db, `artifacts/${__app_id}/public/data/listings`, querySnapshotPublic.docs[0].id);
        await deleteDoc(publicDocRef);
      }
      
      // Find and delete from user's private listings
      const qUser = query(collection(db, `artifacts/${__app_id}/users`), where("id", "==", listingId));
      const querySnapshotUser = await getDocs(qUser);
      if (!querySnapshotUser.empty) {
         const userDocRef = doc(db, `artifacts/${__app_id}/users/${querySnapshotUser.docs[0].data().userId}/listings`, querySnapshotUser.docs[0].id);
         await deleteDoc(userDocRef);
      }
    } catch (e) {
      console.error("Error deleting listing:", e);
    }
  };

  const AdminListings = () => (
    <div>
      <h2 className="text-3xl font-bold text-gray-800 mb-4">Manage Listings</h2>
      <div className="overflow-x-auto bg-white rounded-lg shadow-md p-4">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Badges</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {allProperties.map((p) => (
              <tr key={p.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{p.title}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${p.isApproved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {p.isApproved ? 'Approved' : 'Pending'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex space-x-2">
                    {p.isPremium && <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">Premium</span>}
                    {p.isFeatured && <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Featured</span>}
                    {p.isSoldOut && <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Sold Out</span>}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex flex-wrap space-x-2">
                    {!p.isApproved && <button onClick={() => handleApprove(p.id)} className="text-green-600 hover:text-green-900">Approve</button>}
                    <button onClick={() => updateListing(p.id, { isSoldOut: !p.isSoldOut })} className="text-indigo-600 hover:text-indigo-900">{p.isSoldOut ? 'Mark Available' : 'Mark Sold Out'}</button>
                    <button onClick={() => updateListing(p.id, { isPremium: !p.isPremium })} className="text-purple-600 hover:text-purple-900">{p.isPremium ? 'Remove Premium' : 'Add Premium'}</button>
                    <button onClick={() => updateListing(p.id, { isFeatured: !p.isFeatured })} className="text-yellow-600 hover:text-yellow-900">{p.isFeatured ? 'Remove Featured' : 'Add Featured'}</button>
                    <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:text-red-900">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const AdminUsers = () => (
    <div>
      <h2 className="text-3xl font-bold text-gray-800 mb-4">Manage Users</h2>
      <div className="overflow-x-auto bg-white rounded-lg shadow-md p-4">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.email || "Anonymous"}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono break-all">{user.uid}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const AdminCategories = () => {
    const [newCategory, setNewCategory] = useState('');
    const handleAddCategory = async () => {
      if (newCategory.trim() === '') return;
      try {
        await addDoc(collection(db, `artifacts/${__app_id}/public/data/categories`), { name: newCategory });
        setNewCategory('');
      } catch (e) {
        console.error("Error adding category:", e);
      }
    };

    const handleRemoveCategory = async (categoryId) => {
      try {
        await deleteDoc(doc(db, `artifacts/${__app_id}/public/data/categories`, categoryId));
      } catch (e) {
        console.error("Error removing category:", e);
      }
    };

    return (
      <div>
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Manage Categories</h2>
        <div className="bg-white p-6 rounded-xl shadow-md space-y-4">
          <div className="flex space-x-2">
            <input type="text" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="New Category Name" className="flex-grow p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <button onClick={handleAddCategory} className="bg-green-600 text-white font-bold py-2 px-4 rounded-full hover:bg-green-700 transition-colors duration-300">Add</button>
          </div>
          <ul className="divide-y divide-gray-200">
            {categories.map(cat => (
              <li key={cat.id} className="flex items-center justify-between py-2">
                <span className="text-gray-800">{cat.name}</span>
                <button onClick={() => handleRemoveCategory(cat.id)} className="text-red-600 hover:text-red-900">Remove</button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  const BulkUpload = () => {
    const [message, setMessage] = useState('');

    const handleFileUpload = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const text = event.target.result;
          const rows = text.split('\n').map(row => row.split(','));
          const headers = rows[0];
          const listings = rows.slice(1).map(row => {
            const obj = {};
            headers.forEach((header, index) => {
              obj[header.trim()] = row[index] ? row[index].trim() : '';
            });
            return obj;
          });

          setMessage('Processing bulk upload...');
          let successCount = 0;
          for (const listing of listings) {
            try {
              if (listing.title && listing.location) {
                const newProperty = {
                  ...listing,
                  isApproved: false,
                  isSoldOut: false,
                  isPremium: listing.isPremium?.toLowerCase() === 'true',
                  isFeatured: listing.isFeatured?.toLowerCase() === 'true',
                  timestamp: serverTimestamp(),
                  duration: 180 * 24 * 60 * 60 * 1000,
                  userId: 'bulk-admin-upload',
                  image: listing.image || 'https://placehold.co/400x300/e5e7eb/6b7280?text=Bulk+Listing',
                };
                await addDoc(collection(db, `artifacts/${__app_id}/public/data/listings`), newProperty);
                successCount++;
              }
            } catch (e) {
              console.error("Error adding bulk listing:", e);
            }
          }
          setMessage(`Successfully uploaded ${successCount} listings.`);
        };
        reader.readAsText(file);
      }
    };
    
    const sampleCsv = `title,location,price,description,type,subType,sqft,isPremium,isFeatured,image\nLuxury Villa,Mumbai,₹ 2 Crore,A beautiful villa in the heart of the city.,Residential,Villa,3000,true,false,https://placehold.co/400x300/e5e7eb/6b7280?text=Villa\nOffice Space,Delhi,₹ 50 Lakh,Modern office space for rent.,Commercial,Office,1500,false,true,https://placehold.co/400x300/e5e7eb/6b7280?text=Office`;

    const downloadCsv = () => {
      const element = document.createElement("a");
      const file = new Blob([sampleCsv], {type: 'text/csv'});
      element.href = URL.createObjectURL(file);
      element.download = "sample_listings.csv";
      document.body.appendChild(element);
      element.click();
    };

    return (
      <div>
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Bulk Upload Listings</h2>
        <div className="bg-white p-6 rounded-xl shadow-md space-y-4">
          <p className="text-gray-700">Upload listings using a CSV file. The file should have headers: <code>title, location, price, description, type, subType, sqft, isPremium, isFeatured, image</code>.</p>
          <button onClick={downloadCsv} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-full transition-colors duration-300">
            Download Sample CSV
          </button>
          <input type="file" accept=".csv" onChange={handleFileUpload} className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {message && <p className="text-green-700 mt-2">{message}</p>}
        </div>
      </div>
    );
  };
  
  return (
    <div className="bg-gray-100 min-h-screen font-sans p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-extrabold text-gray-800 mb-8">Admin Dashboard</h1>
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-wrap gap-4">
            <button onClick={() => setActiveTab('listings')} className={`px-6 py-2 rounded-full font-semibold transition-colors ${activeTab === 'listings' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-blue-100'}`}>Manage Listings</button>
            <button onClick={() => setActiveTab('users')} className={`px-6 py-2 rounded-full font-semibold transition-colors ${activeTab === 'users' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-blue-100'}`}>Manage Users</button>
            <button onClick={() => setActiveTab('categories')} className={`px-6 py-2 rounded-full font-semibold transition-colors ${activeTab === 'categories' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-blue-100'}`}>Manage Categories</button>
            <button onClick={() => setActiveTab('bulk-upload')} className={`px-6 py-2 rounded-full font-semibold transition-colors ${activeTab === 'bulk-upload' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-blue-100'}`}>Bulk Upload</button>
          </div>
        </div>
        {activeTab === 'listings' && <AdminListings />}
        {activeTab === 'users' && <AdminUsers />}
        {activeTab === 'categories' && <AdminCategories />}
        {activeTab === 'bulk-upload' && <BulkUpload />}
      </div>
    </div>
  );
};

// Footer Component
const Footer = () => (
  <footer className="bg-gray-800 text-white py-8 px-4 sm:px-6 lg:px-8 rounded-t-xl mt-12">
    <div className="max-w-7xl mx-auto text-center">
      <div className="flex justify-center space-x-6 mb-4">
        <button onClick={() => {}} className="text-gray-300 hover:text-blue-400 transition-colors duration-300">About Us</button>
        <button onClick={() => {}} className="text-gray-300 hover:text-blue-400 transition-colors duration-300">Contact</button>
        <button onClick={() => {}} className="text-gray-300 hover:text-blue-400 transition-colors duration-300">Privacy Policy</button>
      </div>
      <p className="text-gray-400 text-sm">&copy; 2024 Property Bazar. All rights reserved.</p>
    </div>
  </footer>
);

// --- Main App Component ---
export default function App() {
  const [activePage, setActivePage] = useState('home');
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [allProperties, setAllProperties] = useState([]);
  const [userProperties, setUserProperties] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);

  // Firestore Initialization and Authentication
  useEffect(() => {
    const initializeFirebase = async () => {
      try {
        const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
        const app = initializeApp(firebaseConfig);
        const firestoreDb = getFirestore(app);
        const firebaseAuth = getAuth(app);
        
        setDb(firestoreDb);
        setAuth(firebaseAuth);

        const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

        // Listener for user authentication state
        const unsubscribeAuth = onAuthStateChanged(firebaseAuth, async (currentUser) => {
          if (currentUser) {
            setUser(currentUser);
            // Check for admin role (simplified for demo)
            setIsAdmin(currentUser.email === 'admin@admin.com');

            // Listen for public listings
            const publicListingsUnsubscribe = onSnapshot(collection(firestoreDb, `artifacts/${__app_id}/public/data/listings`), (querySnapshot) => {
              const listings = [];
              querySnapshot.forEach((doc) => {
                listings.push({ id: doc.id, ...doc.data() });
              });
              listings.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
              setAllProperties(listings);
            }, (error) => {
              console.error("Error fetching public listings:", error);
            });

            // Listen for categories
            const categoriesUnsubscribe = onSnapshot(collection(firestoreDb, `artifacts/${__app_id}/public/data/categories`), (querySnapshot) => {
              const fetchedCategories = [];
              querySnapshot.forEach((doc) => {
                fetchedCategories.push({ id: doc.id, ...doc.data() });
              });
              setCategories(fetchedCategories);
            }, (error) => {
              console.error("Error fetching categories:", error);
            });

            // Listen for user's private listings
            const userListingsUnsubscribe = onSnapshot(collection(firestoreDb, `artifacts/${__app_id}/users/${currentUser.uid}/listings`), (querySnapshot) => {
              const listings = [];
              querySnapshot.forEach((doc) => {
                listings.push({ id: doc.id, ...doc.data() });
              });
              setUserProperties(listings);
            }, (error) => {
              console.error("Error fetching user listings:", error);
            });

            // Listen for all users (Admin view)
            if (currentUser.email === 'admin@admin.com') {
              const allUsers = [];
              const usersQuery = await getDocs(collection(firestoreDb, `artifacts/${__app_id}/users`));
              usersQuery.forEach((doc) => {
                 allUsers.push({ id: doc.id, uid: doc.id, ...doc.data() });
              });
              setUsers(allUsers);
            }
            
            return () => {
              publicListingsUnsubscribe();
              categoriesUnsubscribe();
              userListingsUnsubscribe();
            };
          } else {
            setUser(null);
            setIsAdmin(false);
            setUserProperties([]);
            if (initialAuthToken) {
              await signInWithCustomToken(firebaseAuth, initialAuthToken);
            } else {
              await signInAnonymously(firebaseAuth);
            }
          }
          setIsAuthReady(true);
        });
        
        return () => {
          unsubscribeAuth();
        };

      } catch (e) {
        console.error("Error initializing Firebase:", e);
      }
    };
    initializeFirebase();
  }, []);
  
  // Create default categories if none exist
  useEffect(() => {
    const addDefaultCategories = async () => {
      if (db && categories.length === 0) {
        const defaultCats = ['Residential', 'Commercial', 'Land', 'Marriage Hall', 'Factory', 'School'];
        for (const cat of defaultCats) {
          try {
            await addDoc(collection(db, `artifacts/${__app_id}/public/data/categories`), { name: cat });
          } catch(e) {
            console.error("Error adding default category:", e);
          }
        }
      }
    };
    if (isAuthReady && db) { // Check for db as well
      addDefaultCategories();
    }
  }, [isAuthReady, db, categories]);


  const handleLogout = () => {
      if (auth) {
        signOut(auth).then(() => {
          setActivePage('home');
          setUser(null);
          signInAnonymously(auth);
        }).catch((error) => {
          console.error("Logout error:", error);
        });
      }
  };

  const renderContent = () => {
    if (!isAuthReady) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <p className="text-gray-600">Loading app...</p>
        </div>
      );
    }
    
    switch (activePage) {
      case 'home':
        return <HomePage allProperties={allProperties} setActivePage={setActivePage} setSelectedProperty={setSelectedProperty} />;
      case 'listings':
        return <ListingsPage allProperties={allProperties} setActivePage={setActivePage} setSelectedProperty={setSelectedProperty} categories={categories} />;
      case 'details':
        return <PropertyDetails property={selectedProperty} onBack={() => setActivePage('listings')} />;
      case 'post':
        return <PostPropertyForm setActivePage={setActivePage} db={db} userId={user ? user.uid : null} categories={categories} />;
      case 'dashboard':
        return <UserDashboardPage user={user} userProperties={userProperties} setActivePage={setActivePage} handleLogout={handleLogout} />;
      case 'login':
        return <LoginPage setActivePage={setActivePage} auth={auth} />;
      case 'signup':
        return <SignUpPage setActivePage={setActivePage} auth={auth} />;
      case 'about':
        return <AboutUsPage />;
      case 'admin':
        return <AdminPanel allProperties={allProperties} users={users} categories={categories} db={db} setActivePage={setActivePage} />;
      default:
        return <HomePage allProperties={allProperties} setActivePage={setActivePage} setSelectedProperty={setSelectedProperty} />;
    }
  };

  return (
    <div className="font-sans">
      {/* Navbar */}
      <nav className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0">
              <button onClick={() => setActivePage('home')} className="flex items-center space-x-2">
                <HouseIcon />
                <span className="text-2xl font-bold text-gray-800">Property Bazar</span>
              </button>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <button onClick={() => setActivePage('home')} className="text-gray-600 hover:text-blue-600 transition-colors duration-300">Home</button>
              <button onClick={() => setActivePage('listings')} className="text-gray-600 hover:text-blue-600 transition-colors duration-300">Listings</button>
              <button onClick={() => setActivePage('about')} className="text-gray-600 hover:text-blue-600 transition-colors duration-300">About Us</button>
              <button onClick={() => setActivePage('post')} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-full hover:bg-blue-700 transition-colors duration-300">
                Post Property
              </button>
              {isAdmin && (
                <button onClick={() => setActivePage('admin')} className="bg-gray-800 text-white py-2 px-4 rounded-full hover:bg-gray-900 transition-colors duration-300 flex items-center space-x-2">
                  <AdminIcon />
                  <span>Admin Panel</span>
                </button>
              )}
              <button onClick={() => user ? setActivePage('dashboard') : setActivePage('login')} className="bg-gray-800 text-white py-2 px-4 rounded-full hover:bg-gray-900 transition-colors duration-300 flex items-center space-x-2">
                <UserIcon />
                <span>{user ? 'Dashboard' : 'Login'}</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {renderContent()}

      <Footer />
    </div>
  );
}
