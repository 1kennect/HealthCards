import React, { useState, useEffect } from 'react'
import PatientCard from './components/PatientCard'
import AddPatient from './components/AddPatient'

function App() {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)
  const [chatInput, setChatInput] = useState('')
  const [isProcessingChat, setIsProcessingChat] = useState(false)
  const [completedPatients, setCompletedPatients] = useState([])

  // Fetch patients from backend
  const fetchPatients = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:5001/api/patients')
      if (!response.ok) {
        throw new Error('Failed to fetch patients')
      }
      const data = await response.json()
      setPatients(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Add new patient
  const addPatient = async (patientData) => {
    try {
      const response = await fetch('http://localhost:5001/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patientData),
      })

      if (!response.ok) {
        throw new Error('Failed to add patient')
      }

      const newPatient = await response.json()
      setPatients(prev => [...prev, newPatient])
      setShowAddModal(false)
    } catch (err) {
      setError(err.message)
    }
  }

  // Update patient
  const updatePatient = async (patientId, patientData) => {
    try {
      const response = await fetch(`http://localhost:5001/api/patients/${patientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patientData),
      })

      if (!response.ok) {
        throw new Error('Failed to update patient')
      }

      const updatedPatient = await response.json()
      setPatients(prev => 
        prev.map(patient => 
          patient.id === patientId ? updatedPatient : patient
        )
      )
    } catch (err) {
      setError(err.message)
    }
  }

  // Drag and drop handlers
  const handleDragStart = (index) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (index) => {
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index)
    }
  }

  const handleDrop = (draggedIndex, dropIndex) => {
    if (draggedIndex === dropIndex) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }

    const newPatients = [...patients]
    const draggedPatient = newPatients[draggedIndex]
    
    // Remove the dragged item
    newPatients.splice(draggedIndex, 1)
    
    // Insert at the new position
    newPatients.splice(dropIndex, 0, draggedPatient)
    
    setPatients(newPatients)
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  // Generate patient from chat
  const handleGeneratePatient = (patientData) => {
    setPatients(prev => [...prev, patientData])
  }

  // Complete patient
  const handleCompletePatient = (patientId) => {
    const patientToComplete = patients.find(p => p.id === patientId)
    if (patientToComplete) {
      // Add completion timestamp
      const completedPatient = {
        ...patientToComplete,
        completed_at: new Date().toISOString()
      }
      
      // Move to completed list
      setCompletedPatients(prev => [completedPatient, ...prev])
      
      // Remove from active list
      setPatients(prev => prev.filter(p => p.id !== patientId))
    }
  }

  // Reactivate patient (move from completed back to active)
  const handleReactivatePatient = (patientId) => {
    const patientToReactivate = completedPatients.find(p => p.id === patientId)
    if (patientToReactivate) {
      // Remove completion timestamp
      const reactivatedPatient = {
        ...patientToReactivate,
        completed_at: undefined
      }
      delete reactivatedPatient.completed_at
      
      // Move back to active list
      setPatients(prev => [...prev, reactivatedPatient])
      
      // Remove from completed list
      setCompletedPatients(prev => prev.filter(p => p.id !== patientId))
    }
  }

  // Handle chat input submission
  const handleChatSubmit = async (e) => {
    e.preventDefault()
    if (!chatInput.trim() || isProcessingChat) return

    const description = chatInput.trim()
    setChatInput('')
    setIsProcessingChat(true)

    try {
      const response = await fetch('http://localhost:5001/api/generate-patient', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate patient')
      }

      const result = await response.json()
      
      if (result.success) {
        handleGeneratePatient(result.patient)
        setError(null)
      } else {
        setError('Could not create patient from description. Please try being more specific.')
      }
    } catch (err) {
      setError('Error generating patient: ' + err.message)
    } finally {
      setIsProcessingChat(false)
    }
  }

  // Sort patients by priority score (highest first) - only if not manually reordered
  const sortedPatients = [...patients].sort((a, b) => b.priority_score - a.priority_score)

  const getPriorityClass = (level) => {
    const levelLower = level.toLowerCase()
    if (levelLower.includes('critical')) return 'critical'
    if (levelLower.includes('high')) return 'high'
    if (levelLower.includes('medium')) return 'medium'
    if (levelLower.includes('low')) return 'low'
    return 'very-low'
  }

  useEffect(() => {
    fetchPatients()
  }, [])

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading patients...</div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="header">
        <h1>HealthCards</h1>
        <p>AI-Powered Healthcare Priority System</p>
      </div>

      <div className="chat-section">
        <div className="chat-input-container">
          <form onSubmit={handleChatSubmit} className="chat-form">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Describe a patient (e.g., '45-year-old male with chest pain, BP 160/100, HR 95')"
              disabled={isProcessingChat}
              className="chat-input-field"
            />
            <button 
              type="submit" 
              disabled={!chatInput.trim() || isProcessingChat}
              className="chat-submit-btn"
            >
              {isProcessingChat ? 'Processing...' : 'Add Patient'}
            </button>
          </form>
        </div>
      </div>

      {error && (
        <div className="error">
          Error: {error}
          <button onClick={() => setError(null)} style={{ marginLeft: '10px', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>
            ✕
          </button>
        </div>
      )}

      <button 
        className="add-patient-btn"
        onClick={() => setShowAddModal(true)}
      >
        + Add New Patient
      </button>

      <div className="main-content">
        <div className="active-patients">
          <h3>Active Patients ({sortedPatients.length})</h3>
          <div 
            className="priority-queue"
            onDragOver={(e) => {
              e.preventDefault()
              e.dataTransfer.dropEffect = 'move'
              e.currentTarget.style.borderColor = '#28a745'
              e.currentTarget.style.backgroundColor = 'rgba(40, 167, 69, 0.1)'
            }}
            onDragLeave={(e) => {
              e.currentTarget.style.borderColor = 'transparent'
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
            onDrop={(e) => {
              e.preventDefault()
              e.currentTarget.style.borderColor = 'transparent'
              e.currentTarget.style.backgroundColor = 'transparent'
              const patientId = e.dataTransfer.getData('text/plain')
              if (patientId) {
                handleReactivatePatient(patientId)
              }
            }}
          >
            {sortedPatients.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#6c757d' }}>
                No patients in queue. Add a patient to get started.
              </div>
            ) : (
              sortedPatients.map((patient, index) => (
                <React.Fragment key={patient.id}>
                  {dragOverIndex === index && draggedIndex !== null && draggedIndex !== index && (
                    <div 
                      className="drop-indicator"
                      style={{
                        height: '4px',
                        background: 'linear-gradient(90deg, #667eea, #764ba2)',
                        borderRadius: '2px',
                        margin: '10px 0',
                        gridColumn: '1 / -1'
                      }}
                    />
                  )}
                  <PatientCard
                    patient={patient}
                    index={index}
                    onUpdate={updatePatient}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onDragEnd={handleDragEnd}
                    onComplete={handleCompletePatient}
                    isDragging={draggedIndex === index}
                  />
                </React.Fragment>
              ))
            )}
          </div>
        </div>

        <div className="completed-patients">
          <h3>Completed ({completedPatients.length})</h3>
          <div 
            className="completed-queue"
            onDragOver={(e) => {
              e.preventDefault()
              e.dataTransfer.dropEffect = 'move'
            }}
            onDrop={(e) => {
              e.preventDefault()
              const patientId = e.dataTransfer.getData('text/plain')
              if (patientId) {
                handleReactivatePatient(patientId)
              }
            }}
          >
            {completedPatients.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
                No completed patients yet.
              </div>
            ) : (
              completedPatients.map((patient, index) => (
                <div 
                  key={patient.id} 
                  className="completed-card"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', patient.id)
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                  style={{ cursor: 'grab' }}
                >
                  <div className="completed-card-header">
                    <div className="completed-patient-name">{patient.name || 'Unknown Patient'}</div>
                    <div className="completion-time">
                      {new Date(patient.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div className="completed-card-details">
                    <div className="completed-info">
                      <span>{patient.age} years old</span>
                      <span>•</span>
                      <span>{patient.gender || 'Not specified'}</span>
                      <span>•</span>
                      <span className={`completed-priority ${getPriorityClass(patient.priority_level)}`}>
                        {patient.priority_level}
                      </span>
                    </div>
                    <div className="completed-symptoms">
                      {patient.symptoms || 'No symptoms recorded'}
                    </div>
                  </div>
                  <div className="completed-card-hint">
                    Drag back to reactivate
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showAddModal && (
        <AddPatient
          onAdd={addPatient}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  )
}

export default App 