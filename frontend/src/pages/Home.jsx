import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, Users, Shield, MessageCircle, Star, ArrowRight, Scale, X, CheckCircle, Clock, Award, Globe } from 'lucide-react'
import ChatbotInterface from '../components/Chatbot/ChatbotInterface'

const fadeIn = (delay = 0) => ({
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { delay, duration: 0.6 } }
})

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.2 }
  }
}

const Home = () => {
  const [showChatbot, setShowChatbot] = useState(false)

  const features = [
    {
      icon: <Search className="h-8 w-8" />,
      title: 'Find Expert Lawyers',
      description: 'Search and connect with verified lawyers specializing in Punjab laws',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: <MessageCircle className="h-8 w-8" />,
      title: 'AI Legal Assistant',
      description: 'Get instant answers to basic legal questions using our AI chatbot',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: 'Secure Consultations',
      description: 'Book appointments and have secure video consultations with lawyers',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: 'Verified Professionals',
      description: 'All lawyers are verified with proper bar council credentials',
      color: 'from-orange-500 to-orange-600'
    }
  ]

  const stats = [
    { number: '500+', label: 'Verified Lawyers', icon: <Users className="h-6 w-6" /> },
    { number: '10,000+', label: 'Successful Cases', icon: <CheckCircle className="h-6 w-6" /> },
    { number: '24/7', label: 'AI Support', icon: <Clock className="h-6 w-6" /> },
    { number: '95%', label: 'Client Satisfaction', icon: <Star className="h-6 w-6" /> }
  ]

  const testimonials = [
    {
      name: 'Ahmed Khan',
      role: 'Business Owner',
      content: 'LegalMate helped me find the perfect lawyer for my business registration. The AI assistant answered all my initial questions!',
      rating: 5
    },
    {
      name: 'Fatima Ali',
      role: 'Property Owner',
      content: 'The consultation process was smooth and professional. I got expert legal advice without leaving my home.',
      rating: 5
    },
    {
      name: 'Muhammad Hassan',
      role: 'Entrepreneur',
      content: 'The platform is user-friendly and the lawyers are highly qualified. Highly recommended for legal services.',
      rating: 5
    }
  ]

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`h-4 w-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
    ))
  }

  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <motion.section 
      initial="hidden"
      animate="visible"
      variants={fadeIn(0)}
      delay={0.2}
      className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
        
        <div className="relative container-custom text-center text-white z-10">
          <div className="max-w-4xl mx-auto">
            {/* Logo and Brand */}
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white bg-opacity-20 rounded-2xl backdrop-blur-sm mb-6">
                <Scale className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-5xl md:text-7xl font-bold mb-6 text-shadow">
                LegalMate
                <span className="block text-2xl md:text-3xl font-normal mt-4 text-primary-100 opacity-90">
                  AI-Powered Legal Consultation
                </span>
              </h1>
            </div>
            
            <p className="text-xl md:text-2xl text-primary-100 mb-12 max-w-3xl mx-auto leading-relaxed">
              Connect with verified lawyers, get instant AI assistance, and access 
              legal expertise focused on Punjab laws - all in one platform.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link
                to="/search"
                className="group bg-white text-primary-600 hover:bg-gray-50 px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-3xl inline-flex items-center"
              >
                Find a Lawyer
                <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button
                onClick={() => setShowChatbot(true)}
                className="border-2 border-white text-white hover:bg-white hover:text-primary-600 px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 backdrop-blur-sm"
              >
                Ask AI Assistant
              </button>
            </div>
          </div>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section 
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="py-24 bg-white">
        <div className="container-custom">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Why Choose <span className="text-gradient">LegalMate</span>?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              We combine cutting-edge AI technology with verified legal expertise 
              to provide you with the best legal consultation experience.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group">
                <div className={`bg-gradient-to-br ${feature.color} w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-white shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-center leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Stats Section */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                  <div className="text-primary-600 mb-4 flex justify-center">
                    {stat.icon}
                  </div>
                  <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                    {stat.number}
                  </div>
                  <div className="text-gray-600 font-medium">
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-white">
        <div className="container-custom">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get legal help in three simple steps
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center group">
              <div className="bg-gradient-to-br from-primary-600 to-primary-700 text-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl font-bold shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Ask AI Assistant
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Start with our AI chatbot to get instant answers to basic legal questions and understand your situation better.
              </p>
            </div>
            
            <div className="text-center group">
              <div className="bg-gradient-to-br from-primary-600 to-primary-700 text-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl font-bold shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Find a Lawyer
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Search for verified lawyers based on specialization, location, and experience that matches your needs.
              </p>
            </div>
            
            <div className="text-center group">
              <div className="bg-gradient-to-br from-primary-600 to-primary-700 text-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl font-bold shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Book Consultation
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Schedule an appointment and have a secure video consultation with your chosen lawyer from anywhere.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container-custom">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              What Our Clients Say
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Real experiences from satisfied clients who found legal help through LegalMate
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="card-hover">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-primary-700 rounded-full flex items-center justify-center text-white font-semibold mr-4">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-700 mb-4 leading-relaxed">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center">
                  {renderStars(testimonial.rating)}
                  <span className="ml-2 text-sm text-gray-600">({testimonial.rating}.0)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="container-custom text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Get Legal Help?
            </h2>
            <p className="text-xl text-primary-100 mb-12 max-w-2xl mx-auto leading-relaxed">
              Join thousands of people who trust LegalMate for their legal consultation needs. 
              Get started today and experience the future of legal services.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link
                to="/register"
                className="bg-white text-primary-600 hover:bg-gray-50 px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-3xl"
              >
                Get Started Free
              </Link>
              <Link
                to="/search"
                className="border-2 border-white text-white hover:bg-white hover:text-primary-600 px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 transform hover:scale-105"
              >
                Browse Lawyers
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container-custom">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center mr-3">
                  <Scale className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold">LegalMate</span>
              </div>
              <p className="text-gray-400 leading-relaxed">
                Making legal consultation accessible and intelligent for Pakistan.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/search" className="hover:text-white transition-colors">Find Lawyers</Link></li>
                <li><Link to="/test" className="hover:text-white transition-colors">AI Assistant</Link></li>
                <li><Link to="/dashboard" className="hover:text-white transition-colors">Consultations</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/test" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link to="/test" className="hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link to="/test" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Connect</h4>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Globe className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 LegalMate. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* AI Chatbot Modal */}
      {showChatbot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">AI Legal Assistant</h3>
              <button
                onClick={() => setShowChatbot(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              <ChatbotInterface />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Home