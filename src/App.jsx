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

const Trash2Icon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check-circle"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M9 11l3 3L22 4"/></svg>
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
      console.error("Sign up error:", e);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-sm">
        <h2 className="text-3xl font-bold text-gray-800 text-center mb-6">Sign Up</h2>
        <p className="text-center text-gray-600 mb-6">Create a new account to post properties.</p>
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
            Sign Up
          </button>
        </form>
        <p className="mt-6 text-center text-gray-600 text-sm">
          Already have an account? <button onClick={() => setActivePage('login')} className="text-blue-500 hover:text-blue-700 font-bold">Login now</button>
        </p>
      </div>
    </div>
  );
};

const DashboardPage = ({ user, myListings, db, setActivePage, setSelectedProperty }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalTitle, setModalTitle] = useState('');

  const handleDeleteListing = async (listingId) => {
    try {
      await deleteDoc(doc(db, `artifacts/${appId}/users/${user.uid}/listings`, listingId));
      setModalTitle("Success!");
      setModalMessage("Listing deleted successfully from your dashboard.");
      setIsModalVisible(true);
    } catch (e) {
      setModalTitle("Error!");
      setModalMessage("Failed to delete listing. Please try again.");
      setIsModalVisible(true);
      console.error("Error deleting document: ", e);
    }
  };

  const handleToggleSoldOut = async (listingId, isSoldOut) => {
    try {
      await updateDoc(doc(db, `artifacts/${appId}/users/${user.uid}/listings`, listingId), {
        isSoldOut: !isSoldOut
      });
      // Find the public document to update its sold-out status as well
      const publicListingsRef = collection(db, `artifacts/${appId}/public/data/listings`);
      const q = query(publicListingsRef, where("id", "==", listingId));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        querySnapshot.forEach(async (d) => {
          await updateDoc(doc(db, `artifacts/${appId}/public/data/listings`, d.id), {
            isSoldOut: !isSoldOut
          });
        });
      }
      setModalTitle("Success!");
      setModalMessage("Listing status updated successfully.");
      setIsModalVisible(true);
    } catch (e) {
      setModalTitle("Error!");
      setModalMessage("Failed to update listing status. Please try again.");
      setIsModalVisible(true);
      console.error("Error updating document: ", e);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 font-sans">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">My Dashboard</h1>
        <p className="text-gray-600 mb-8">
          Welcome back! Here you can manage your property listings. Your user ID is: <span className="font-mono bg-gray-200 px-2 py-1 rounded-md">{user.uid}</span>
        </p>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">My Listings</h2>
          {myListings.length === 0 ? (
            <div className="text-center py-12 text-gray-600">
              <p className="mb-4">You have not posted any properties yet.</p>
              <button onClick={() => setActivePage('post')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full">
                Post Your First Property
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {myListings.map(p => (
                <div key={p.id} className="bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden">
                  <div className="relative">
                    <img
                      src={p.image}
                      alt={p.title}
                      className="w-full h-48 object-cover"
                      onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/400x300/e5e7eb/6b7280?text=Listing+Image'; }}
                    />
                    {p.isApproved ? (
                      <span className="absolute top-2 right-2 bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-md flex items-center">
                        <CheckIcon /> Approved
                      </span>
                    ) : (
                      <span className="absolute top-2 right-2 bg-yellow-500 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-md">
                        Pending
                      </span>
                    )}
                    {p.isSoldOut && (
                      <span className="absolute bottom-2 left-2 bg-red-600 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-md">
                        Sold Out
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-xl font-bold text-gray-800 truncate mb-1">{p.title}</h3>
                    <p className="text-sm text-gray-500 mb-2">{p.location}</p>
                    <p className="text-lg font-semibold text-blue-600 mb-4">{p.price}</p>
                    <div className="flex flex-col space-y-2 mt-4">
                      <button onClick={() => handleToggleSoldOut(p.id, p.isSoldOut)} className={`py-2 px-4 rounded-full font-bold ${p.isSoldOut ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'} text-white`}>
                        {p.isSoldOut ? 'Mark as Available' : 'Mark as Sold Out'}
                      </button>
                      <button onClick={() => handleDeleteListing(p.id)} className="flex items-center justify-center space-x-2 py-2 px-4 rounded-full font-bold bg-gray-200 hover:bg-gray-300 text-gray-800">
                        <Trash2Icon />
                        <span>Delete Listing</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Modal show={isModalVisible} title={modalTitle} message={modalMessage} onClose={() => setIsModalVisible(false)} />
    </div>
  );
};

const AdminPanel = ({ allProperties, db }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalTitle, setModalTitle] = useState('');

  const handleApprove = async (listingId) => {
    try {
      // Find the public document to update it
      const publicListingsRef = collection(db, `artifacts/${appId}/public/data/listings`);
      const q = query(publicListingsRef, where("id", "==", listingId));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        querySnapshot.forEach(async (d) => {
          await updateDoc(doc(db, `artifacts/${appId}/public/data/listings`, d.id), {
            isApproved: true
          });
        });
      }
      setModalTitle("Success!");
      setModalMessage("Listing approved successfully.");
      setIsModalVisible(true);
    } catch (e) {
      setModalTitle("Error!");
      setModalMessage("Failed to approve listing. Please try again.");
      setIsModalVisible(true);
      console.error("Error approving document: ", e);
    }
  };

  const handleDelete = async (listingId) => {
    try {
      // Find and delete the public document
      const publicListingsRef = collection(db, `artifacts/${appId}/public/data/listings`);
      const q = query(publicListingsRef, where("id", "==", listingId));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        querySnapshot.forEach(async (d) => {
          await deleteDoc(doc(db, `artifacts/${appId}/public/data/listings`, d.id));
        });
      }
      setModalTitle("Success!");
      setModalMessage("Listing deleted successfully.");
      setIsModalVisible(true);
    } catch (e) {
      setModalTitle("Error!");
      setModalMessage("Failed to delete listing. Please try again.");
      setIsModalVisible(true);
      console.error("Error deleting document: ", e);
    }
  };
  
  const pendingListings = allProperties.filter(p => !p.isApproved);

  return (
    <div className="min-h-screen bg-gray-100 p-4 font-sans">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Admin Panel</h1>
        <p className="text-gray-600 mb-8">Review and manage all property listings submitted by users.</p>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Pending Listings ({pendingListings.length})</h2>
          {pendingListings.length === 0 ? (
            <p className="text-gray-600">No pending listings to review.</p>
          ) : (
            <div className="space-y-6">
              {pendingListings.map(p => (
                <div key={p.id} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between shadow-sm">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{p.title}</h3>
                    <p className="text-sm text-gray-500">{p.location}</p>
                    <p className="text-xs text-gray-400">Posted by User ID: <span className="font-mono">{p.userId}</span></p>
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => handleApprove(p.id)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-full">Approve</button>
                    <button onClick={() => handleDelete(p.id)} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-full">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Modal show={isModalVisible} title={modalTitle} message={modalMessage} onClose={() => setIsModalVisible(false)} />
    </div>
  );
};

const AboutUsPage = () => (
  <div className="bg-gray-100 min-h-screen font-sans">
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-6 text-center">About Property Bazar</h1>
        <p className="text-gray-700 leading-relaxed mb-6">
          Property Bazar is India's premier online platform dedicated to helping you buy, sell, and rent properties with ease. Our mission is to simplify the real estate process by providing a transparent, efficient, and user-friendly platform that connects buyers, sellers, and brokers.
        </p>
        <p className="text-gray-700 leading-relaxed mb-6">
          Whether you're looking for your dream home, a commercial space for your business, or agricultural land for investment, Property Bazar offers a wide range of verified listings to suit your needs. We believe in providing accurate information and a seamless experience, ensuring you can make informed decisions.
        </p>
        <p className="text-gray-700 leading-relaxed mb-6">
          Our team is committed to innovation and customer satisfaction. We continuously work to enhance our platform with new features and tools to make your property journey as smooth as possible. Thank you for choosing Property Bazar.
        </p>
        <div className="text-center mt-8">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full shadow-lg">
            Contact Our Team
          </button>
        </div>
      </div>
    </div>
  </div>
);

// --- Main Application Component ---
const App = () => {
  const [activePage, setActivePage] = useState('home');
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [user, setUser] = useState(null);
  const [allProperties, setAllProperties] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  // Initialize Firebase and set up auth listener
  useEffect(() => {
    const initializeFirebase = async () => {
      try {
        const app = initializeApp(firebaseConfig);
        const firestore = getFirestore(app);
        const firebaseAuth = getAuth(app);
        setDb(firestore);
        setAuth(firebaseAuth);

        // Sign in with custom token or anonymously
        if (initialAuthToken) {
          await signInWithCustomToken(firebaseAuth, initialAuthToken);
        } else {
          await signInAnonymously(firebaseAuth);
        }
      } catch (e) {
        console.error("Error initializing Firebase:", e);
      }
    };
    initializeFirebase();
  }, []);

  // Set up auth state change listener and fetch data
  useEffect(() => {
    if (!auth || !db) return;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const uid = currentUser.uid;
        // Check for admin status. In a real app, this would be more secure.
        if (uid === "admin-user-id-placeholder") {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }

        // Fetch user's private listings
        const myListingsRef = collection(db, `artifacts/${appId}/users/${uid}/listings`);
        const unsubscribeMyListings = onSnapshot(myListingsRef, (snapshot) => {
          const listingsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setMyListings(listingsData);
        }, (error) => {
          console.error("Error fetching user listings:", error);
        });
        return () => unsubscribeMyListings();
      } else {
        setMyListings([]);
        setIsAdmin(false);
      }
    });

    // Fetch all public listings for the main page
    const publicListingsRef = collection(db, `artifacts/${appId}/public/data/listings`);
    const unsubscribeAllListings = onSnapshot(publicListingsRef, (snapshot) => {
      const listingsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllProperties(listingsData);
    }, (error) => {
      console.error("Error fetching public listings:", error);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeAllListings();
    };
  }, [auth, db, appId]);


  const handleLogout = async () => {
    try {
      await signOut(auth);
      setActivePage('home');
      setMyListings([]);
    } catch (e) {
      console.error("Logout error:", e);
    }
  };

  const renderPage = () => {
    switch (activePage) {
      case 'home':
        return <HomePage allProperties={allProperties} setActivePage={setActivePage} setSelectedProperty={setSelectedProperty} />;
      case 'listings':
        return <ListingsPage allProperties={allProperties} setActivePage={setActivePage} setSelectedProperty={setSelectedProperty} categories={CATEGORIES} />;
      case 'details':
        return selectedProperty ? <PropertyDetails property={selectedProperty} onBack={() => setActivePage('listings')} /> : null;
      case 'post':
        return <PostPropertyForm setActivePage={setActivePage} db={db} userId={user?.uid} />;
      case 'dashboard':
        return user ? <DashboardPage user={user} myListings={myListings} db={db} setActivePage={setActivePage} setSelectedProperty={setSelectedProperty} /> : <LoginPage setActivePage={setActivePage} auth={auth} />;
      case 'admin':
        return isAdmin ? <AdminPanel allProperties={allProperties} db={db} /> : <div className="text-center p-8">Access Denied.</div>;
      case 'login':
        return <LoginPage setActivePage={setActivePage} auth={auth} />;
      case 'signup':
        return <SignUpPage setActivePage={setActivePage} auth={auth} />;
      case 'about':
        return <AboutUsPage />;
      default:
        return <HomePage allProperties={allProperties} setActivePage={setActivePage} setSelectedProperty={setSelectedProperty} />;
    }
  };

  if (!auth || !db) {
    return <div className="flex justify-center items-center min-h-screen bg-gray-100"><p className="text-gray-600">Loading...</p></div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header/Navbar */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <HouseIcon />
              <button onClick={() => setActivePage('home')} className="text-2xl font-extrabold text-blue-600 ml-2">
                Property Bazar
              </button>
            </div>
            <nav className="flex items-center space-x-4">
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
              {user ? (
                <button onClick={handleLogout} className="bg-red-600 text-white py-2 px-4 rounded-full hover:bg-red-700 transition-colors duration-300">
                  Logout
                </button>
              ) : (
                <button onClick={() => setActivePage('login')} className="bg-gray-800 text-white py-2 px-4 rounded-full hover:bg-gray-900 transition-colors duration-300 flex items-center space-x-2">
                  <UserIcon />
                  <span>Login</span>
                </button>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main className="min-h-screen">
        {renderPage()}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-gray-400">© 2024 Property Bazar. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
