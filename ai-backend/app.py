from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
from models.chatbot_model import LegalChatbot
import logging

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Initialize the chatbot model
chatbot = LegalChatbot()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'LegalMate AI Chatbot',
        'version': '1.0.0'
    })

@app.route('/chat', methods=['POST'])
def chat():
    """Main chat endpoint for legal queries"""
    try:
        data = request.get_json()
        
        if not data or 'message' not in data:
            return jsonify({
                'error': 'Message is required'
            }), 400
        
        user_message = data['message']
        logger.info(f"Received message: {user_message}")
        
        # Get response from chatbot
        response = chatbot.get_response(user_message)
        
        logger.info(f"Generated response: {response}")
        
        return jsonify({
            'response': response,
            'confidence': chatbot.get_confidence(),
            'suggested_action': chatbot.get_suggested_action()
        })
        
    except Exception as e:
        logger.error(f"Error processing chat request: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'message': 'Failed to process your request. Please try again.'
        }), 500

@app.route('/train', methods=['POST'])
def train_model():
    """Endpoint to retrain the model with new data"""
    try:
        data = request.get_json()
        
        if not data or 'training_data' not in data:
            return jsonify({
                'error': 'Training data is required'
            }), 400
        
        # Train the model with new data
        success = chatbot.train_with_data(data['training_data'])
        
        if success:
            return jsonify({
                'message': 'Model trained successfully'
            })
        else:
            return jsonify({
                'error': 'Failed to train model'
            }), 500
            
    except Exception as e:
        logger.error(f"Error training model: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'message': 'Failed to train model'
        }), 500

@app.route('/knowledge', methods=['GET'])
def get_knowledge_base():
    """Get information about the knowledge base"""
    try:
        knowledge_info = chatbot.get_knowledge_base_info()
        return jsonify(knowledge_info)
        
    except Exception as e:
        logger.error(f"Error getting knowledge base info: {str(e)}")
        return jsonify({
            'error': 'Internal server error'
        }), 500

@app.route('/suggestions', methods=['POST'])
def get_suggestions():
    """Get suggested questions based on user input"""
    try:
        data = request.get_json()
        
        if not data or 'query' not in data:
            return jsonify({
                'error': 'Query is required'
            }), 400
        
        suggestions = chatbot.get_suggestions(data['query'])
        
        return jsonify({
            'suggestions': suggestions
        })
        
    except Exception as e:
        logger.error(f"Error getting suggestions: {str(e)}")
        return jsonify({
            'error': 'Internal server error'
        }), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'error': 'Not found',
        'message': 'The requested resource was not found'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'error': 'Internal server error',
        'message': 'Something went wrong on our end'
    }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    debug = os.environ.get('FLASK_ENV') == 'development'
    
    logger.info(f"Starting LegalMate AI Chatbot on port {port}")
    app.run(host='0.0.0.0', port=port, debug=debug) 