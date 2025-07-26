import re
import json
import logging
from typing import Dict, List, Tuple, Optional
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import nltk
from nltk.tokenize import word_tokenize, sent_tokenize
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer

# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')

try:
    nltk.data.find('corpora/wordnet')
except LookupError:
    nltk.download('wordnet')

logger = logging.getLogger(__name__)

class LegalChatbot:
    def __init__(self):
        """Initialize the legal chatbot with Punjab law knowledge base"""
        self.lemmatizer = WordNetLemmatizer()
        self.stop_words = set(stopwords.words('english'))
        self.vectorizer = TfidfVectorizer(
            max_features=1000,
            stop_words='english',
            ngram_range=(1, 2)
        )
        
        # Initialize knowledge base
        self.knowledge_base = self._initialize_knowledge_base()
        self.vectorizer.fit([qa['question'] for qa in self.knowledge_base])
        
        # Confidence tracking
        self.current_confidence = 0.0
        self.suggested_action = None
        
        logger.info("LegalChatbot initialized successfully")

    def _initialize_knowledge_base(self) -> List[Dict]:
        """Initialize the knowledge base with Punjab law FAQs"""
        return [
            {
                "question": "What is the process for filing a civil case in Punjab?",
                "answer": "To file a civil case in Punjab, you need to: 1) Prepare a plaint with your claims, 2) Submit it to the appropriate civil court, 3) Pay the required court fees, 4) Serve notice to the defendant. The case will be listed for hearing after the defendant files their written statement.",
                "category": "civil_procedure",
                "confidence_threshold": 0.7
            },
            {
                "question": "How can I file a criminal complaint in Punjab?",
                "answer": "To file a criminal complaint in Punjab: 1) Visit the nearest police station, 2) Submit a written complaint (FIR), 3) Provide all relevant details and evidence, 4) Get a copy of the FIR. For serious offenses, you can also approach the magistrate directly.",
                "category": "criminal_law",
                "confidence_threshold": 0.7
            },
            {
                "question": "What are the grounds for divorce in Pakistan?",
                "answer": "Under Pakistani law, grounds for divorce include: 1) Cruelty, 2) Desertion for 4+ years, 3) Adultery, 4) Impotency, 5) Mental illness, 6) Conversion to another religion, 7) Failure to maintain wife for 2+ years. The process involves filing a petition in family court.",
                "category": "family_law",
                "confidence_threshold": 0.8
            },
            {
                "question": "What is the procedure for property registration in Punjab?",
                "answer": "Property registration in Punjab requires: 1) Original title documents, 2) NOC from relevant authorities, 3) Payment of stamp duty and registration fees, 4) Physical presence of parties, 5) Submission to the Sub-Registrar's office. The process typically takes 7-15 days.",
                "category": "property_law",
                "confidence_threshold": 0.7
            },
            {
                "question": "How do I apply for a business license in Punjab?",
                "answer": "To apply for a business license in Punjab: 1) Visit the local municipal corporation, 2) Submit application with required documents, 3) Pay applicable fees, 4) Obtain NOC from relevant departments, 5) Complete inspection if required. Processing time varies by business type.",
                "category": "business_law",
                "confidence_threshold": 0.6
            },
            {
                "question": "What are my rights as a tenant in Punjab?",
                "answer": "Tenant rights in Punjab include: 1) Right to peaceful possession, 2) Right to essential services, 3) Protection from arbitrary eviction, 4) Right to reasonable rent increases, 5) Right to sublet with landlord's permission. Tenancy disputes are handled by rent controllers.",
                "category": "property_law",
                "confidence_threshold": 0.8
            },
            {
                "question": "How can I file a consumer complaint?",
                "answer": "To file a consumer complaint: 1) Approach the Consumer Protection Council, 2) Submit complaint with supporting documents, 3) Pay nominal fee, 4) Attend hearings as scheduled. The council can order compensation, replacement, or refund for defective goods/services.",
                "category": "consumer_law",
                "confidence_threshold": 0.7
            },
            {
                "question": "What is the process for obtaining a driving license in Punjab?",
                "answer": "To get a driving license in Punjab: 1) Apply online or at licensing authority, 2) Submit required documents and photos, 3) Pay fees, 4) Take written test, 5) Complete practical driving test, 6) Receive license if tests are passed. The process takes 2-4 weeks.",
                "category": "administrative_law",
                "confidence_threshold": 0.8
            },
            {
                "question": "How do I report police misconduct in Punjab?",
                "answer": "To report police misconduct: 1) File complaint with the Police Complaints Authority, 2) Submit detailed complaint with evidence, 3) Contact the Provincial Ombudsman, 4) Approach the Human Rights Commission. Keep copies of all complaints and correspondence.",
                "category": "administrative_law",
                "confidence_threshold": 0.7
            },
            {
                "question": "What are the inheritance laws in Pakistan?",
                "answer": "Pakistani inheritance laws follow Islamic principles: 1) Sons get double the share of daughters, 2) Spouse gets 1/4 or 1/8 depending on other heirs, 3) Parents get 1/6 each if no children, 4) Distribution requires court order for property transfer.",
                "category": "family_law",
                "confidence_threshold": 0.8
            }
        ]

    def preprocess_text(self, text: str) -> str:
        """Preprocess text for better matching"""
        # Convert to lowercase
        text = text.lower()
        
        # Remove special characters
        text = re.sub(r'[^\w\s]', '', text)
        
        # Tokenize and lemmatize
        tokens = word_tokenize(text)
        tokens = [self.lemmatizer.lemmatize(token) for token in tokens if token not in self.stop_words]
        
        return ' '.join(tokens)

    def calculate_similarity(self, query: str, question: str) -> float:
        """Calculate similarity between query and question"""
        try:
            # Preprocess both texts
            processed_query = self.preprocess_text(query)
            processed_question = self.preprocess_text(question)
            
            # Vectorize
            vectors = self.vectorizer.transform([processed_query, processed_question])
            
            # Calculate cosine similarity
            similarity = cosine_similarity(vectors[0:1], vectors[1:2])[0][0]
            
            return similarity
        except Exception as e:
            logger.error(f"Error calculating similarity: {e}")
            return 0.0

    def get_response(self, user_message: str) -> str:
        """Get response for user message"""
        try:
            # Find best matching question
            best_match = None
            best_similarity = 0.0
            
            for qa in self.knowledge_base:
                similarity = self.calculate_similarity(user_message, qa['question'])
                
                if similarity > best_similarity:
                    best_similarity = similarity
                    best_match = qa
            
            # Set confidence and suggested action
            self.current_confidence = best_similarity
            
            if best_similarity >= 0.6 and best_match:
                self.suggested_action = None
                return best_match['answer']
            elif best_similarity >= 0.3:
                self.suggested_action = "connect_lawyer"
                return f"I can provide some general information, but for specific legal advice about your situation, I recommend consulting with a qualified lawyer. Your query seems to be about legal matters that require professional expertise."
            else:
                self.suggested_action = "connect_lawyer"
                return "I'm sorry, but I don't have specific information about that legal matter. For accurate legal advice tailored to your situation, I recommend consulting with a qualified lawyer who can provide personalized guidance based on the details of your case."
                
        except Exception as e:
            logger.error(f"Error getting response: {e}")
            self.current_confidence = 0.0
            self.suggested_action = "connect_lawyer"
            return "I'm having trouble processing your request right now. Please try rephrasing your question or consider consulting with a lawyer for immediate assistance."

    def get_confidence(self) -> float:
        """Get confidence score for the last response"""
        return self.current_confidence

    def get_suggested_action(self) -> Optional[str]:
        """Get suggested action for the last response"""
        return self.suggested_action

    def get_suggestions(self, query: str) -> List[str]:
        """Get suggested questions based on user query"""
        try:
            suggestions = []
            query_lower = query.lower()
            
            # Find questions that contain keywords from the query
            for qa in self.knowledge_base:
                question_lower = qa['question'].lower()
                if any(word in question_lower for word in query_lower.split()):
                    suggestions.append(qa['question'])
            
            # Return top 3 suggestions
            return suggestions[:3]
            
        except Exception as e:
            logger.error(f"Error getting suggestions: {e}")
            return []

    def train_with_data(self, training_data: List[Dict]) -> bool:
        """Train the model with new data"""
        try:
            # Add new Q&A pairs to knowledge base
            for item in training_data:
                if 'question' in item and 'answer' in item:
                    self.knowledge_base.append({
                        'question': item['question'],
                        'answer': item['answer'],
                        'category': item.get('category', 'general'),
                        'confidence_threshold': item.get('confidence_threshold', 0.6)
                    })
            
            # Retrain vectorizer with new data
            self.vectorizer.fit([qa['question'] for qa in self.knowledge_base])
            
            logger.info(f"Model trained with {len(training_data)} new examples")
            return True
            
        except Exception as e:
            logger.error(f"Error training model: {e}")
            return False

    def get_knowledge_base_info(self) -> Dict:
        """Get information about the knowledge base"""
        categories = {}
        for qa in self.knowledge_base:
            category = qa.get('category', 'general')
            categories[category] = categories.get(category, 0) + 1
        
        return {
            'total_qa_pairs': len(self.knowledge_base),
            'categories': categories,
            'supported_topics': list(categories.keys())
        } 