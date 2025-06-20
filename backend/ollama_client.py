import requests
import json

class OllamaClient:
    def __init__(self, base_url="http://localhost:11434"):
        self.base_url = base_url
        self.model = "llama3:8b"  # Updated to use the installed model
    
    def get_priority_score(self, patient_data):
        """
        Get priority score from Ollama based on patient data
        Returns a score from 1-5 where 5 is most urgent
        """
        
        # Extract relevant patient information
        name = patient_data.get('name', 'Unknown')
        age = patient_data.get('age', 0)
        gender = patient_data.get('gender', 'Unknown')
        symptoms = patient_data.get('symptoms', '')
        vitals = patient_data.get('vitals', {})
        medical_history = patient_data.get('medical_history', '')
        
        # Format vitals for the prompt
        vitals_text = ""
        if vitals:
            vitals_text = f"Vital Signs: "
            if 'blood_pressure' in vitals:
                vitals_text += f"BP: {vitals['blood_pressure']}, "
            if 'heart_rate' in vitals:
                vitals_text += f"HR: {vitals['heart_rate']}, "
            if 'temperature' in vitals:
                vitals_text += f"Temp: {vitals['temperature']}, "
            if 'oxygen_saturation' in vitals:
                vitals_text += f"O2 Sat: {vitals['oxygen_saturation']}, "
            vitals_text = vitals_text.rstrip(", ")
        
        # Create the prompt for medical triage
        prompt = f"""
You are a medical triage AI assistant. Based on the following patient information, rate their urgency on a scale of 1-5 where:
1 = Very Low Priority (can wait)
2 = Low Priority 
3 = Medium Priority
4 = High Priority
5 = Critical Priority (immediate attention needed)

Patient Information:
- Name: {name}
- Age: {age}
- Gender: {gender}
- Symptoms: {symptoms}
- {vitals_text}
- Medical History: {medical_history}

Consider factors like:
- Vital sign abnormalities
- Symptom severity and urgency
- Age-related risk factors
- Medical history complications
- Time-sensitive conditions

Respond with ONLY a number between 1-5 representing the priority level.
"""
        
        try:
            # Make request to Ollama
            response = requests.post(
                f"{self.base_url}/api/generate",
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False
                },
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                # Extract the response text and try to parse the number
                response_text = result.get('response', '').strip()
                
                # Try to extract a number from the response
                import re
                numbers = re.findall(r'\b[1-5]\b', response_text)
                if numbers:
                    return float(numbers[0])
                else:
                    # Fallback: try to parse any number
                    all_numbers = re.findall(r'\b\d+(?:\.\d+)?\b', response_text)
                    if all_numbers:
                        score = float(all_numbers[0])
                        # Clamp to 1-5 range
                        return max(1, min(5, score))
                    else:
                        # Default fallback
                        return 3.0
            else:
                print(f"Ollama API error: {response.status_code}")
                return 3.0
                
        except Exception as e:
            print(f"Error calling Ollama: {e}")
            return 3.0
    
    def test_connection(self):
        """Test if Ollama is running and accessible"""
        try:
            response = requests.get(f"{self.base_url}/api/tags", timeout=5)
            return response.status_code == 200
        except:
            return False
    
    def extract_patient_info(self, description):
        """
        Extract structured patient information from natural language description
        Returns a dictionary with patient data
        """
        
        prompt = f"""
You are a medical AI assistant. Extract structured patient information from the following description and return it as a JSON object.

Description: {description}

Extract the following information:
- name: Patient's name (if mentioned, otherwise "Unknown Patient")
- age: Patient's age as a number
- gender: Patient's gender (Male/Female/Other)
- symptoms: Patient's symptoms and complaints
- vitals: Vital signs as an object with keys like blood_pressure, heart_rate, temperature, oxygen_saturation
- medical_history: Any relevant medical history mentioned

Rules:
- If age is not mentioned, use 0
- If gender is not mentioned, use empty string
- If vitals are mentioned, extract them (e.g., "BP 160/100" becomes "blood_pressure": "160/100")
- Temperature should be in Fahrenheit
- Heart rate should be a number
- Oxygen saturation should be a number (percentage)

Return ONLY a valid JSON object with this structure:
{{
  "name": "string",
  "age": number,
  "gender": "string",
  "symptoms": "string",
  "vitals": {{
    "blood_pressure": "string",
    "heart_rate": number,
    "temperature": number,
    "oxygen_saturation": number
  }},
  "medical_history": "string"
}}

Example input: "A 45-year-old male with chest pain, BP 160/100, HR 95, complaining of shortness of breath for 2 hours"
Example output: {{
  "name": "Unknown Patient",
  "age": 45,
  "gender": "Male",
  "symptoms": "chest pain, shortness of breath for 2 hours",
  "vitals": {{
    "blood_pressure": "160/100",
    "heart_rate": 95,
    "temperature": null,
    "oxygen_saturation": null
  }},
  "medical_history": ""
}}
"""
        
        try:
            # Make request to Ollama
            response = requests.post(
                f"{self.base_url}/api/generate",
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False
                },
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                response_text = result.get('response', '').strip()
                
                # Try to extract JSON from the response
                import re
                import json
                
                # Look for JSON in the response
                json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
                if json_match:
                    try:
                        patient_data = json.loads(json_match.group())
                        
                        # Clean up the data
                        if patient_data.get('name') == 'Unknown Patient' or not patient_data.get('name'):
                            patient_data['name'] = 'Unknown Patient'
                        
                        # Ensure age is a number
                        try:
                            patient_data['age'] = int(patient_data.get('age', 0))
                        except:
                            patient_data['age'] = 0
                        
                        # Clean up vitals
                        vitals = patient_data.get('vitals', {})
                        if vitals:
                            # Convert heart rate to number
                            if 'heart_rate' in vitals and vitals['heart_rate']:
                                try:
                                    vitals['heart_rate'] = int(vitals['heart_rate'])
                                except:
                                    vitals['heart_rate'] = 'N/A'
                            else:
                                vitals['heart_rate'] = 'N/A'
                            
                            # Convert temperature to number
                            if 'temperature' in vitals and vitals['temperature']:
                                try:
                                    vitals['temperature'] = float(vitals['temperature'])
                                except:
                                    vitals['temperature'] = 'N/A'
                            else:
                                vitals['temperature'] = 'N/A'
                            
                            # Convert oxygen saturation to number
                            if 'oxygen_saturation' in vitals and vitals['oxygen_saturation']:
                                try:
                                    vitals['oxygen_saturation'] = int(vitals['oxygen_saturation'])
                                except:
                                    vitals['oxygen_saturation'] = 'N/A'
                            else:
                                vitals['oxygen_saturation'] = 'N/A'
                            
                            # Ensure blood pressure is a string or N/A
                            if 'blood_pressure' in vitals and vitals['blood_pressure']:
                                vitals['blood_pressure'] = str(vitals['blood_pressure'])
                            else:
                                vitals['blood_pressure'] = 'N/A'
                        else:
                            # Initialize vitals with N/A if not present
                            vitals = {
                                'blood_pressure': 'N/A',
                                'heart_rate': 'N/A',
                                'temperature': 'N/A',
                                'oxygen_saturation': 'N/A'
                            }
                            patient_data['vitals'] = vitals
                        
                        return patient_data
                        
                    except json.JSONDecodeError as e:
                        print(f"Error parsing JSON: {e}")
                        return None
                else:
                    print("No JSON found in response")
                    return None
            else:
                print(f"Ollama API error: {response.status_code}")
                return None
                
        except Exception as e:
            print(f"Error extracting patient info: {e}")
            return None 