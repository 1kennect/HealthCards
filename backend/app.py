from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
from datetime import datetime
from ollama_client import OllamaClient

app = Flask(__name__)
CORS(app)

# Initialize Ollama client
ollama_client = OllamaClient()

# Data file path
DATA_FILE = 'data/patients.json'

def load_patients():
    """Load patients from JSON file"""
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'r') as f:
            return json.load(f)
    return []

def save_patients(patients):
    """Save patients to JSON file"""
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    with open(DATA_FILE, 'w') as f:
        json.dump(patients, f, indent=2)

@app.route('/api/patients', methods=['GET'])
def get_patients():
    """Get all patients"""
    patients = load_patients()
    return jsonify(patients)

@app.route('/api/patients', methods=['POST'])
def add_patient():
    """Add a new patient"""
    data = request.json
    
    # Generate patient ID
    patients = load_patients()
    patient_id = str(len(patients) + 1)
    
    # Create patient object
    patient = {
        'id': patient_id,
        'name': data.get('name', ''),
        'age': data.get('age', 0),
        'gender': data.get('gender', ''),
        'symptoms': data.get('symptoms', ''),
        'vitals': data.get('vitals', {}),
        'medical_history': data.get('medical_history', ''),
        'arrival_time': datetime.now().isoformat(),
        'priority_score': 0,
        'priority_level': 'Pending'
    }
    
    # Get AI priority score
    try:
        priority_score = ollama_client.get_priority_score(patient)
        patient['priority_score'] = priority_score
        patient['priority_level'] = get_priority_level(priority_score)
    except Exception as e:
        print(f"Error getting priority score: {e}")
        patient['priority_score'] = 3
        patient['priority_level'] = 'Medium'
    
    patients.append(patient)
    save_patients(patients)
    
    return jsonify(patient), 201

@app.route('/api/patients/<patient_id>', methods=['PUT'])
def update_patient(patient_id):
    """Update a patient"""
    data = request.json
    patients = load_patients()
    
    for patient in patients:
        if patient['id'] == patient_id:
            # Update patient data
            for key, value in data.items():
                if key != 'id':  # Don't allow ID changes
                    patient[key] = value
            
            # Recalculate priority if vitals or symptoms changed
            if 'vitals' in data or 'symptoms' in data:
                try:
                    priority_score = ollama_client.get_priority_score(patient)
                    patient['priority_score'] = priority_score
                    patient['priority_level'] = get_priority_level(priority_score)
                except Exception as e:
                    print(f"Error getting priority score: {e}")
            
            save_patients(patients)
            return jsonify(patient)
    
    return jsonify({'error': 'Patient not found'}), 404

@app.route('/api/priority', methods=['POST'])
def get_priority():
    """Get priority score for patient data"""
    data = request.json
    try:
        priority_score = ollama_client.get_priority_score(data)
        priority_level = get_priority_level(priority_score)
        return jsonify({
            'priority_score': priority_score,
            'priority_level': priority_level
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/generate-patient', methods=['POST'])
def generate_patient():
    """Generate patient from natural language description"""
    data = request.json
    description = data.get('description', '')
    
    if not description:
        return jsonify({'success': False, 'error': 'No description provided'}), 400
    
    try:
        # Use Ollama to extract patient information from description
        patient_data = ollama_client.extract_patient_info(description)
        
        if not patient_data:
            return jsonify({'success': False, 'error': 'Could not extract patient information'}), 400
        
        # Generate patient ID
        patients = load_patients()
        patient_id = str(len(patients) + 1)
        
        # Create patient object
        patient = {
            'id': patient_id,
            'name': patient_data.get('name', 'Unknown Patient'),
            'age': patient_data.get('age', 0),
            'gender': patient_data.get('gender', ''),
            'symptoms': patient_data.get('symptoms', ''),
            'vitals': patient_data.get('vitals', {}),
            'medical_history': patient_data.get('medical_history', ''),
            'arrival_time': datetime.now().isoformat(),
            'priority_score': 0,
            'priority_level': 'Pending'
        }
        
        # Get AI priority score
        try:
            priority_score = ollama_client.get_priority_score(patient)
            patient['priority_score'] = priority_score
            patient['priority_level'] = get_priority_level(priority_score)
        except Exception as e:
            print(f"Error getting priority score: {e}")
            patient['priority_score'] = 3
            patient['priority_level'] = 'Medium'
        
        # Save to patients list
        patients.append(patient)
        save_patients(patients)
        
        return jsonify({
            'success': True,
            'patient': patient
        })
        
    except Exception as e:
        print(f"Error generating patient: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

def get_priority_level(score):
    """Convert priority score to level"""
    if score >= 4.5:
        return 'Critical'
    elif score >= 3.5:
        return 'High'
    elif score >= 2.5:
        return 'Medium'
    elif score >= 1.5:
        return 'Low'
    else:
        return 'Very Low'

if __name__ == '__main__':
    app.run(debug=True, port=5001, host='0.0.0.0') 