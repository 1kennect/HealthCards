import React, { useState } from 'react'

function AddPatient({ onAdd, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    symptoms: '',
    medical_history: '',
    vitals: {
      blood_pressure: '',
      heart_rate: '',
      temperature: '',
      oxygen_saturation: ''
    }
  })

  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Convert age to number and clean up vitals
      const patientData = {
        ...formData,
        age: parseInt(formData.age) || 0,
        vitals: Object.fromEntries(
          Object.entries(formData.vitals).filter(([_, value]) => value !== '')
        )
      }

      await onAdd(patientData)
    } catch (error) {
      console.error('Failed to add patient:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleVitalChange = (vital, value) => {
    setFormData(prev => ({
      ...prev,
      vitals: {
        ...prev.vitals,
        [vital]: value
      }
    }))
  }

  return (
    <div className="modal">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">Add New Patient</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Patient Name *</label>
            <input
              type="text"
              className="form-input"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter patient name"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Age</label>
            <input
              type="number"
              className="form-input"
              value={formData.age}
              onChange={(e) => handleInputChange('age', e.target.value)}
              placeholder="Enter age"
              min="0"
              max="150"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Gender</label>
            <select
              className="form-input"
              value={formData.gender}
              onChange={(e) => handleInputChange('gender', e.target.value)}
            >
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Symptoms *</label>
            <textarea
              className="form-textarea"
              value={formData.symptoms}
              onChange={(e) => handleInputChange('symptoms', e.target.value)}
              placeholder="Describe patient symptoms..."
              required
            />
          </div>

          <div className="vitals-section">
            <h4>Vital Signs (Optional)</h4>
            <div className="vitals-grid-form">
              <div className="form-group">
                <label className="form-label">Blood Pressure</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.vitals.blood_pressure}
                  onChange={(e) => handleVitalChange('blood_pressure', e.target.value)}
                  placeholder="120/80"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Heart Rate (bpm)</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.vitals.heart_rate}
                  onChange={(e) => handleVitalChange('heart_rate', e.target.value)}
                  placeholder="72"
                  min="40"
                  max="200"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Temperature (°F)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  value={formData.vitals.temperature}
                  onChange={(e) => handleVitalChange('temperature', e.target.value)}
                  placeholder="98.6"
                  min="90"
                  max="110"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Oxygen Saturation (%)</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.vitals.oxygen_saturation}
                  onChange={(e) => handleVitalChange('oxygen_saturation', e.target.value)}
                  placeholder="98"
                  min="70"
                  max="100"
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Medical History</label>
            <textarea
              className="form-textarea"
              value={formData.medical_history}
              onChange={(e) => handleInputChange('medical_history', e.target.value)}
              placeholder="Relevant medical history, allergies, medications..."
            />
          </div>

          <button
            type="submit"
            className="submit-btn"
            disabled={loading || !formData.name || !formData.symptoms}
          >
            {loading ? 'Adding Patient...' : 'Add Patient'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default AddPatient 