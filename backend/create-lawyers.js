const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
require('dotenv').config()

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/legalmate')
    console.log('MongoDB Connected')
  } catch (error) {
    console.error('MongoDB connection error:', error)
    process.exit(1)
  }
}

const lawyers = [
  {
    name: 'Adv. Ahmed Hassan Khan',
    email: 'ahmed.hassan@legalmate.com',
    phone: '+92-300-1234567',
    address: 'Gulberg III, Lahore, Punjab',
    specialization: 'Civil Law',
    barNumber: 'LHR-2024-001',
    hourlyRate: 2500,
    bio: 'Senior civil lawyer with 15+ years of experience in property disputes, contract law, and civil litigation. Specialized in real estate transactions and family property matters.',
    languages: ['English', 'Urdu', 'Punjabi'],
    isVerified: true,
    isActive: true
  },
  {
    name: 'Adv. Fatima Zahra Ali',
    email: 'fatima.zahra@legalmate.com',
    phone: '+92-300-2345678',
    address: 'DHA Phase 6, Karachi, Sindh',
    specialization: 'Family Law',
    barNumber: 'KHI-2024-002',
    hourlyRate: 3000,
    bio: 'Expert family lawyer specializing in divorce cases, child custody, and inheritance disputes. Known for compassionate approach and high success rate in family court.',
    languages: ['English', 'Urdu', 'Sindhi'],
    isVerified: true,
    isActive: true
  },
  {
    name: 'Adv. Muhammad Usman Raza',
    email: 'usman.raza@legalmate.com',
    phone: '+92-300-3456789',
    address: 'F-8/1, Islamabad, Federal Territory',
    specialization: 'Corporate Law',
    barNumber: 'ISB-2024-003',
    hourlyRate: 4000,
    bio: 'Corporate law expert with expertise in mergers, acquisitions, and business contracts. Advising major corporations and startups on legal compliance and business structuring.',
    languages: ['English', 'Urdu'],
    isVerified: true,
    isActive: true
  },
  {
    name: 'Adv. Sara Ahmed Malik',
    email: 'sara.ahmed@legalmate.com',
    phone: '+92-300-4567890',
    address: 'Cantt Area, Rawalpindi, Punjab',
    specialization: 'Criminal Law',
    barNumber: 'RWP-2024-004',
    hourlyRate: 2800,
    bio: 'Criminal defense attorney with extensive experience in serious criminal cases. Specialized in white-collar crimes, drug offenses, and criminal appeals.',
    languages: ['English', 'Urdu', 'Punjabi'],
    isVerified: true,
    isActive: true
  },
  {
    name: 'Adv. Bilal Khan Niazi',
    email: 'bilal.khan@legalmate.com',
    phone: '+92-300-5678901',
    address: 'Model Town, Faisalabad, Punjab',
    specialization: 'Labor Law',
    barNumber: 'FSD-2024-005',
    hourlyRate: 1800,
    bio: 'Labor law specialist helping workers and employers with employment disputes, workplace safety, and workers compensation cases.',
    languages: ['English', 'Urdu', 'Punjabi'],
    isVerified: true,
    isActive: true
  },
  {
    name: 'Adv. Hina Shah Bukhari',
    email: 'hina.shah@legalmate.com',
    phone: '+92-300-6789012',
    address: 'Bahria Town, Multan, Punjab',
    specialization: 'Property Law',
    barNumber: 'MUL-2024-006',
    hourlyRate: 2200,
    bio: 'Property law expert specializing in real estate transactions, land disputes, and property registration. Helping clients with property documentation and legal compliance.',
    languages: ['English', 'Urdu', 'Punjabi'],
    isVerified: true,
    isActive: true
  },
  {
    name: 'Adv. Imran Ali Qureshi',
    email: 'imran.ali@legalmate.com',
    phone: '+92-300-7890123',
    address: 'Defence Phase 5, Karachi, Sindh',
    specialization: 'Tax Law',
    barNumber: 'KHI-2024-007',
    hourlyRate: 3500,
    bio: 'Tax law specialist helping individuals and businesses with tax planning, compliance, and dispute resolution. Expert in corporate tax and international tax matters.',
    languages: ['English', 'Urdu'],
    isVerified: true,
    isActive: true
  },
  {
    name: 'Adv. Khadija Khan Lodhi',
    email: 'khadija.khan@legalmate.com',
    phone: '+92-300-8901234',
    address: 'Gulshan-e-Iqbal, Karachi, Sindh',
    specialization: 'Banking Law',
    barNumber: 'KHI-2024-008',
    hourlyRate: 3200,
    bio: 'Banking law expert specializing in financial regulations, loan disputes, and banking compliance matters. Advising banks and financial institutions.',
    languages: ['English', 'Urdu'],
    isVerified: true,
    isActive: true
  },
  {
    name: 'Adv. Nadeem Ahmed Sheikh',
    email: 'nadeem.ahmed@legalmate.com',
    phone: '+92-300-9012345',
    address: 'Saddar, Peshawar, KPK',
    specialization: 'Immigration Law',
    barNumber: 'PES-2024-009',
    hourlyRate: 2600,
    bio: 'Immigration law specialist helping clients with visa applications, citizenship, and immigration appeals. Expert in US, UK, and Canadian immigration.',
    languages: ['English', 'Urdu', 'Pashto'],
    isVerified: true,
    isActive: true
  },
  {
    name: 'Adv. Rabia Hassan Khan',
    email: 'rabia.hassan@legalmate.com',
    phone: '+92-300-0123456',
    address: 'University Town, Peshawar, KPK',
    specialization: 'Healthcare Law',
    barNumber: 'PES-2024-010',
    hourlyRate: 2400,
    bio: 'Healthcare law expert specializing in medical malpractice, healthcare regulations, and patient rights. Advising hospitals and medical professionals.',
    languages: ['English', 'Urdu', 'Pashto'],
    isVerified: true,
    isActive: true
  },
  {
    name: 'Adv. Saad Malik Butt',
    email: 'saad.malik@legalmate.com',
    phone: '+92-300-1234568',
    address: 'Cantt, Sialkot, Punjab',
    specialization: 'Intellectual Property',
    barNumber: 'SKT-2024-011',
    hourlyRate: 3800,
    bio: 'IP law expert specializing in patents, trademarks, copyright, and trade secrets protection. Helping businesses protect their intellectual property rights.',
    languages: ['English', 'Urdu'],
    isVerified: true,
    isActive: true
  },
  {
    name: 'Adv. Tahira Raza Hashmi',
    email: 'tahira.raza@legalmate.com',
    phone: '+92-300-2345679',
    address: 'Model Town, Gujranwala, Punjab',
    specialization: 'Environmental Law',
    barNumber: 'GJW-2024-012',
    hourlyRate: 2000,
    bio: 'Environmental law specialist helping clients with environmental compliance, pollution cases, and green initiatives. Advising on environmental regulations.',
    languages: ['English', 'Urdu', 'Punjabi'],
    isVerified: true,
    isActive: true
  },
  {
    name: 'Adv. Waqas Ali Khan',
    email: 'waqas.ali@legalmate.com',
    phone: '+92-300-3456780',
    address: 'Cantt, Attock, Punjab',
    specialization: 'Sports Law',
    barNumber: 'ATK-2024-013',
    hourlyRate: 2200,
    bio: 'Sports law specialist helping athletes, teams, and sports organizations with contracts and legal matters. Expert in sports regulations and player rights.',
    languages: ['English', 'Urdu'],
    isVerified: true,
    isActive: true
  },
  {
    name: 'Adv. Ayesha Malik Khan',
    email: 'ayesha.malik@legalmate.com',
    phone: '+92-300-4567891',
    address: 'DHA, Bahawalpur, Punjab',
    specialization: 'Education Law',
    barNumber: 'BWP-2024-014',
    hourlyRate: 1800,
    bio: 'Education law expert specializing in student rights, school policies, and educational institution compliance. Helping students and educational institutions.',
    languages: ['English', 'Urdu', 'Punjabi'],
    isVerified: true,
    isActive: true
  },
  {
    name: 'Adv. Zainab Fatima Ali',
    email: 'zainab.fatima@legalmate.com',
    phone: '+92-300-5678902',
    address: 'Cantt, Jhang, Punjab',
    specialization: 'Real Estate Law',
    barNumber: 'JHG-2024-015',
    hourlyRate: 2400,
    bio: 'Real estate law specialist helping clients with property transactions, development projects, and land disputes. Expert in property documentation.',
    languages: ['English', 'Urdu', 'Punjabi'],
    isVerified: true,
    isActive: true
  },
  {
    name: 'Adv. Hamza Khan Lodhi',
    email: 'hamza.khan@legalmate.com',
    phone: '+92-300-6789013',
    address: 'Model Town, Okara, Punjab',
    specialization: 'Contract Law',
    barNumber: 'OKR-2024-016',
    hourlyRate: 2600,
    bio: 'Contract law expert specializing in business contracts, employment agreements, and commercial disputes. Helping businesses with legal documentation.',
    languages: ['English', 'Urdu', 'Punjabi'],
    isVerified: true,
    isActive: true
  },
  {
    name: 'Adv. Mariam Ahmed Khan',
    email: 'mariam.ahmed@legalmate.com',
    phone: '+92-300-7890124',
    address: 'Cantt, Rahim Yar Khan, Punjab',
    specialization: 'Insurance Law',
    barNumber: 'RYK-2024-017',
    hourlyRate: 2200,
    bio: 'Insurance law specialist helping clients with insurance claims, policy disputes, and insurance compliance matters. Expert in life and property insurance.',
    languages: ['English', 'Urdu', 'Punjabi'],
    isVerified: true,
    isActive: true
  },
  {
    name: 'Adv. Omar Hassan Sheikh',
    email: 'omar.hassan@legalmate.com',
    phone: '+92-300-8901235',
    address: 'DHA, Dera Ghazi Khan, Punjab',
    specialization: 'Media Law',
    barNumber: 'DGK-2024-018',
    hourlyRate: 2000,
    bio: 'Media law expert specializing in defamation, copyright, and media regulations. Advising media companies and content creators on legal matters.',
    languages: ['English', 'Urdu', 'Punjabi'],
    isVerified: true,
    isActive: true
  },
  {
    name: 'Adv. Fatima Zahra Raza',
    email: 'fatima.zahra@legalmate.com',
    phone: '+92-300-9012346',
    address: 'Model Town, Mianwali, Punjab',
    specialization: 'Technology Law',
    barNumber: 'MWL-2024-019',
    hourlyRate: 3000,
    bio: 'Technology law expert specializing in data privacy, cybersecurity, and digital rights. Helping tech companies and startups with legal compliance.',
    languages: ['English', 'Urdu'],
    isVerified: true,
    isActive: true
  },
  {
    name: 'Adv. Usman Khan Niazi',
    email: 'usman.khan@legalmate.com',
    phone: '+92-300-0123457',
    address: 'Cantt, Sargodha, Punjab',
    specialization: 'International Law',
    barNumber: 'SGD-2024-020',
    hourlyRate: 3500,
    bio: 'International law expert specializing in cross-border transactions, international trade, and diplomatic matters. Advising on international legal frameworks.',
    languages: ['English', 'Urdu', 'Arabic'],
    isVerified: true,
    isActive: true
  },
  {
    name: 'Adv. Aisha Malik Khan',
    email: 'aisha.malik@legalmate.com',
    phone: '+92-300-1234569',
    address: 'DHA, Sahiwal, Punjab',
    specialization: 'Constitutional Law',
    barNumber: 'SHW-2024-021',
    hourlyRate: 2800,
    bio: 'Constitutional law expert specializing in fundamental rights, constitutional challenges, and public interest litigation. Protecting citizens\' constitutional rights.',
    languages: ['English', 'Urdu', 'Punjabi'],
    isVerified: true,
    isActive: true
  },
  {
    name: 'Adv. Bilal Ahmed Hashmi',
    email: 'bilal.ahmed@legalmate.com',
    phone: '+92-300-2345670',
    address: 'Model Town, Vehari, Punjab',
    specialization: 'Administrative Law',
    barNumber: 'VEH-2024-022',
    hourlyRate: 2200,
    bio: 'Administrative law expert specializing in government regulations, administrative decisions, and public service matters. Helping citizens with government legal issues.',
    languages: ['English', 'Urdu', 'Punjabi'],
    isVerified: true,
    isActive: true
  },
  {
    name: 'Adv. Hira Khan Lodhi',
    email: 'hira.khan@legalmate.com',
    phone: '+92-300-3456781',
    address: 'Cantt, Pakpattan, Punjab',
    specialization: 'Arbitration Law',
    barNumber: 'PKP-2024-023',
    hourlyRate: 2400,
    bio: 'Arbitration law expert specializing in alternative dispute resolution, commercial arbitration, and mediation services. Helping parties resolve disputes amicably.',
    languages: ['English', 'Urdu', 'Punjabi'],
    isVerified: true,
    isActive: true
  },
  {
    name: 'Adv. Zain Khan Sheikh',
    email: 'zain.khan@legalmate.com',
    phone: '+92-300-4567892',
    address: 'DHA, Lodhran, Punjab',
    specialization: 'Securities Law',
    barNumber: 'LDR-2024-024',
    hourlyRate: 3200,
    bio: 'Securities law expert specializing in stock market regulations, investment laws, and financial compliance. Advising investors and financial institutions.',
    languages: ['English', 'Urdu', 'Punjabi'],
    isVerified: true,
    isActive: true
  },
  {
    name: 'Adv. Mariam Fatima Ali',
    email: 'mariam.fatima@legalmate.com',
    phone: '+92-300-5678903',
    address: 'Model Town, Kasur, Punjab',
    specialization: 'Consumer Law',
    barNumber: 'KSR-2024-025',
    hourlyRate: 1800,
    bio: 'Consumer law expert specializing in consumer rights, product liability, and consumer protection matters. Helping consumers with legal issues.',
    languages: ['English', 'Urdu', 'Punjabi'],
    isVerified: true,
    isActive: true
  }
]

const createLawyers = async () => {
  try {
    await connectDB()
    
    // Delete existing lawyers
    await mongoose.connection.db.collection('users').deleteMany({ role: 'lawyer' })
    console.log('🗑️ Removed existing lawyers')
    
    // Hash password for all lawyers
    const salt = await bcrypt.genSalt(12)
    const hashedPassword = await bcrypt.hash('password123', salt)
    
    // Create lawyer documents
    const lawyerDocuments = lawyers.map(lawyer => ({
      ...lawyer,
      password: hashedPassword,
      role: 'lawyer',
      createdAt: new Date(),
      updatedAt: new Date()
    }))
    
    // Insert all lawyers
    const result = await mongoose.connection.db.collection('users').insertMany(lawyerDocuments)
    console.log(`✅ Created ${result.insertedCount} lawyers successfully!`)
    
    console.log('\n🎉 Lawyers Created:')
    lawyers.forEach((lawyer, index) => {
      console.log(`${index + 1}. ${lawyer.name} - ${lawyer.specialization} (PKR ${lawyer.hourlyRate}/hour)`)
    })
    
    console.log('\n📧 Login Credentials:')
    console.log('All lawyers use: password123')
    console.log('Example: ahmed.hassan@legalmate.com / password123')
    
    process.exit(0)
  } catch (error) {
    console.error('Error creating lawyers:', error)
    process.exit(1)
  }
}

createLawyers() 