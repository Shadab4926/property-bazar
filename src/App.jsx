import { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';

// --- Global variables for Firebase setup, DO NOT CHANGE ---
// This is how the app gets its Firebase config and auth token
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

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

const CATEGORIES = [
  { id: '1', name: 'Residential' },
  { id: '2', name: 'Commercial' },
  { id: '3', name: 'Agricultural' },
  { id: '4', name: 'Land' },
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

const Modal = ({ show, title, message, onClose }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-sm mx-auto">
        <div className="text-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">{title}</h3>
        </div>
        <div className="text-center">
          <p className="text-gray-600 mb-6">{message}</p>
          <button onClick={onClose} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

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
    if (name === "type") {
      setFilters(prev => ({ ...prev, [name]: value, subType: 'All' }));
    } else {
      setFilters(prev => ({ ...prev, [name]: value }));
    }
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
              {CATEGORIES.map(cat => (
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

const PostPropertyForm = ({ setActivePage, db, userId }) => {
  const [formData, setFormData] = useState({
    title: '', location: '', price: '', description: '', type: 'Residential', subType: 'House', bedrooms: '', bathrooms: '', sqft: '', role: 'Owner', image: null, isPremium: false, isFeatured: false,
  });
  
  const [paytmMessage, setPaytmMessage] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);

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
      setIsModalVisible(true);
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
      await addDoc(collection(db, `artifacts/${appId}/public/data/listings`), newProperty);
      // Add to user's private collection for their dashboard
      await addDoc(collection(db, `artifacts/${appId}/users/${userId}/listings`), newProperty);
      
      setPaytmMessage('Listing submitted for review. It will be visible on the listings page after admin approval.');
      setIsModalVisible(true);
      setTimeout(() => setActivePage('dashboard'), 3000); // Redirect to dashboard after a delay
    } catch (e) {
      console.error("Error adding document: ", e);
      setPaytmMessage('Error posting listing. Please try again.');
      setIsModalVisible(true);
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
                {CATEGORIES.map(cat => (
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
      <Modal 
        show={isModalVisible} 
        title="Listing Status" 
        message={paytmMessage} 
        onClose={() => setIsModalVisible(false)} 
      />
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

const DashboardPage = ({ user, userListings, setActivePage, setSelectedProperty, db }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  const handleDelete = async (listingId) => {
    try {
      // Delete from user's private collection
      await deleteDoc(doc(db, `artifacts/${appId}/users/${user.uid}/listings`, listingId));
      
      // Also delete from public collection (if it exists)
      const q = query(collection(db, `artifacts/${appId}/public/data/listings`), where("id", "==", listingId));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach(async (doc) => {
        await deleteDoc(doc.ref);
      });
      
      setModalMessage("Listing deleted successfully!");
      setIsModalVisible(true);
    } catch (e) {
      console.error("Error deleting document: ", e);
      setModalMessage("Error deleting listing. Please try again.");
      setIsModalVisible(true);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen font-sans py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Welcome, {user.email}</h1>
        <p className="text-gray-600 mb-8">This is your dashboard. You can manage your listings and profile here.</p>
        <p className="text-sm font-mono text-gray-500 mb-8 break-words">User ID: {user.uid}</p>
        <h2 className="text-3xl font-bold text-gray-800 mb-6">My Listings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {userListings.length > 0 ? (
            userListings.map(p => (
              <div key={p.id} className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
                <ListingCard property={p} onClick={() => { setActivePage('details'); setSelectedProperty(p); }} />
                <div className="p-4 flex space-x-2">
                  <button onClick={() => setActivePage('post')} className="flex-1 bg-blue-500 text-white font-bold py-2 px-4 rounded-full hover:bg-blue-600 transition-colors duration-300">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="flex-1 bg-red-500 text-white font-bold py-2 px-4 rounded-full hover:bg-red-600 transition-colors duration-300">
                    Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-600">You have not posted any listings yet. <button onClick={() => setActivePage('post')} className="text-blue-600 font-bold">Post one now!</button></p>
          )}
        </div>
      </div>
      <Modal 
        show={isModalVisible} 
        title="Action Status" 
        message={modalMessage} 
        onClose={() => setIsModalVisible(false)} 
      />
    </div>
  );
};

const AdminPanel = ({ unapprovedListings, setActivePage, setSelectedProperty, db }) => {
  const handleApproval = async (listing, status) => {
    try {
      // Find the public listing to update
      const q = query(collection(db, `artifacts/${appId}/public/data/listings`), where("id", "==", listing.id));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const publicDoc = querySnapshot.docs[0];
        await updateDoc(doc(db, publicDoc.ref.path), { isApproved: status === 'approve' });
      }

      // Also update the user's private listing
      const userDocRef = doc(db, `artifacts/${appId}/users/${listing.userId}/listings`, listing.id);
      await updateDoc(userDocRef, { isApproved: status === 'approve' });

      alert(`Listing ${listing.title} has been ${status === 'approve' ? 'approved' : 'rejected'}.`);
    } catch (e) {
      console.error("Error updating document: ", e);
      alert("Error updating listing. Please try again.");
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen font-sans py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Admin Panel</h1>
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Unapproved Listings</h2>
        {unapprovedListings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {unapprovedListings.map(p => (
              <div key={p.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                <ListingCard property={p} onClick={() => { setActivePage('details'); setSelectedProperty(p); }} />
                <div className="p-4 flex justify-between space-x-2">
                  <button onClick={() => handleApproval(p, 'approve')} className="flex-1 bg-green-600 text-white font-bold py-2 px-4 rounded-full hover:bg-green-700 transition-colors duration-300">
                    Approve
                  </button>
                  <button onClick={() => handleApproval(p, 'reject')} className="flex-1 bg-red-600 text-white font-bold py-2 px-4 rounded-full hover:bg-red-700 transition-colors duration-300">
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No new listings to approve.</p>
        )}
      </div>
    </div>
  );
};


// --- Main App Component ---
const App = () => {
  const [activePage, setActivePage] = useState('home');
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [allProperties, setAllProperties] = useState([]);
  const [userListings, setUserListings] = useState([]);
  const [unapprovedListings, setUnapprovedListings] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);

  // Initialize Firebase and listen for auth state changes
  useEffect(() => {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    // Persist a stable reference to db and auth
    let dbInstance = db;
    let authInstance = auth;
    
    // Auth state listener
    const unsubscribeAuth = onAuthStateChanged(authInstance, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        setUser(null);
      }
      setIsAuthReady(true);
    });

    // Handle initial authentication
    const setupAuth = async () => {
      try {
        if (initialAuthToken) {
          await signInWithCustomToken(authInstance, initialAuthToken);
        } else {
          await signInAnonymously(authInstance);
        }
      } catch (error) {
        console.error("Firebase auth error:", error);
      }
    };
    setupAuth();

    return () => unsubscribeAuth(); // Cleanup auth listener
  }, []);

  // Fetch data with Firestore listeners after auth is ready
  useEffect(() => {
    if (!isAuthReady) return;

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    const userId = auth.currentUser?.uid || 'anonymous';
    const ADMIN_UID = 'ADMIN_USER_ID'; // Replace with the actual UID of your admin user

    // Listen to all public listings
    const unsubscribePublic = onSnapshot(collection(db, `artifacts/${appId}/public/data/listings`), (snapshot) => {
      const listings = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAllProperties(listings);
    }, (error) => {
      console.error("Error fetching public listings:", error);
    });

    // Listen to the current user's private listings
    const unsubscribeUser = onSnapshot(collection(db, `artifacts/${appId}/users/${userId}/listings`), (snapshot) => {
      const listings = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUserListings(listings);
    }, (error) => {
      console.error("Error fetching user listings:", error);
    });

    // Listen to unapproved listings for the admin panel
    const unapprovedQuery = query(collection(db, `artifacts/${appId}/public/data/listings`), where("isApproved", "==", false));
    const unsubscribeAdmin = onSnapshot(unapprovedQuery, (snapshot) => {
      const listings = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUnapprovedListings(listings);
    }, (error) => {
      console.error("Error fetching unapproved listings:", error);
    });

    return () => {
      unsubscribePublic();
      unsubscribeUser();
      unsubscribeAdmin();
    };
  }, [isAuthReady]);
  
  const isAdmin = user && user.email === 'admin@propertybazar.com'; // Simple check for demo

  // Helper function to render pages based on activePage state
  const renderPage = () => {
    switch (activePage) {
      case 'home':
        return <HomePage allProperties={allProperties} setActivePage={setActivePage} setSelectedProperty={setSelectedProperty} />;
      case 'listings':
        return <ListingsPage allProperties={allProperties} setActivePage={setActivePage} setSelectedProperty={setSelectedProperty} categories={CATEGORIES} />;
      case 'details':
        return <PropertyDetails property={selectedProperty} onBack={() => setActivePage('listings')} />;
      case 'about':
        return <div className="max-w-4xl mx-auto"><div className="py-12 bg-white shadow-lg rounded-lg px-8"><h2 className="text-3xl font-bold text-gray-800 mb-4">About Us</h2><p className="text-gray-600 leading-relaxed">Property Bazar is a leading platform connecting buyers, sellers, and renters. We strive to provide a seamless and transparent experience for all your real estate needs. Our mission is to make finding your perfect property as easy as possible.</p></div></div>;
      case 'post':
        if (!user) return <LoginPage setActivePage={setActivePage} auth={getAuth()} />;
        return <PostPropertyForm setActivePage={setActivePage} db={getFirestore()} userId={user.uid} categories={CATEGORIES} />;
      case 'login':
        return <LoginPage setActivePage={setActivePage} auth={getAuth()} />;
      case 'signup':
        return <SignUpPage setActivePage={setActivePage} auth={getAuth()} />;
      case 'dashboard':
        if (!user) return <LoginPage setActivePage={setActivePage} auth={getAuth()} />;
        return <DashboardPage user={user} userListings={userListings} setActivePage={setActivePage} setSelectedProperty={setSelectedProperty} db={getFirestore()} />;
      case 'admin':
        if (!user || !isAdmin) return <div className="text-center p-10">Access Denied</div>;
        return <AdminPanel unapprovedListings={unapprovedListings} setActivePage={setActivePage} setSelectedProperty={setSelectedProperty} db={getFirestore()} />;
      default:
        return <HomePage allProperties={allProperties} setActivePage={setActivePage} setSelectedProperty={setSelectedProperty} />;
    }
  };

  const handleLogout = async () => {
    const auth = getAuth();
    try {
      await signOut(auth);
      setUser(null);
      setActivePage('home');
    } catch (e) {
      console.error("Logout error:", e);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col antialiased">
      {/* Header/Navbar */}
      <header className="w-full bg-white shadow-md rounded-b-lg sticky top-0 z-50">
        <nav className="container mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          <button onClick={() => setActivePage('home')} className="text-2xl font-bold text-blue-600 flex items-center space-x-2">
            <HouseIcon />
            <span>Property Bazar</span>
          </button>
          <div className="flex flex-wrap justify-center space-x-2 sm:space-x-4">
            <button onClick={() => setActivePage('home')} className="text-gray-600 hover:text-blue-600 font-medium transition-colors duration-300 p-2 rounded-md">Home</button>
            <button onClick={() => setActivePage('listings')} className="text-gray-600 hover:text-blue-600 font-medium transition-colors duration-300 p-2 rounded-md">Listings</button>
            <button onClick={() => setActivePage('about')} className="text-gray-600 hover:text-blue-600 font-medium transition-colors duration-300 p-2 rounded-md">About Us</button>
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
            {user && (
              <button onClick={handleLogout} className="bg-red-600 text-white py-2 px-4 rounded-full hover:bg-red-700 transition-colors duration-300">
                Logout
              </button>
            )}
          </div>
        </nav>
      </header>

      {/* Main content area */}
      <main className="container mx-auto px-4 py-8 flex-grow">
        {isAuthReady ? renderPage() : <div className="text-center p-20">Loading...</div>}
      </main>
      
      {/* Footer */}
      <footer className="w-full bg-white shadow-inner rounded-t-lg mt-8">
        <div className="container mx-auto px-4 py-6 text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} Property Bazar. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default App;
