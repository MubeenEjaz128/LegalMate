import React, { useState, useEffect } from 'react'
import { Search, Filter, Star, MapPin, Clock, DollarSign, Users, Award, Phone, Mail } from 'lucide-react'
import { lawyerAPI } from '../services/api'
import LawyerCard from '../components/Lawyer/LawyerCard'
import SearchFilters from '../components/Lawyer/SearchFilters'

const SearchPage = () => {
  const [filters, setFilters] = useState({
    specialization: '',
    location: '',
    priceRange: '',
    rating: '',
    language: ''
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [lawyers, setLawyers] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const searchLawyers = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Map frontend filters to backend parameters
      const backendFilters = {
        ...filters,
        address: filters.location, // Map location to address for backend
        search: searchTerm
      }
      delete backendFilters.location // Remove location as backend expects address
      
      console.log('Searching with filters:', backendFilters)
      const response = await lawyerAPI.search(backendFilters)
      console.log('Search success:', response.data)
      setLawyers(response.data || [])
    } catch (err) {
      console.error('Search error:', err)
      setError(err.message || 'Failed to load lawyers')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    searchLawyers()
  }, [filters, searchTerm])

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  const handleSearch = (e) => {
    e.preventDefault()
    searchLawyers()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header Section */}
      <div className="bg-white shadow-soft">
        <div className="container-custom py-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Find Your Perfect <span className="text-gradient">Lawyer</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Search for verified lawyers specializing in Punjab laws. 
              Get expert legal consultation from qualified professionals.
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSearch} className="relative">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-6 w-6" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, specialization, or location..."
                  className="input-field pl-12 pr-4 py-4 text-lg shadow-soft focus:shadow-medium"
                />
              </div>
              <div className="flex gap-4 mt-4 justify-center">
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                    showFilters 
                      ? 'bg-primary-600 text-white shadow-lg' 
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-primary-50 hover:text-primary-600'
                  }`}
                >
                  <Filter className="h-5 w-5" />
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
                </button>
                <button
                  type="submit"
                  className="btn-primary px-8 py-3"
                >
                  Search Lawyers
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      {showFilters && (
        <div className="bg-white border-b border-gray-100 shadow-sm">
          <div className="container-custom py-6">
            <SearchFilters filters={filters} onFilterChange={handleFilterChange} />
          </div>
        </div>
      )}

      {/* Results Section */}
      <div className="container-custom py-12">
        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-16">
            <div className="loading-spinner w-12 h-12 mx-auto mb-4"></div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Searching for lawyers...</h3>
            <p className="text-gray-600">Please wait while we find the best matches for you.</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="text-center py-16">
            <div className="bg-error-50 border border-error-200 rounded-2xl p-8 max-w-md mx-auto">
              <div className="text-error-600 mb-4">
                <Search className="h-12 w-12 mx-auto mb-4" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error loading lawyers</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={searchLawyers}
                className="btn-primary"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && lawyers.length === 0 && (
          <div className="text-center py-16">
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 max-w-md mx-auto">
              <div className="text-gray-400 mb-4">
                <Search className="h-12 w-12 mx-auto mb-4" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No lawyers found</h3>
              <p className="text-gray-600 mb-4">Try adjusting your search criteria or filters to find more results.</p>
              <button
                onClick={() => {
                  setFilters({
                    specialization: '',
                    location: '',
                    priceRange: '',
                    rating: '',
                    language: ''
                  })
                  setSearchTerm('')
                }}
                className="btn-outline"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}

        {/* Results Grid */}
        {!isLoading && !error && lawyers.length > 0 && (
          <>
            {/* Results Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Found {lawyers.length} lawyer{lawyers.length !== 1 ? 's' : ''}
                </h2>
                <p className="text-gray-600 mt-1">
                  Showing the best matches for your search criteria
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">Sort by:</span>
                <select className="select-field w-auto">
                  <option>Relevance</option>
                  <option>Rating</option>
                  <option>Experience</option>
                  <option>Price</option>
                </select>
              </div>
            </div>

            {/* Lawyers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {lawyers.map((lawyer) => (
                <LawyerCard key={lawyer._id} lawyer={lawyer} />
              ))}
            </div>

            {/* Load More */}
            <div className="text-center mt-12">
              <button className="btn-outline px-8 py-3">
                Load More Lawyers
              </button>
            </div>
          </>
        )}
      </div>

      {/* Features Section */}
      <div className="bg-white py-16">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose LegalMate Lawyers?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              All our lawyers are verified professionals with extensive experience in Punjab laws
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Verified Credentials</h3>
              <p className="text-gray-600">All lawyers are verified with proper bar council credentials and background checks.</p>
            </div>
            
            <div className="text-center">
              <div className="bg-success-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-success-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Expert Specialization</h3>
              <p className="text-gray-600">Find lawyers specialized in specific areas of Punjab law and legal procedures.</p>
            </div>
            
            <div className="text-center">
              <div className="bg-warning-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-warning-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">24/7 Availability</h3>
              <p className="text-gray-600">Book consultations at your convenience with flexible scheduling options.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SearchPage 